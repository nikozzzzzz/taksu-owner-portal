'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { generateNextInvoiceNumber, upsertInvoice } from '@/lib/actions/accounting-actions';
import { revalidatePath } from 'next/cache';
import { beds24Client } from '@/lib/beds24/client';

// existing createBooking, updateBooking, cancelBooking...
export async function createBooking(villaId: string, data: any) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;
  
  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).single();
    if (!villa) throw new Error('Unauthorized');
  }
  
  const payload = {
    villa_id: villaId,
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    channel: data.channel || 'direct',
    guest_full_name: data.guest_full_name,
    guest_country: data.guest_country || '',
    total_paid_by_guest_usd: data.net_to_villa_usd || 0,
    status: 'confirmed',
    payout_status: 'pending', // Added for accounting flow
    booked_at: new Date().toISOString(),
    beds24_booking_id: null as any
  };
  
  // Push to Beds24 if it's a direct/other booking and Villa is mapped
  if (data.channel === 'direct' || data.channel === 'other' || data.channel === 'owner_stay') {
    const { data: villaSettings } = await supabase
      .from('villas')
      .select('beds24_property_id, beds24_room_id')
      .eq('id', villaId)
      .single();

    if (villaSettings?.beds24_property_id && villaSettings?.beds24_room_id) {
      try {
        const b24Res = await beds24Client.pushBooking({
          propertyId: villaSettings.beds24_property_id,
          roomId: villaSettings.beds24_room_id,
          arrival: data.check_in_date,
          departure: data.check_out_date,
          firstName: data.guest_full_name || 'Taksu',
          lastName: data.channel === 'owner_stay' ? 'Owner Block' : 'Guest',
          status: '1' // 1 = Confirmed in Beds24
        });
        if (b24Res && b24Res[0] && b24Res[0].id) {
          payload.beds24_booking_id = b24Res[0].id;
        }
      } catch (err) {
        console.error('Beds24 push failed, proceeding with DB insert only:', err);
      }
    }
  }

  const { error } = await supabase.from('bookings').insert(payload as any);
  if (error) throw new Error(error.message);
}

export async function updateBooking(bookingId: string, villaId: string, data: any) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;
  
  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).single();
    if (!villa) throw new Error('Unauthorized');
  }
  
  const payload = {
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    guest_full_name: data.guest_full_name,
    guest_country: data.guest_country || '',
    total_paid_by_guest_usd: data.net_to_villa_usd,
    channel: data.channel
  };
  
  const { error } = await supabase.from('bookings').update(payload as any).eq('id', bookingId);
  if (error) throw new Error(error.message);
}

export async function cancelBooking(bookingId: string, villaId: string) {
  const owner = await requireOwner();
  const supabase = (await createServerSupabaseClient()) as any;
  
  if (owner.role !== 'admin' && owner.role !== 'root') {
    const { data: villa } = await supabase.from('villas').select('id').eq('id', villaId).eq('owner_id', owner.id).single();
    if (!villa) throw new Error('Unauthorized');
  }
  
  // Fetch booking first to see if it's synced to Beds24
  const { data: booking } = await supabase.from('bookings').select('beds24_booking_id').eq('id', bookingId).single();

  const { error } = await supabase.from('bookings').update({ status: 'cancelled' } as any).eq('id', bookingId);
  if (error) throw new Error(error.message);

  if (booking?.beds24_booking_id) {
    try {
      await beds24Client.updateBookingStatus(booking.beds24_booking_id, '0'); // 0 = Cancelled in Beds24
    } catch (err) {
      console.error('Failed to cancel in Beds24:', err);
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
