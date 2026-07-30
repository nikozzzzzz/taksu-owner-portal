'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { calculateStatement } from '@/lib/calculations/statement-calc';

export async function manualRecalculateStatementAction(villaId: string, billingMonthStr: string) {
  const owner = await requireOwner();
  if (owner.role !== 'admin' && owner.role !== 'root' && owner.role !== 'accountant') {
    throw new Error('Unauthorized');
  }
  await autoRecalculateStatement(villaId, billingMonthStr);
}

export async function autoRecalculateStatement(villaId: string, billingMonthStr: string) {
  // billingMonthStr is like '2026-07-01'
  let supabase: any;
  try {
    supabase = (await createServerSupabaseClient()) as any;
  } catch (err) {
    const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
    supabase = createAdminSupabaseClient();
  }
  
  // 1. Get villa & owner details
  const { data: villa } = await supabase
    .from('villas')
    .select('owner_id, default_management_fee_rate')
    .eq('id', villaId)
    .maybeSingle();
    
  if (!villa) {
    console.error(`[StatementAuto] Villa not found: ${villaId}`);
    return;
  }
  
  const { data: owner } = await supabase
    .from('owners')
    .select('pph26_effective_rate')
    .eq('id', villa.owner_id)
    .maybeSingle();
    
  if (!owner) {
    console.error(`[StatementAuto] Owner not found for villa: ${villaId}`);
    return;
  }
  
  // 2. Fetch all confirmed bookings for this month
  const startDate = billingMonthStr;
  const year = new Date(billingMonthStr).getFullYear();
  const month = new Date(billingMonthStr).getMonth();
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('villa_id', villaId)
    .neq('status', 'cancelled')
    .gte('check_in_date', startDate)
    .lte('check_in_date', endDate);
    
  // 3. Fetch confirmed expense transactions for this month from accounting_transactions
  const { data: txExpenses } = await supabase
    .from('accounting_transactions')
    .select(`
      id,
      amount,
      amount_usd,
      currency,
      fx_rate,
      transaction_date,
      description,
      status,
      vendor_name,
      invoice_number,
      responsible_owner_id,
      accounting_categories(name)
    `)
    .eq('villa_id', villaId)
    .eq('entity_type', 'villa')
    .eq('transaction_type', 'expense')
    .eq('status', 'confirmed')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  // 4. Check if statement already exists or create a new one to get the statement ID
  let statementId: string;
  const { data: existing } = await supabase
    .from('monthly_statements')
    .select('id, status')
    .eq('villa_id', villaId)
    .eq('billing_month', billingMonthStr)
    .maybeSingle();

  if (existing) {
    statementId = existing.id;
  } else {
    // Insert a skeleton statement first to get an ID
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const feeRate = (villa.default_management_fee_rate ?? 20) / 100;
    const pph26Rate = owner.pph26_effective_rate ?? 0.20;

    const { data: newStmt, error: insertErr } = await supabase
      .from('monthly_statements')
      .insert({
        villa_id: villaId,
        owner_id: villa.owner_id,
        billing_month: billingMonthStr,
        gross_revenue_usd: 0,
        net_revenue_usd: 0,
        net_profit_usd: 0,
        management_fee_usd: 0,
        management_fee_rate: feeRate,
        owner_gross_payout_usd: 0,
        pph26_rate: pph26Rate,
        pph26_amount_usd: 0,
        owner_net_payout_usd: 0,
        bookings_count: 0,
        occupied_nights: 0,
        available_nights: daysInMonth,
        status: 'sent_to_owner' // Default to sent_to_owner so owner can view it
      })
      .select('id')
      .single();

    if (insertErr || !newStmt) {
      console.error(`[StatementAuto] Failed to insert skeleton statement for Month ${billingMonthStr}:`, insertErr);
      return;
    }
    statementId = newStmt.id;
  }

  // 5. Delete existing opex rows for this statement
  await supabase
    .from('operating_expenses')
    .delete()
    .eq('statement_id', statementId);

  // 6. Map and insert transaction expenses into operating_expenses
  const opexRows = (txExpenses || []).map((tx: any) => ({
    villa_id: villaId,
    statement_id: statementId,
    category: tx.accounting_categories?.name || 'Other Expenses',
    subcategory: null,
    description: tx.description || '',
    amount_usd: Number(tx.amount_usd ?? tx.amount) || 0,
    amount_idr: tx.currency === 'IDR' ? Number(tx.amount) : null,
    fx_rate: tx.fx_rate ? Number(tx.fx_rate) : null,
    receipt_urls: [],
    vendor_name: tx.vendor_name || null,
    invoice_number: tx.invoice_number || null,
    added_by_id: tx.responsible_owner_id || villa.owner_id,
    approval_status: 'auto_approved',
    expense_date: tx.transaction_date,
    billing_month: billingMonthStr
  }));

  if (opexRows.length > 0) {
    const { error: opexInsertErr } = await supabase
      .from('operating_expenses')
      .insert(opexRows);
    if (opexInsertErr) {
      console.error(`[StatementAuto] Failed to copy opex rows for statement ${statementId}:`, opexInsertErr);
    }
  }

  // 7. Calculate statement details with all bookings and opex rows
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const feeRate = (villa.default_management_fee_rate ?? 20) / 100;
  const pph26Rate = owner.pph26_effective_rate ?? 0.20;

  const mappedExpenses = opexRows.map((row: any, index: number) => ({
    id: `temp-${index}`,
    ...row,
    created_at: '',
    updated_at: ''
  }));

  const calc = calculateStatement({
    bookings: bookings || [],
    expenses: mappedExpenses,
    managementFeeRate: feeRate,
    pph26Rate: pph26Rate,
    daysInMonth: daysInMonth
  });

  // 8. Update statement with calculated values
  const payload = {
    gross_revenue_usd: calc.gross_revenue_usd,
    revenue_by_channel: calc.revenue_by_channel,
    channel_commission_usd: calc.channel_commission_usd,
    phr_tax_usd: calc.phr_tax_usd,
    net_revenue_usd: calc.net_revenue_usd,
    
    // Expenses
    total_opex_usd: calc.total_opex_usd,
    opex_breakdown: calc.opex_breakdown,
    
    // Profit & Fees
    net_profit_usd: calc.net_profit_usd,
    management_fee_usd: calc.management_fee_usd,
    owner_gross_payout_usd: calc.owner_gross_payout_usd,
    
    // Taxes
    pph26_amount_usd: calc.pph26_amount_usd,
    owner_net_payout_usd: calc.owner_net_payout_usd,
    
    // Stats
    bookings_count: calc.bookings_count,
    occupied_nights: calc.occupied_nights,
    occupancy_rate: calc.occupancy_rate,
    adr_usd: calc.adr_usd,
    revpar_usd: calc.revpar_usd,
    
    updated_at: new Date().toISOString()
  };

  const { error: updateErr } = await supabase
    .from('monthly_statements')
    .update(payload)
    .eq('id', statementId);

  if (updateErr) {
    console.error(`[StatementAuto] Final update failed for statement ${statementId}:`, updateErr);
  } else {
    console.log(`[StatementAuto] Recalculated statement ${statementId} for Villa ${villaId} / Month ${billingMonthStr}`);
  }
}
