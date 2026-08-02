import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  getBeds24Properties,
  getBeds24Rooms,
  getBeds24Bookings,
} from '@/lib/beds24/client';
import { autoRecalculateStatement } from '@/lib/actions/statement-actions';
import { logSystemEvent } from '@/lib/system-events';

// Beds24 booking status codes → Taksu
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

export async function runBeds24FullSync(triggeredBy: 'manual' | 'cron' | 'webhook' = 'manual') {
  const supabase = createAdminSupabaseClient() as any;

  // ── Create sync log entry ───────────────────────────────────────────────────
  const { data: logRow, error: logErr } = await supabase
    .from('beds24_sync_log')
    .insert({ triggered_by: triggeredBy, status: 'running' })
    .select('id')
    .single();

  if (logErr || !logRow) {
    console.error('[Beds24/sync] Failed to create sync log:', logErr);
  }

  const logId: string | null = logRow?.id ?? null;

  // Log sync start
  logSystemEvent({
    category: 'sync',
    level: 'info',
    title: `Beds24 sync started (${triggeredBy})`,
    metadata: { triggered_by: triggeredBy, log_id: logId },
  }).catch(() => {});

  const counters = {
    properties_found: 0,
    bookings_fetched: 0,
    bookings_created: 0,
    bookings_updated: 0,
    bookings_skipped: 0,
  };

  try {
    // ── 1. Fetch all Beds24 properties ─────────────────────────────────────────
    const properties = await getBeds24Properties();
    counters.properties_found = properties.length;
    console.log(`[Beds24/sync] Found ${properties.length} properties.`);

    // ── 2. For each property, fetch rooms and bookings ─────────────────────────
    // Date window: 2 years back → 1 year ahead
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setFullYear(today.getFullYear() - 2);
    const dateTo = new Date(today);
    dateTo.setFullYear(today.getFullYear() + 1);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    for (const prop of properties) {
      const propertyId: number = prop.id ?? prop.propId;
      if (!propertyId) continue;

      // Fetch rooms for this property
      let rooms: any[] = [];
      try {
        rooms = await getBeds24Rooms(propertyId);
      } catch (err) {
        console.warn(`[Beds24/sync] Could not fetch rooms for property ${propertyId}:`, err);
      }

      // Fetch bookings for this property
      let bookings: any[] = [];
      try {
        bookings = await getBeds24Bookings({
          propertyId,
          dateFrom: fmt(dateFrom),
          dateTo: fmt(dateTo),
        });
      } catch (err) {
        console.warn(`[Beds24/sync] Could not fetch bookings for property ${propertyId}:`, err);
        continue;
      }

      counters.bookings_fetched += bookings.length;

      // Fallback: If rooms API failed but we have bookings, extract unique room IDs from bookings
      if (rooms.length === 0) {
        if (bookings.length > 0) {
          const uniqueRoomIds = new Set<number>();
          bookings.forEach(b => {
            if (b.roomId) uniqueRoomIds.add(b.roomId);
          });
          rooms = Array.from(uniqueRoomIds).map(id => ({ id }));
        } else {
          // No rooms API access and no bookings yet. 
          // We still want to create the villa at the property level so it shows up in the UI.
          rooms = [{ id: null, name: prop.name }];
        }
      }

      // Auto-register and sync property fields to villas
      for (const room of rooms) {
        const roomId: number | null = room.id ?? room.roomId ?? null;
        
        // If roomId is null, we can't use internal_code B24-null. Let's use propertyId.
        const internalCode = roomId ? `B24-${roomId}` : `B24-P${propertyId}`;

        const villaPayload = {
           beds24_property_id: propertyId,
           beds24_room_id: roomId,
           display_name: room.name || prop.name || `Beds24 Property ${propertyId}`,
           internal_code: internalCode,
           address: prop.address || null,
           city: prop.city || null,
           state: prop.state || null,
           country: prop.country || null,
           postcode: prop.postcode || null,
           latitude: prop.latitude || null,
           longitude: prop.longitude || null,
           phone: prop.phone || prop.mobile || null,
           email: prop.email || null,
           currency: prop.currency || null,
           beds24_property_type: prop.propertyType || null,
           check_in_start: prop.checkInStart || null,
           check_in_end: prop.checkInEnd || null,
           check_out_end: prop.checkOutEnd || null,
           last_synced_at: new Date().toISOString(),
        };

        // Check if a villa is already mapped to this property+room
        let query = supabase
          .from('villas')
          .select('id')
          .eq('beds24_property_id', propertyId);
        
        if (roomId) {
          query = query.eq('beds24_room_id', roomId);
        } else {
          query = query.is('beds24_room_id', null);
        }

        const { data: alreadyMapped } = await query.maybeSingle();

        if (alreadyMapped) {
          // Update the existing mapped villa with latest Beds24 info
          await supabase.from('villas').update(villaPayload).eq('id', alreadyMapped.id);
        } else {
          // Check if villa matched to property but missing room
          const { data: partialMatch } = await supabase
            .from('villas')
            .select('id')
            .eq('beds24_property_id', propertyId)
            .is('beds24_room_id', null)
            .maybeSingle();

          if (partialMatch) {
            await supabase
              .from('villas')
              .update(villaPayload)
              .eq('id', partialMatch.id);
            console.log(`[Beds24/sync] Auto-assigned room ${roomId} and synced Beds24 data to villa ${partialMatch.id}`);
          } else {
            // Auto-create entirely new villa from Beds24
            const { error: insertErr } = await supabase.from('villas').insert(villaPayload);
            if (insertErr) {
               console.error(`[Beds24/sync] Failed to auto-create villa for room ${roomId}:`, insertErr);
            } else {
               console.log(`[Beds24/sync] Auto-created new villa from Beds24 room ${roomId}`);
            }
          }
        }
      }

      const villasToRecalculate = new Set<string>();

      for (const b24 of bookings) {
        const beds24BookingId: number = b24.id ?? b24.bookingId;
        const b24RoomId: number = b24.roomId;
        if (!beds24BookingId || !b24RoomId) {
          counters.bookings_skipped++;
          continue;
        }

        if (!isValidDate(b24.arrival) || !isValidDate(b24.departure)) {
          counters.bookings_skipped++;
          continue;
        }

        if (new Date(b24.arrival) >= new Date(b24.departure)) {
          counters.bookings_skipped++;
          continue;
        }

        // Look up the mapped Taksu villa (including currency field)
        const { data: villa } = await supabase
          .from('villas')
          .select('id, currency')
          .eq('beds24_property_id', propertyId)
          .eq('beds24_room_id', b24RoomId)
          .maybeSingle();

        if (!villa) {
          console.warn(
            `[Beds24/sync] No villa mapped for property ${propertyId} / room ${b24RoomId} — skipping booking ${beds24BookingId}`
          );
          counters.bookings_skipped++;
          continue;
        }

        const guestFirst = String(b24.firstName || '').trim();
        const guestLast  = String(b24.lastName  || '').trim();
        const guestName  = [guestFirst, guestLast].filter(Boolean).join(' ') || 'Unknown Guest';
        
        // Financial Mapping: Count money directly as the villa/system chosen currency without converting to USD
        const rawPrice = typeof b24.price === 'number' ? b24.price : parseFloat(b24.price) || 0;
        const rawCommission = typeof b24.commission === 'number' ? b24.commission : parseFloat(b24.commission) || 0;
        
        const totalPaidByGuestUsd = rawPrice;
        const channelCommissionUsd = rawCommission;
        const phrTaxUsd = totalPaidByGuestUsd * 0.10;

        const statusStr  = String(b24.status ?? '');
        const status     = BEDS24_STATUS[statusStr] ?? 'pending';
        let channel      = mapChannel(b24.apiSource, b24.referrer);
        if (statusStr === '9') channel = 'other'; // blocked = maintenance/other

        const numAdult = parseInt(b24.numAdult || '0', 10);
        const numChild = parseInt(b24.numChild || '0', 10);
        const guestsCount = Math.max(1, numAdult + numChild);

        const payload = {
          villa_id:              villa.id,
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
          total_paid_by_guest_usd: totalPaidByGuestUsd,
          channel_commission_usd:  channelCommissionUsd,
          phr_tax_usd:             phrTaxUsd,
          channel,
          status,
          booked_at: isValidDate(b24.bookingTime) ? b24.bookingTime : new Date().toISOString(),
        };

        // Upsert
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('beds24_booking_id', beds24BookingId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
             .from('bookings')
             .update(payload)
             .eq('id', existing.id);
          if (!error) counters.bookings_updated++;
          else console.error(`[Beds24/sync] Update failed for booking ${beds24BookingId}:`, error);
        } else {
          const { error } = await supabase.from('bookings').insert(payload);
          if (!error) counters.bookings_created++;
          else console.error(`[Beds24/sync] Insert failed for booking ${beds24BookingId}:`, error);
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
          console.error(`[Beds24/sync] Failed to auto-recalculate statement for villa ${vId} month ${billingMonth}:`, stmtErr);
        }
      }
    }

    // ── 3. Finalize sync log ───────────────────────────────────────────────────
    if (logId) {
      await supabase
        .from('beds24_sync_log')
        .update({ status: 'success', finished_at: new Date().toISOString(), ...counters })
        .eq('id', logId);
    }

    console.log('[Beds24/sync] Completed:', counters);

    // Log success system event
    logSystemEvent({
      category: 'sync',
      level: 'success',
      title: `Beds24 sync completed (${triggeredBy})`,
      body: `${counters.bookings_created} created, ${counters.bookings_updated} updated, ${counters.bookings_skipped} skipped`,
      metadata: { triggered_by: triggeredBy, ...counters },
    }).catch(() => {});

    return { success: true, data: counters };
  } catch (err: any) {
    console.error('[Beds24/sync] Fatal error:', err);
    // Send to Telegram Logging Bot
    import('@/lib/telegram').then(({ logErrorToTelegram }) => {
      logErrorToTelegram(err, 'Beds24 Sync Fatal Error');
    }).catch(e => console.error('[Telegram] Import fail:', e));

    // Log error system event  
    logSystemEvent({
      category: 'sync',
      level: 'error',
      title: `Beds24 sync failed (${triggeredBy})`,
      body: err.message,
      metadata: { triggered_by: triggeredBy, error: err.message },
    }).catch(() => {});

    if (logId) {
      await supabase
        .from('beds24_sync_log')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: err.message,
          ...counters,
        })
        .eq('id', logId);
    }
    return { success: false, error: err.message };
  }
}
