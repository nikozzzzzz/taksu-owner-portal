import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // In a real integration, we should check a signature or token
    // For this example, we expect an array of bookings or a single booking
    const bookings = Array.isArray(payload) ? payload : [payload];

    const supabase = (await createServerSupabaseClient()) as any;

    for (const b24Booking of bookings) {
      if (!b24Booking.id || !b24Booking.propertyId || !b24Booking.roomId) continue;

      // Map Beds24 property/room to Taksu Villa ID
      const { data: villa } = await supabase
        .from('villas')
        .select('id')
        .eq('beds24_property_id', b24Booking.propertyId)
        .eq('beds24_room_id', b24Booking.roomId)
        .single();

      if (!villa) {
        console.warn(`Webhook ignored: No Taksu villa mapped for Beds24 Property ${b24Booking.propertyId}`);
        continue;
      }

      // Check if it's a cancellation
      // Beds24 status: 0 = Cancelled, 1 = Confirmed, 2 = New, 3 = Request
      const isCancelled = b24Booking.status === '0' || b24Booking.status === 0;

      // Determine channel
      let channel = 'other';
      const b24Channel = b24Booking.apiSource || b24Booking.referrer || '';
      if (b24Channel.toLowerCase().includes('airbnb')) channel = 'airbnb';
      else if (b24Channel.toLowerCase().includes('booking')) channel = 'booking.com';
      else if (b24Channel.toLowerCase().includes('direct')) channel = 'direct';

      const bookingPayload = {
        beds24_booking_id: b24Booking.id,
        villa_id: villa.id,
        check_in_date: b24Booking.arrival,
        check_out_date: b24Booking.departure,
        guest_full_name: `${b24Booking.firstName || ''} ${b24Booking.lastName || ''}`.trim() || 'Unknown Guest',
        total_paid_by_guest_usd: b24Booking.price || 0,
        channel: channel,
        status: isCancelled ? 'cancelled' : 'confirmed',
        beds24_status: String(b24Booking.status),
        booked_at: b24Booking.bookingTime || new Date().toISOString()
      };

      // Upsert into Taksu database based on beds24_booking_id
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('beds24_booking_id', b24Booking.id)
        .single();

      if (existing) {
        // Update
        await supabase.from('bookings').update(bookingPayload).eq('id', existing.id);
      } else {
        // Insert
        await supabase.from('bookings').insert(bookingPayload);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
