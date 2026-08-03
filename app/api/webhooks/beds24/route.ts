import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logApiCall } from '@/lib/beds24/client';
import { autoRecalculateStatement } from '@/lib/actions/statement-actions';

// Beds24 sends a secret in a header when Auto Actions are configured.
// Set BEDS24_WEBHOOK_SECRET in .env.local and configure the same value
// in Beds24 > Settings > Notifications > HTTP Requests > Secret Header.
const WEBHOOK_SECRET = process.env.BEDS24_WEBHOOK_SECRET;

// Beds24 status codes
const BEDS24_STATUS = {
  CANCELLED: '0',
  CONFIRMED: '1',
  NEW: '2',
  REQUEST: '3',
  BLOCKED: '9',
} as const;

function isValidDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function mapB24Channel(apiSource: unknown, referrer: unknown): string {
  const src = `${apiSource || ''} ${referrer || ''}`.toLowerCase().trim();
  if (src.includes('airbnb')) return 'airbnb';
  if (src.includes('booking')) return 'booking.com';
  if (src.includes('expedia') || src.includes('vrbo')) return 'expedia';
  if (src.includes('direct') || src.includes('website')) return 'direct';
  return 'other';
}

function mapB24StatusToTaksu(b24Status: string | number): 'confirmed' | 'cancelled' | 'pending' {
  const s = String(b24Status);
  if (s === BEDS24_STATUS.CANCELLED) return 'cancelled';
  if (s === BEDS24_STATUS.CONFIRMED || s === BEDS24_STATUS.BLOCKED) return 'confirmed';
  return 'pending'; // NEW / REQUEST = not yet confirmed
}

export async function POST(req: NextRequest) {
  // ── 1. Authenticate the webhook request ─────────────────────────────────────
  let authFailed = false;
  if (!WEBHOOK_SECRET) {
    // Hard-fail when secret is not configured — never accept unauthenticated webhooks
    console.error(
      '[Webhook/beds24] BEDS24_WEBHOOK_SECRET is not set. Rejecting request. Set this in .env.local!'
    );
    authFailed = true;
  } else {
    const incomingSecret =
      req.headers.get('x-beds24-secret') || req.headers.get('authorization');
    if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) {
      console.warn('[Webhook/beds24] Rejected request: invalid or missing secret.');
      authFailed = true;
    }
  }

  if (authFailed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse payload ─────────────────────────────────────────────────────────
  let rawPayload: unknown = null;
  try {
    rawPayload = await req.json();
  } catch {
    console.error('[Webhook/beds24] Failed to parse JSON body.');
    await logApiCall('inbound', '/api/webhooks/beds24', null, 400, { error: 'Invalid JSON' }, 'Failed to parse JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await logApiCall('inbound', '/api/webhooks/beds24', rawPayload, 200, null, null);

  const bookings = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
  const supabase = (await createServerSupabaseClient()) as any;

  const results: { id: number; outcome: 'created' | 'updated' | 'skipped'; reason?: string }[] = [];
  const villasToRecalculate = new Set<string>();

  for (const b24 of bookings) {
    const bookingId = b24?.id;
    const propertyId = b24?.propertyId;
    const roomId = b24?.roomId;

    // ── 3. Validate required fields ──────────────────────────────────────────
    if (!bookingId || !propertyId || !roomId) {
      console.warn('[Webhook/beds24] Skipping record: missing id, propertyId, or roomId.', b24);
      results.push({ id: bookingId, outcome: 'skipped', reason: 'Missing id/propertyId/roomId' });
      continue;
    }

    if (!isValidDate(b24.arrival) || !isValidDate(b24.departure)) {
      console.warn(
        `[Webhook/beds24] Booking ${bookingId}: invalid arrival/departure dates (${b24.arrival} → ${b24.departure})`
      );
      results.push({ id: bookingId, outcome: 'skipped', reason: 'Invalid dates' });
      continue;
    }

    // Sanity check: arrival must be before departure
    if (new Date(b24.arrival) >= new Date(b24.departure)) {
      console.warn(
        `[Webhook/beds24] Booking ${bookingId}: arrival (${b24.arrival}) is not before departure (${b24.departure}).`
      );
      results.push({ id: bookingId, outcome: 'skipped', reason: 'arrival >= departure' });
      continue;
    }

    // ── 4. Look up the Taksu villa mapping (including currency field) ─────────
    const { data: villa } = await supabase
      .from('villas')
      .select('id, currency')
      .eq('beds24_property_id', propertyId)
      .eq('beds24_room_id', roomId)
      .maybeSingle();

    if (!villa) {
      console.warn(
        `[Webhook/beds24] Booking ${bookingId}: No villa mapped for Beds24 Property ${propertyId} / Room ${roomId}. Skipping.`
      );
      results.push({ id: bookingId, outcome: 'skipped', reason: 'No villa mapping found' });
      continue;
    }

    // ── 5. Build the canonical booking payload ───────────────────────────────
    const guestFirst = String(b24.firstName || '').trim();
    const guestLast = String(b24.lastName || '').trim();
    const guestName = [guestFirst, guestLast].filter(Boolean).join(' ') || 'Unknown Guest';

    // Financial Mapping: Count money directly as the villa/system chosen currency without converting to USD
    const rawPrice = typeof b24.price === 'number' ? b24.price : parseFloat(b24.price) || 0;
    const rawCommission = typeof b24.commission === 'number' ? b24.commission : parseFloat(b24.commission) || 0;

    const totalPaidByGuestUsd = rawPrice;
    const channelCommissionUsd = rawCommission;
    const phrTaxUsd = totalPaidByGuestUsd * 0.10;

    const status = mapB24StatusToTaksu(b24.status);
    let channel = mapB24Channel(b24.apiSource, b24.referrer);
    if (String(b24.status) === BEDS24_STATUS.BLOCKED) {
        channel = 'maintenance';
    }

    const bookingPayload = {
      villa_id: villa.id,
      beds24_booking_id: bookingId,
      beds24_status: String(b24.status ?? ''),
      check_in_date: b24.arrival,
      check_out_date: b24.departure,
      guest_full_name: guestName,
      total_paid_by_guest_usd: totalPaidByGuestUsd,
      channel_commission_usd: channelCommissionUsd,
      phr_tax_usd: phrTaxUsd,
      channel,
      status,
      booked_at: isValidDate(b24.bookingTime) ? b24.bookingTime : new Date().toISOString(),
    };

    // ── 6. Upsert the booking ────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('beds24_booking_id', bookingId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(bookingPayload)
        .eq('id', existing.id);

      if (updateError) {
        console.error(`[Webhook/beds24] Failed to update booking ${bookingId}:`, updateError);
      } else {
        console.log(`[Webhook/beds24] Updated booking ${bookingId} (local id: ${existing.id})`);
        results.push({ id: bookingId, outcome: 'updated' });
      }
    } else {
      const { error: insertError } = await supabase.from('bookings').insert(bookingPayload);

      if (insertError) {
        console.error(`[Webhook/beds24] Failed to insert booking ${bookingId}:`, insertError);
      } else {
        console.log(`[Webhook/beds24] Created booking ${bookingId}`);
        results.push({ id: bookingId, outcome: 'created' });
      }
    }

    // Add statement month to recalculate queue
    const checkIn = new Date(b24.arrival);
    const billingMonthStr = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}-01`;
    villasToRecalculate.add(`${villa.id}_${billingMonthStr}`);
  }

  // Automatically recalculate monthly statements for any modified months
  for (const key of villasToRecalculate) {
    const [vId, billingMonth] = key.split('_');
    try {
      await autoRecalculateStatement(vId, billingMonth);
    } catch (stmtErr) {
      console.error(`[Webhook/beds24] Failed to auto-recalculate statement for villa ${vId} month ${billingMonth}:`, stmtErr);
    }
  }

  return NextResponse.json({ success: true, processed: results.length, results });
}
