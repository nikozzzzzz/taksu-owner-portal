import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { request } from '@/lib/beds24/client';
import { addMonths, format } from 'date-fns';
import { SYSTEM_CURRENCY } from '@/lib/utils/currency';

export async function POST(req: Request) {
  try {
    const supabaseClient = await createServerSupabaseClient();
    const supabase = supabaseClient as any;
    
    // Check admin authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: rawOwner } = await supabase.from('owners').select('role').eq('auth_user_id', user.id).single();
    const owner = rawOwner as any;
    if (!owner || (owner.role !== 'admin' && owner.role !== 'root')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { villaId } = await req.json();

    let query = supabase.from('villas').select('id, beds24_property_id, beds24_room_id');
    if (villaId) {
      query = query.eq('id', villaId);
    }
    
    const { data: rawVillas, error: villasError } = await query;
    const villas = rawVillas as any[];
    if (villasError) throw new Error(villasError.message);
    if (!villas || villas.length === 0) return NextResponse.json({ success: true, message: 'No villas to sync' });

    // We will sync from today to 3 months ahead
    const fromDate = format(new Date(), 'yyyy-MM-dd');
    const toDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
    
    const syncResults = [];

    for (const villa of villas) {
      if (!villa.beds24_room_id) continue;
      
      try {
        // Fetch prices from Beds24 API v2
        const getRes = await request(`/inventory/rooms/calendar?roomId=${villa.beds24_room_id}&startDate=${fromDate}&endDate=${toDate}&includePrices=true`, {
          method: 'GET'
        });

        const calendarData = getRes?.data?.[0]?.calendar || [];
        
        // Process calendarData (if any)
        const rowsToUpsert: any[] = [];
        
        for (const day of calendarData) {
          if (day.price1 !== undefined && day.price1 !== null) {
            const start = new Date(day.from);
            const end = new Date(day.to || day.from);
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              rowsToUpsert.push({
                villa_id: villa.id,
                date: dateStr,
                price_idr: SYSTEM_CURRENCY === 'IDR' ? day.price1 : null,
                price_usd: SYSTEM_CURRENCY === 'USD' ? day.price1 : null,
              });
            }
          }
        }

        if (rowsToUpsert.length > 0) {
          await supabase.from('room_prices').upsert(rowsToUpsert as any, { onConflict: 'villa_id,date' });
        }

        // Update sync timestamp
        const nextSync = new Date();
        nextSync.setHours(nextSync.getHours() + 1); // Next sync in 1 hour
        
        await supabase.from('villas').update({
          prices_last_synced_at: new Date().toISOString(),
          prices_next_sync_at: nextSync.toISOString()
        }).eq('id', villa.id);

        syncResults.push({ villaId: villa.id, success: true, daysSynced: rowsToUpsert.length });
      } catch (err: any) {
        syncResults.push({ villaId: villa.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({ success: true, results: syncResults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
