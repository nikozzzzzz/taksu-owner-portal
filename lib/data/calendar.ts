import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type CalendarBooking = Pick<
  Database['public']['Tables']['bookings']['Row'],
  'id' | 'villa_id' | 'check_in_date' | 'check_out_date' | 'nights' | 'channel' | 'guest_initials' | 'guest_country' | 'net_to_villa_usd'
>;

export async function getVillaBookings(villaId: string, startDate: string, endDate: string): Promise<CalendarBooking[]> {
  const supabase = await createServerSupabaseClient();
  
  // Select only anonymized data to ensure PII is never sent to the client
  const { data, error } = await supabase
    .from('bookings')
    .select('id, villa_id, check_in_date, check_out_date, nights, channel, guest_initials, guest_country, net_to_villa_usd')
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
