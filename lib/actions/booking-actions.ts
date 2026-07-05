'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { generateNextInvoiceNumber, upsertInvoice } from '@/lib/actions/accounting-actions';
import { revalidatePath } from 'next/cache';
import {
  pushBookingToBeds24,
  updateBeds24Booking,
  cancelBeds24Booking,
} from '@/lib/beds24/client';

// existing createBooking, updateBooking, cancelBooking...
export async function createBooking(villaId: string, data: any) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;
  
  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).single();
    if (!villa) throw new Error('Unauthorized');
  }
  
  // `total_paid_by_guest_usd` is what the guest paid in total (gross amount from OTA or direct).
  // `net_to_villa_usd` is what the villa receives after OTA commission. For direct bookings these are the same.
  const totalPaid = typeof data.total_paid_by_guest_usd === 'number'
    ? data.total_paid_by_guest_usd
    : (typeof data.net_to_villa_usd === 'number' ? data.net_to_villa_usd : 0);

  const payload: Record<string, any> = {
    villa_id: villaId,
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    channel: data.channel || 'direct',
    guest_full_name: data.guest_full_name || 'Unknown Guest',
    guest_country: data.guest_country || '',
    total_paid_by_guest_usd: totalPaid,
    status: 'confirmed',
    payout_status: 'pending',
    booked_at: new Date().toISOString(),
    beds24_booking_id: null,
  };

  // Outbound sync: push to Beds24 for direct/manual bookings so OTA calendars are blocked.
  // We always try to sync regardless of channel (direct, other, owner_stay).
  // Beds24 will handle availability blocking across all connected channels.
  const { data: villaSettings } = await supabase
    .from('villas')
    .select('beds24_property_id, beds24_room_id')
    .eq('id', villaId)
    .maybeSingle();

  if (villaSettings?.beds24_property_id && villaSettings?.beds24_room_id) {
    try {
      const [guestFirst, ...guestRest] = (data.guest_full_name || 'Guest').trim().split(' ');
      const b24BookingId = await pushBookingToBeds24({
        propertyId: villaSettings.beds24_property_id,
        roomId: villaSettings.beds24_room_id,
        arrival: data.check_in_date,
        departure: data.check_out_date,
        firstName: guestFirst || 'Guest',
        lastName: guestRest.join(' ') || (['maintenance', 'owner_stay'].includes(data.channel) ? 'Block' : ''),
        status: ['maintenance', 'owner_stay'].includes(data.channel) ? '9' : '1', // 9 = Blocked, 1 = Confirmed
        price: totalPaid,
      });
      if (b24BookingId) {
        payload.beds24_booking_id = b24BookingId;
        console.log(`[booking-actions] Created Beds24 booking ID: ${b24BookingId}`);
      }
    } catch (err) {
      // Non-fatal: log the error but still save the booking locally
      console.error('[booking-actions] Beds24 push failed, saving locally only:', err);
    }
  }

  const { error } = await supabase.from('bookings').insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateBooking(bookingId: string, villaId: string, data: any) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;

  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).maybeSingle();
    if (!villa) throw new Error('Unauthorized');
  }

  const totalPaid = typeof data.total_paid_by_guest_usd === 'number'
    ? data.total_paid_by_guest_usd
    : (typeof data.net_to_villa_usd === 'number' ? data.net_to_villa_usd : 0);

  const payload = {
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    guest_full_name: data.guest_full_name,
    guest_country: data.guest_country || '',
    total_paid_by_guest_usd: totalPaid,
    channel: data.channel,
  };

  // Fetch the booking to check if it has a Beds24 ID before updating the DB
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('beds24_booking_id')
    .eq('id', bookingId)
    .maybeSingle();

  const { error } = await supabase.from('bookings').update(payload).eq('id', bookingId);
  if (error) throw new Error(error.message);

  // Outbound sync: push the update to Beds24 if this booking is tracked there
  if (existingBooking?.beds24_booking_id) {
    try {
      const [guestFirst, ...guestRest] = (data.guest_full_name || '').trim().split(' ');
      await updateBeds24Booking(existingBooking.beds24_booking_id, {
        arrival: data.check_in_date,
        departure: data.check_out_date,
        firstName: guestFirst || undefined,
        lastName: guestRest.join(' ') || undefined,
        status: ['maintenance', 'owner_stay'].includes(data.channel) ? '9' : '1',
        price: totalPaid,
      });
      console.log(`[booking-actions] Updated Beds24 booking ID: ${existingBooking.beds24_booking_id}`);
    } catch (err) {
      // Non-fatal: log but don't fail the local update
      console.error('[booking-actions] Failed to sync update to Beds24:', err);
    }
  }
}

export async function cancelBooking(bookingId: string, villaId: string) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;

  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).maybeSingle();
    if (!villa) throw new Error('Unauthorized');
  }

  // Fetch booking first to see if it's synced to Beds24 and check current status
  const { data: booking } = await supabase
    .from('bookings')
    .select('beds24_booking_id, status, payout_status')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) throw new Error('Booking not found');
  if (booking.status === 'cancelled') throw new Error('Booking is already cancelled');
  if (booking.payout_status === 'received') {
    throw new Error('Cannot cancel a booking where payout has already been received');
  }

  // Cancel locally first
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', payout_status: 'cancelled' })
    .eq('id', bookingId);
  if (error) throw new Error(error.message);

  // Then sync the cancellation to Beds24 (non-fatal if it fails)
  if (booking.beds24_booking_id) {
    try {
      await cancelBeds24Booking(booking.beds24_booking_id);
      console.log(`[booking-actions] Cancelled Beds24 booking ID: ${booking.beds24_booking_id}`);
    } catch (err) {
      console.error('[booking-actions] Failed to cancel in Beds24 (local booking is still cancelled):', err);
    }
  }
}

export async function markBookingPayoutReceived(bookingId: string, payoutDate: string) {
  const owner = await requireOwner();
  if (owner.role !== 'admin' && owner.role !== 'root' && owner.role !== 'accountant') {
    throw new Error('Unauthorized');
  }

  const supabase = (await createServerSupabaseClient()) as any;
  
  // 1. Fetch booking to create invoice
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, villa:villas(id, display_name)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) throw new Error('Booking not found');
  if (booking.payout_status === 'received') throw new Error('Payout already received');

  // 2. Generate Invoice
  const invoiceNumber = await generateNextInvoiceNumber();
  const invoicePayload = {
    invoice_number: invoiceNumber,
    issuer_name: 'PT Taksu Living Management',
    client_name: 'Aggregator / ' + booking.channel,
    title: 'Booking Payout - ' + booking.guest_full_name,
    issue_date: payoutDate,
    due_date: payoutDate,
    tax_rate: 0,
    currency: 'USD',
    status: 'paid',
    paid_at: payoutDate,
    entity_type: 'villa',
    villa_id: booking.villa_id,
    booking_id: booking.id,
    items: [
      {
        description: `Accommodation for ${booking.guest_full_name} (${booking.check_in_date} to ${booking.check_out_date}) via ${booking.channel}`,
        quantity: 1,
        unit_price_usd: booking.net_to_villa_usd
      }
    ]
  };

  await upsertInvoice(invoicePayload as any);

  // 3. Mark booking as received
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ payout_status: 'received', payout_date: payoutDate })
    .eq('id', bookingId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/accounting');
  revalidatePath('/calendar');
}

export async function getPendingPayouts(villaId: string) {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('villa_id', villaId)
    .eq('payout_status', 'pending')
    .neq('status', 'cancelled')
    .in('channel', ['airbnb', 'booking.com', 'direct', 'other'])
    .order('check_in_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
