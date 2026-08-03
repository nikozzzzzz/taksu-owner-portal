import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type AnalyticsPeriod = 'ytd' | '12m' | string; // string is for specific years like '2026'

export async function getAnalyticsData(ownerId: string, role: string, period: AnalyticsPeriod, villaId?: string) {
  const supabase = await createServerSupabaseClient();
  
  const today = new Date();
  let startDate = '';
  let endDate = today.toISOString().split('T')[0];

  if (period === '12m') {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    // Get first day of that month
    startDate = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth(), 1).toISOString().split('T')[0];
  } else if (period === 'ytd') {
    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  } else if (period.includes('_')) {
    // Custom period, e.g., '2026-01_2026-06'
    const [start, end] = period.split('_');
    startDate = `${start}-01`;
    // For end date, using -31 works safely for PostgreSQL string comparisons as it will include all days of that month
    endDate = `${end}-31`;
  } else {
    // Specific year (e.g. "2026")
    const year = parseInt(period, 10);
    startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    endDate = new Date(year, 11, 31).toISOString().split('T')[0];
  }

  let query = supabase
    .from('monthly_statements')
    .select('*')
    .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed'])
    .gte('billing_month', startDate)
    .lte('billing_month', endDate)
    .order('billing_month', { ascending: true });

  if (villaId && villaId !== 'all') {
    query = query.eq('villa_id', villaId);
  } else {
    if (role !== 'admin' && role !== 'root') {
      query = query.eq('owner_id', ownerId);
    }
  }

  const { data: statements, error } = await query;

  if (error) {
    console.error('Error fetching analytics statements:', error);
    return { statements: [], bookings: [] };
  }

  // Fetch bookings for the hybrid chart
  let bookingsQuery = supabase
    .from('bookings')
    .select('check_in_date, check_out_date, nights, net_to_villa_usd, total_paid_by_guest_usd, status, villa_id')
    .neq('status', 'cancelled')
    .lte('check_in_date', endDate)
    .gte('check_out_date', startDate);

  if (villaId && villaId !== 'all') {
    bookingsQuery = bookingsQuery.eq('villa_id', villaId);
  } else {
    // If not admin, we need to filter bookings by the user's villas
    // But bookings don't have owner_id, so we'll fetch them after getting allowed villas if we passed them,
    // or we can join the villas table.
    // In Supabase, we can filter by inner joining (villas!inner(owner_id))
    if (role !== 'admin' && role !== 'root') {
      bookingsQuery = bookingsQuery.eq('villas.owner_id', ownerId) as any;
      // Note: to do inner join, the select needs to be: select('..., villas!inner(owner_id)')
    }
  }

  // To properly handle the join if needed:
  let finalBookingsQuery = supabase
    .from('bookings')
    .select(
      role !== 'admin' && role !== 'root' && (!villaId || villaId === 'all')
        ? 'check_in_date, check_out_date, nights, net_to_villa_usd, total_paid_by_guest_usd, status, villa_id, villas!inner(owner_id)'
        : 'check_in_date, check_out_date, nights, net_to_villa_usd, total_paid_by_guest_usd, status, villa_id'
    )
    .neq('status', 'cancelled')
    .lte('check_in_date', endDate)
    .gte('check_out_date', startDate);

  if (villaId && villaId !== 'all') {
    finalBookingsQuery = finalBookingsQuery.eq('villa_id', villaId);
  } else if (role !== 'admin' && role !== 'root') {
    finalBookingsQuery = finalBookingsQuery.eq('villas.owner_id', ownerId) as any;
  }

  const { data: bookings, error: bookingsError } = await finalBookingsQuery;

  if (bookingsError) {
    console.error('Error fetching analytics bookings:', bookingsError);
  }

  return { 
    statements: statements || [], 
    bookings: bookings || [] 
  };
}
