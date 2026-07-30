'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { generateNextInvoiceNumber, upsertInvoice } from '@/lib/actions/accounting-actions';
import { autoRecalculateStatement } from '@/lib/actions/statement-actions';
import { revalidatePath } from 'next/cache';
import {
  pushBookingToBeds24,
  updateBeds24Booking,
  cancelBeds24Booking,
} from '@/lib/beds24/client';
import { SYSTEM_CURRENCY } from '@/lib/utils/currency';
import { logUserActivity } from '@/lib/user-logger';

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
    .select('beds24_property_id, beds24_room_id, beds24_sync_mode')
    .eq('id', villaId)
    .maybeSingle();

  if (villaSettings?.beds24_property_id && villaSettings?.beds24_room_id && villaSettings?.beds24_sync_mode !== 'read_write') {
    throw new Error('Villa is in Read-Only mode. Cannot create bookings or blocks locally. Change to Read & Write mode first.');
  }

  let beds24_sync_error: string | null = null;
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
        status: ['maintenance', 'owner_stay'].includes(data.channel) ? 'black' : 'confirmed', // 'black' = Blocked, 'confirmed' = Confirmed
        price: totalPaid,
      });
      if (b24BookingId) {
        payload.beds24_booking_id = b24BookingId;
        console.log(`[booking-actions] Created Beds24 booking ID: ${b24BookingId}`);
      }
    } catch (err: any) {
      // Non-fatal: log the error but still save the booking locally
      beds24_sync_error = err.message || 'Failed to sync to Beds24';
      console.error('[booking-actions] Beds24 push failed, saving locally only:', err);
      import('@/lib/telegram').then(({ logErrorToTelegram }) => {
        logErrorToTelegram(err, `Beds24 push failed in createBooking (Villa: ${villaId})`);
      }).catch(e => console.error('[Telegram] Import fail:', e));
    }
  }

  const { error } = await supabase.from('bookings').insert(payload);
  if (error) throw new Error(error.message);
  
  await logUserActivity('create_booking', { villaId, guestName: data.guest_name, checkIn: data.check_in_date });

  try {
    const checkIn = new Date(data.check_in_date);
    const billingMonthStr = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-01`;
    await autoRecalculateStatement(villaId, billingMonthStr);
  } catch (stmtErr) {
    console.error('[StatementAuto] Recalculation failed in createBooking:', stmtErr);
  }

  return { success: true, beds24_sync_error };
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

  // Fetch the booking and villa to check if it has a Beds24 ID before updating the DB
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select(`
      beds24_booking_id,
      villas (
        beds24_property_id,
        beds24_room_id,
        beds24_sync_mode
      )
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (existingBooking?.villas?.beds24_property_id && existingBooking?.villas?.beds24_room_id && existingBooking?.villas?.beds24_sync_mode !== 'read_write') {
    throw new Error('Villa is in Read-Only mode. Cannot modify bookings or blocks locally. Change to Read & Write mode first.');
  }

  // Fetch existing booking before update to know the old month/villa if it changes
  const { data: bookingBefore } = await supabase
    .from('bookings')
    .select('villa_id, check_in_date')
    .eq('id', bookingId)
    .maybeSingle();

  const { error } = await supabase.from('bookings').update(payload).eq('id', bookingId);
  if (error) throw new Error(error.message);

  // Trigger statement recalculations
  try {
    let oldMonthStr: string | null = null;
    if (bookingBefore) {
      const oldCheckIn = new Date(bookingBefore.check_in_date);
      oldMonthStr = `${oldCheckIn.getFullYear()}-${String(oldCheckIn.getMonth() + 1).padStart(2, '0')}-01`;
      await autoRecalculateStatement(bookingBefore.villa_id, oldMonthStr);
    }
    const newCheckIn = new Date(data.check_in_date);
    const newMonthStr = `${newCheckIn.getFullYear()}-${String(newCheckIn.getMonth() + 1).padStart(2, '0')}-01`;
    if (bookingBefore?.villa_id !== villaId || newMonthStr !== oldMonthStr) {
      await autoRecalculateStatement(villaId, newMonthStr);
    }
  } catch (stmtErr) {
    console.error('[StatementAuto] Recalculation failed in updateBooking:', stmtErr);
  }

  // Outbound sync: push the update to Beds24 if this booking is tracked there
  const b24PropId = existingBooking?.villas?.beds24_property_id;
  const b24RoomId = existingBooking?.villas?.beds24_room_id;
  let beds24_sync_error: string | null = null;

  if (existingBooking?.beds24_booking_id) {
    try {
      const [guestFirst, ...guestRest] = (data.guest_full_name || '').trim().split(' ');
      await updateBeds24Booking(existingBooking.beds24_booking_id, {
        arrival: data.check_in_date,
        departure: data.check_out_date,
        firstName: guestFirst || undefined,
        lastName: guestRest.join(' ') || undefined,
        status: ['maintenance', 'owner_stay'].includes(data.channel) ? 'black' : 'confirmed',
        price: totalPaid,
      });
      console.log(`[booking-actions] Updated Beds24 booking ID: ${existingBooking.beds24_booking_id}`);
    } catch (err: any) {
      // Non-fatal: log but don't fail the local update
      beds24_sync_error = err.message || 'Failed to sync update to Beds24';
      console.error('[booking-actions] Failed to sync update to Beds24:', err);
      import('@/lib/telegram').then(({ logErrorToTelegram }) => {
        logErrorToTelegram(err, `Failed to sync update in updateBooking (Booking: ${bookingId})`);
      }).catch(e => console.error('[Telegram] Import fail:', e));
    }
  } else if (b24PropId && b24RoomId) {
    // Booking was never synced, create it now!
    try {
      const [guestFirst, ...guestRest] = (data.guest_full_name || 'Guest').trim().split(' ');
      const newB24BookingId = await pushBookingToBeds24({
        propertyId: b24PropId,
        roomId: b24RoomId,
        arrival: data.check_in_date,
        departure: data.check_out_date,
        firstName: guestFirst || 'Guest',
        lastName: guestRest.join(' ') || (['maintenance', 'owner_stay'].includes(data.channel) ? 'Block' : ''),
        status: ['maintenance', 'owner_stay'].includes(data.channel) ? 'black' : 'confirmed',
        price: totalPaid,
      });
      
      if (newB24BookingId) {
        await supabase.from('bookings').update({ beds24_booking_id: newB24BookingId }).eq('id', bookingId);
        console.log(`[booking-actions] Created missing Beds24 booking ID: ${newB24BookingId}`);
      }
    } catch (err: any) {
      beds24_sync_error = err.message || 'Failed to sync new booking to Beds24';
      console.error('[booking-actions] Beds24 push missing booking failed:', err);
      import('@/lib/telegram').then(({ logErrorToTelegram }) => {
        logErrorToTelegram(err, `Failed to push missing booking in updateBooking (Booking: ${bookingId})`);
      }).catch(e => console.error('[Telegram] Import fail:', e));
    }
  }
  await logUserActivity('update_booking', { bookingId, status: data.status });
  return { success: true, beds24_sync_error };
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
    .select('beds24_booking_id, status, payout_status, check_in_date, villa_id, villas(beds24_property_id, beds24_room_id, beds24_sync_mode)')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) throw new Error('Booking not found');
  if (booking.status === 'cancelled') throw new Error('Booking is already cancelled');
  if (booking.payout_status === 'received') {
    throw new Error('Cannot cancel a booking where payout has already been received');
  }

  if (booking.villas?.beds24_property_id && booking.villas?.beds24_room_id && booking.villas?.beds24_sync_mode !== 'read_write') {
    throw new Error('Villa is in Read-Only mode. Cannot cancel bookings or blocks locally. Change to Read & Write mode first.');
  }

  // Cancel locally first
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);
  if (error) throw new Error(error.message);

  // Trigger statement recalculation
  try {
    if (booking) {
      const checkIn = new Date(booking.check_in_date);
      const billingMonthStr = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-01`;
      await autoRecalculateStatement(booking.villa_id, billingMonthStr);
    }
  } catch (stmtErr) {
    console.error('[StatementAuto] Recalculation failed in cancelBooking:', stmtErr);
  }

  let beds24_sync_error: string | null = null;
  // Then sync the cancellation to Beds24 (non-fatal if it fails)
  if (booking.beds24_booking_id) {
    try {
      await cancelBeds24Booking(booking.beds24_booking_id);
      console.log(`[booking-actions] Cancelled Beds24 booking ID: ${booking.beds24_booking_id}`);
    } catch (err: any) {
      beds24_sync_error = err.message || 'Failed to cancel booking in Beds24';
      console.error('[booking-actions] Failed to cancel booking in Beds24 (local booking is still cancelled):', err);
      import('@/lib/telegram').then(({ logErrorToTelegram }) => {
        logErrorToTelegram(err, `Failed to cancel booking in Beds24 (Booking: ${bookingId})`);
      }).catch(e => console.error('[Telegram] Import fail:', e));
    }
  }
  await logUserActivity('cancel_booking', { bookingId });
  return { success: true, beds24_sync_error };
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

  // Trigger statement recalculation
  try {
    if (booking) {
      const checkIn = new Date(booking.check_in_date);
      const billingMonthStr = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-01`;
      await autoRecalculateStatement(booking.villa_id, billingMonthStr);
    }
  } catch (stmtErr) {
    console.error('[StatementAuto] Recalculation failed in markBookingPayoutReceived:', stmtErr);
  }

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

/**
 * Set the daily price for a date range in Beds24.
 * This sets `p1` (Price Row 1) which is typically the default rate.
 */
export async function setRoomPrice(villaId: string, fromDate: string, toDate: string, price: number): Promise<{ success: boolean; error?: string }> {
  const owner = await requireOwner();
  if (owner.role !== 'admin' && owner.role !== 'root') {
    throw new Error('Unauthorized');
  }

  const supabase = (await createServerSupabaseClient()) as any;
  const { data: villa, error } = await supabase.from('villas').select('beds24_property_id, beds24_room_id, beds24_sync_mode').eq('id', villaId).single();
  
  if (error || !villa || !villa.beds24_room_id) {
    throw new Error('Villa or Beds24 mapping not found');
  }

  if (villa.beds24_sync_mode !== 'read_write') {
    throw new Error('Villa is in Read-Only mode. Cannot push prices to Beds24.');
  }

  try {
    const { request } = await import('@/lib/beds24/client');
    const result = await request('/inventory/rooms/calendar', {
      method: 'POST',
      body: JSON.stringify([{
        roomId: villa.beds24_room_id,
        calendar: [{
          from: fromDate,
          to: toDate,
          price1: price
        }]
      }])
    });
    
    if (Array.isArray(result) && result[0] && result[0].success === false) {
      throw new Error(result[0].error || 'Failed to update Beds24 pricing');
    }

    // Upsert into Supabase for instant UI updates
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const rowsToUpsert = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      rowsToUpsert.push({
        villa_id: villaId,
        date: dateStr,
        price_idr: SYSTEM_CURRENCY === 'IDR' ? price : null,
        price_usd: SYSTEM_CURRENCY === 'USD' ? price : null,
      });
    }

    const { error: upsertErr } = await supabase
      .from('room_prices')
      .upsert(rowsToUpsert, { onConflict: 'villa_id, date' });
      
    if (upsertErr) {
      console.error('[setRoomPrice] DB Upsert error:', upsertErr);
      // We still succeed if Beds24 succeeded, just log it.
    } else {
      const nextSync = new Date();
      nextSync.setHours(nextSync.getHours() + 1);
      await (supabase as any).from('villas').update({
        prices_last_synced_at: new Date().toISOString(),
        prices_next_sync_at: nextSync.toISOString()
      }).eq('id', villaId);
    }
    
    await logUserActivity('set_room_price', { villaId, fromDate, toDate, price });
    return { success: true };
  } catch (err: any) {
    console.error('[setRoomPrice]', err);
    import('@/lib/telegram').then(({ logErrorToTelegram }) => {
      logErrorToTelegram(err, `Error in setRoomPrice (Villa: ${villaId}, Dates: ${fromDate} to ${toDate})`);
    }).catch(e => console.error('[Telegram] Import fail:', e));
    return { success: false, error: err.message };
  }
}

