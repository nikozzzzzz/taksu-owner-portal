import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type CalendarBooking = Pick<
  Database['public']['Tables']['bookings']['Row'],
  'id' | 'villa_id' | 'check_in_date' | 'check_out_date' | 'nights' | 'channel' | 'guest_full_name' | 'guest_country' | 'net_to_villa_usd'
>;

export async function getVillaBookings(villaId: string, startDate: string, endDate: string): Promise<CalendarBooking[]> {
  const supabase = await createServerSupabaseClient();
  
  // Select only anonymized data to ensure PII is never sent to the client
  const { data, error } = await supabase
    .from('bookings')
    .select('id, villa_id, check_in_date, check_out_date, nights, channel, guest_full_name, guest_country, net_to_villa_usd')
    .eq('villa_id', villaId)
    .neq('status', 'cancelled')
    // Get bookings that overlap with the requested month window
    .lte('check_in_date', endDate)
    .gte('check_out_date', startDate)
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching calendar bookings:', error);
    return [];
  }
  
  return data as CalendarBooking[];
}

export type CalendarPrice = {
  villa_id: string;
  date: string;
  price_idr: number | null;
  price_usd: number | null;
};

export async function getVillaPrices(villaId: string, startDate: string, endDate: string): Promise<CalendarPrice[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('room_prices')
    .select('villa_id, date, price_idr, price_usd')
    .eq('villa_id', villaId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('Error fetching room prices:', error);
    return [];
  }
  
  return data as CalendarPrice[];
}
