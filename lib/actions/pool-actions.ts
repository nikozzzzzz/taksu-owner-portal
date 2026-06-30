'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { poolSchema } from '@/lib/validations/pool';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const role = user.app_metadata?.role || 'guest';
  if (!['admin', 'root'].includes(role)) throw new Error('Forbidden');
}

export async function upsertPool(payload: any) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const parsed = poolSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("UPSERT POOL VALIDATION ERROR:", parsed.error.errors);
    throw new Error('Invalid pool data: ' + parsed.error.errors.map(e => e.message).join(', '));
  }

  const { error } = await (supabase as any).from('pools').upsert({
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    ...parsed.data
  });

  if (error) {
    console.error("UPSERT POOL DB ERROR:", error);
    throw new Error(error.message);
  }
  revalidatePath('/admin/pools');
  return { success: true };
}

export async function deletePool(id: string) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await (supabase as any).from('pools').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/pools');
  return { success: true };
}

// Complex action for the daily pool report
export async function getPoolDailyReport(poolId: string, startDate: string, endDate: string) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // 1. Get all villas in this pool
  const { data: villasData, error: villasError } = await supabase
    .from('villas')
    .select('id, internal_code, display_name')
    .eq('pool_id', poolId);

  if (villasError) throw new Error(villasError.message);
  if (!villasData || villasData.length === 0) return { data: [], villas: [] };

  const villas = villasData as any[];
  const villaIds = villas.map(v => v.id);

  // 2. Get bookings overlapping with date range
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, villa_id, check_in_date, check_out_date, net_to_villa_usd, nights')
    .in('villa_id', villaIds)
    .gte('check_out_date', startDate)
    .lte('check_in_date', endDate)
    .neq('status', 'cancelled');

  if (bookingsError) throw new Error(bookingsError.message);
  const bookings = bookingsData as any[];

  // 3. Get operating expenses in date range
  const { data: expensesData, error: expensesError } = await supabase
    .from('operating_expenses')
    .select('id, villa_id, amount_usd, expense_date')
    .in('villa_id', villaIds)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (expensesError) throw new Error(expensesError.message);
  const expenses = expensesData as any[];

  // 4. Build daily aggregation
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyData: Record<string, any> = {};

  // Initialize all days
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyData[dateStr] = {
      date: dateStr,
      total_revenue: 0,
      total_expenses: 0,
      net_profit: 0
    };
    // Initialize per-villa revenue tracking
    villas.forEach(v => {
      dailyData[dateStr][`revenue_${v.internal_code}`] = 0;
    });
  }

  // Aggregate bookings (spread revenue evenly across nights)
  if (bookings) {
    bookings.forEach(b => {
      const bStart = new Date(b.check_in_date);
      const bEnd = new Date(b.check_out_date);
      const dailyRevenue = Number(b.net_to_villa_usd) / Math.max(1, b.nights);
      
      const villaCode = villas.find(v => v.id === b.villa_id)?.internal_code || 'unknown';

      // Iterate through nights of this booking
      for (let d = new Date(bStart); d < bEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr][`revenue_${villaCode}`] += dailyRevenue;
          dailyData[dateStr].total_revenue += dailyRevenue;
        }
      }
    });
  }

  // Aggregate expenses
  if (expenses) {
    expenses.forEach(e => {
      const dateStr = e.expense_date;
      if (dailyData[dateStr]) {
        dailyData[dateStr].total_expenses += Number(e.amount_usd);
      }
    });
  }

  // Calculate net profit
  const result = Object.values(dailyData).map(day => ({
    ...day,
    net_profit: day.total_revenue - day.total_expenses
  }));

  // Sort by date just in case
  result.sort((a, b) => a.date.localeCompare(b.date));

  return {
    data: result,
    villas: villas
  };
}
