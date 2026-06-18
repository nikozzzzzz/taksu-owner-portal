import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type AnalyticsPeriod = 'ytd' | '12m' | string; // string is for specific years like '2026'

export async function getAnalyticsData(ownerId: string, period: AnalyticsPeriod) {
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
  } else {
    // Specific year (e.g. "2026")
    const year = parseInt(period, 10);
    startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    endDate = new Date(year, 11, 31).toISOString().split('T')[0];
  }

  const { data: statements, error } = await supabase
    .from('monthly_statements')
    .select('*')
    .eq('owner_id', ownerId)
    .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed'])
    .gte('billing_month', startDate)
    .lte('billing_month', endDate)
    .order('billing_month', { ascending: true });

  if (error) {
    console.error('Error fetching analytics statements:', error);
    return [];
  }

  return statements;
}
