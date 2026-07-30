import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createAdminSupabaseClient } from '../lib/supabase/admin';

const BEDS24_STATUS: Record<string, string> = {
  '0': 'cancelled',
  '1': 'confirmed',
  '2': 'pending',   // new
  '3': 'pending',   // request
  '9': 'confirmed', // blocked
};

function mapChannel(src: unknown, referrer: unknown): string {
  const s = `${src || ''} ${referrer || ''}`.toLowerCase();
  if (s.includes('airbnb'))                         return 'airbnb';
  if (s.includes('booking'))                        return 'booking';
  if (s.includes('agoda'))                          return 'agoda';
  if (s.includes('expedia') || s.includes('vrbo'))  return 'expedia';
  if (s.includes('direct') || s.includes('website')) return 'direct';
  return 'other';
}

function isValidDate(d: unknown): boolean {
  if (typeof d !== 'string') return false;
  return !isNaN(new Date(d).getTime());
}

async function main() {
  const supabase = createAdminSupabaseClient();

  const v1Id = 'f339bc90-8365-422b-9c45-229075f6574d'; // The real villa linked to the owner
  const v2Id = '12d8e489-97a0-4140-8be2-b76648a0ea76'; // The duplicate auto-created villa

  console.log('=== Step 1: Mapping Beds24 property & room to V1 villa ===');
  const { error: updateErr } = await (supabase as any)
    .from('villas')
    .update({
      beds24_property_id: 344813,
      beds24_room_id: 712293,
    })
    .eq('id', v1Id);

  if (updateErr) {
    console.error('Failed to update V1 villa:', updateErr);
    return;
  }
  console.log('Successfully mapped V1 villa to Beds24.');

  console.log('=== Step 2: Deleting duplicate V2 villa ===');
  const { error: deleteErr } = await (supabase as any)
    .from('villas')
    .delete()
    .eq('id', v2Id);

  if (deleteErr) {
    console.error('Failed to delete duplicate V2 villa:', deleteErr);
    // If it fails due to foreign keys, we'll continue anyway
  } else {
    console.log('Successfully deleted duplicate V2 villa.');
  }

  // 3. Get Beds24 credentials
  const { data: credentials, error: credErr } = await (supabase as any)
    .from('beds24_credentials')
    .select('*')
    .limit(1)
    .single();

  if (credErr || !credentials) {
    console.error('Failed to load Beds24 credentials:', credErr);
    return;
  }

  // 4. Fetch bookings from Beds24
  const roomId = 712293;
  const arrivalFrom = '2024-01-01';
  const arrivalTo = '2027-01-01';
  console.log(`=== Step 3: Fetching bookings for Room ID ${roomId} from Beds24 ===`);
  const response = await fetch(`https://api.beds24.com/v2/bookings?roomId=${roomId}&arrivalFrom=${arrivalFrom}&arrivalTo=${arrivalTo}&includeInactive=true`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      token: credentials.token,
    }
  });

  if (!response.ok) {
    console.error(`Beds24 API failed: ${response.status} ${response.statusText}`);
    return;
  }

  const result = await response.json();
  const bookings = Array.isArray(result) ? result : (result?.data ?? []);
  console.log(`Beds24 API returned ${bookings.length} bookings.`);

  // 5. Map and upsert bookings under V1's villa ID
  let created = 0;
  let updated = 0;

  for (const b24 of bookings) {
    const beds24BookingId: number = b24.id ?? b24.bookingId;
    if (!beds24BookingId) continue;

    const guestFirst = String(b24.firstName || '').trim();
    const guestLast  = String(b24.lastName  || '').trim();
    const guestName  = [guestFirst, guestLast].filter(Boolean).join(' ') || 'Unknown Guest';
    const totalPrice = typeof b24.price === 'number' ? b24.price : parseFloat(b24.price) || 0;
    const statusStr  = String(b24.status ?? '');
    const status     = BEDS24_STATUS[statusStr] ?? 'pending';
    let channel      = mapChannel(b24.apiSource, b24.referrer);
    if (statusStr === '9') channel = 'other';

    const numAdult = parseInt(b24.numAdult || '0', 10);
    const numChild = parseInt(b24.numChild || '0', 10);
    const guestsCount = Math.max(1, numAdult + numChild);

    const payload = {
      villa_id:              v1Id,
      beds24_booking_id:     beds24BookingId,
      beds24_status:         statusStr,
      check_in_date:         b24.arrival,
      check_out_date:        b24.departure,
      guest_full_name:       guestName,
      guest_email:           b24.email || null,
      guest_phone:           b24.mobile || b24.phone || null,
      guest_country:         b24.country || null,
      guests_count:          guestsCount,
      channel_reservation_code: b24.apiReference || null,
      total_paid_by_guest_usd: totalPrice,
      channel,
      status,
      booked_at: isValidDate(b24.bookingTime) ? b24.bookingTime : new Date().toISOString(),
    };

    // Check if booking already exists
    const { data: existing } = await (supabase as any)
      .from('bookings')
      .select('id')
      .eq('beds24_booking_id', beds24BookingId)
      .maybeSingle();

    if (existing) {
      const { error } = await (supabase as any)
        .from('bookings')
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.error(`Failed to update booking ${beds24BookingId}:`, error);
      } else {
        updated++;
      }
    } else {
      const { error } = await (supabase as any)
        .from('bookings')
        .insert(payload);

      if (error) {
        console.error(`Failed to insert booking ${beds24BookingId}:`, error);
      } else {
        created++;
      }
    }
  }

  console.log(`Sync completed successfully. Created: ${created}, Updated: ${updated}`);
}

main().catch(console.error);
