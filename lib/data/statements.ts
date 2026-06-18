import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type StatementRow = Database['public']['Tables']['monthly_statements']['Row'];

export async function getOwnerStatements(ownerId: string, year?: number) {
  const supabase = await createServerSupabaseClient();
  
  let query = supabase
    .from('monthly_statements')
    .select('*')
    .eq('owner_id', ownerId)
    .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed'])
    .order('billing_month', { ascending: false });

  if (year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    query = query.gte('billing_month', startDate).lte('billing_month', endDate);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching statements:', error);
    return [];
  }
  
  return data;
}

export async function getStatementDetail(statementId: string, ownerId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: statement, error: statementError } = await supabase
    .from('monthly_statements')
    .select('*, villas(display_name, internal_code, max_guests, bedrooms)')
    .eq('id', statementId)
    .eq('owner_id', ownerId)
    .single();

  if (statementError || !statement) return null;

  // Also fetch related expenses
  const { data: expenses } = await supabase
    .from('operating_expenses')
    .select('*')
    .eq('statement_id', statementId)
    .order('expense_date', { ascending: false });

  return { statement, expenses: expenses ?? [] };
}
