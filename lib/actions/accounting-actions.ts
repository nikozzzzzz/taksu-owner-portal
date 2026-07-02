'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  categorySchema, CategoryInput,
  transactionSchema, TransactionInput,
  invoiceSchema, InvoiceInput,
  TransactionFilter,
} from '@/lib/validations/accounting';

function requireAccountingRole(role: string) {
  if (!['admin', 'root', 'accountant'].includes(role)) {
    throw new Error('Insufficient permissions');
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('accounting_categories' as any)
    .select('*')
    .eq('is_active', true)
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data as any[];
}

export async function upsertCategory(payload: Partial<CategoryInput>) {
  const supabase = await createServerSupabaseClient();

  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid category: ' + parsed.error.errors.map(e => e.message).join(', '));
  }

  const { id, ...rest } = parsed.data;
  if (id) {
    const { error } = await (supabase as any).from('accounting_categories').update(rest).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await (supabase as any).from('accounting_categories').insert(rest);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/accounting');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createServerSupabaseClient();

  // Check if any transactions reference this category
  const { count } = await (supabase as any)
    .from('accounting_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if ((count ?? 0) > 0) {
    throw new Error('Cannot delete category: it is used by existing transactions');
  }

  const { error } = await (supabase as any).from('accounting_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/accounting');
  return { success: true };
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function getTransactions(filters: TransactionFilter = {}) {
  const supabase = await createServerSupabaseClient();

  let query = (supabase as any)
    .from('accounting_transactions')
    .select(`
      *,
      category:accounting_categories(id, name, type, color),
      villa:villas(id, display_name),
      responsible:owners!accounting_transactions_responsible_owner_id_fkey(id, full_name)
    `)
    .neq('status', 'cancelled')
    .order('transaction_date', { ascending: false });

  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.villa_id) query = query.eq('villa_id', filters.villa_id);
  if (filters.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
  if (filters.category_id) query = query.eq('category_id', filters.category_id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.date_from) query = query.gte('transaction_date', filters.date_from);
  if (filters.date_to) query = query.lte('transaction_date', filters.date_to);
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as any[];
}

export async function getTransactionSummary(filters: TransactionFilter = {}) {
  const transactions = await getTransactions(filters);
  const income = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (t.amount_usd ?? t.amount), 0);
  const expense = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (t.amount_usd ?? t.amount), 0);
  return { income, expense, net: income - expense, count: transactions.length };
}

export async function upsertTransaction(payload: Partial<TransactionInput>) {
  const supabase = await createServerSupabaseClient();

  // Compute amount_usd
  const amount = Number(payload.amount) || 0;
  const fxRate = Number(payload.fx_rate) || 1;
  let amountUsd = amount;
  if (payload.currency === 'IDR') {
    amountUsd = amount / fxRate;
  } else if (payload.currency === 'EUR') {
    amountUsd = amount * fxRate;
  }

  const toValidate = {
    ...payload,
    amount_usd: amountUsd,
    period_month: payload.transaction_date
      ? payload.transaction_date.substring(0, 7) + '-01'
      : null,
  };

  const parsed = transactionSchema.safeParse(toValidate);
  if (!parsed.success) {
    throw new Error('Invalid transaction: ' + parsed.error.errors.map(e => e.message).join(', '));
  }

  const { id, ...rest } = parsed.data;
  if (id) {
    const { error } = await (supabase as any).from('accounting_transactions').update(rest).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await (supabase as any).from('accounting_transactions').insert(rest);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/accounting');
  return { success: true };
}

export async function cancelTransaction(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await (supabase as any)
    .from('accounting_transactions')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/accounting');
  return { success: true };
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export async function getInvoices(filters: { entity_type?: string; villa_id?: string; status?: string } = {}) {
  const supabase = await createServerSupabaseClient();

  let query = (supabase as any)
    .from('accounting_invoices')
    .select(`
      *,
      villa:villas(id, display_name),
      items:accounting_invoice_items(*)
    `)
    .order('issue_date', { ascending: false });

  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.villa_id) query = query.eq('villa_id', filters.villa_id);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as any[];
}

export async function getInvoice(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase as any)
    .from('accounting_invoices')
    .select(`
      *,
      villa:villas(id, display_name),
      items:accounting_invoice_items(* order sort_order)
    `)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertInvoice(payload: InvoiceInput) {
  const supabase = await createServerSupabaseClient();

  const parsed = invoiceSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid invoice: ' + parsed.error.errors.map(e => e.message).join(', '));
  }

  const { items, id, ...invoiceData } = parsed.data;

  // Compute totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price_usd, 0);
  const taxAmount = subtotal * (invoiceData.tax_rate || 0);
  const total = subtotal + taxAmount;

  const invoicePayload = {
    ...invoiceData,
    subtotal_usd: subtotal,
    tax_amount_usd: taxAmount,
    total_usd: total,
    client_email: invoiceData.client_email || null,
  };

  let invoiceId = id;

  if (id) {
    const { error } = await (supabase as any).from('accounting_invoices').update(invoicePayload).eq('id', id);
    if (error) throw new Error(error.message);
    // Delete old items then re-insert
    await (supabase as any).from('accounting_invoice_items').delete().eq('invoice_id', id);
  } else {
    const { data, error } = await (supabase as any)
      .from('accounting_invoices')
      .insert(invoicePayload)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    invoiceId = data.id;
  }

  // Insert line items
  const itemsWithId = items.map((item, i) => ({
    ...item,
    invoice_id: invoiceId,
    sort_order: i,
  }));
  const { error: itemsError } = await (supabase as any)
    .from('accounting_invoice_items')
    .insert(itemsWithId);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath('/accounting');
  return { success: true, id: invoiceId };
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createServerSupabaseClient();
  const updateData: any = { status };
  if (status === 'paid') updateData.paid_at = new Date().toISOString();

  const { error } = await (supabase as any)
    .from('accounting_invoices')
    .update(updateData)
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/accounting');
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const supabase = await createServerSupabaseClient();

  // Only allow deleting drafts
  const { data } = await (supabase as any)
    .from('accounting_invoices')
    .select('status')
    .eq('id', id)
    .single();

  if (data?.status !== 'draft') {
    throw new Error('Only draft invoices can be deleted');
  }

  const { error } = await (supabase as any).from('accounting_invoices').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/accounting');
  return { success: true };
}

// ─── Next Invoice Number ──────────────────────────────────────────────────────
export async function generateNextInvoiceNumber(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const year = new Date().getFullYear();

  const { data } = await (supabase as any)
    .from('accounting_invoices')
    .select('invoice_number')
    .ilike('invoice_number', `INV-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return `INV-${year}-001`;
  }

  const lastNumber = data[0].invoice_number;
  const parts = lastNumber.split('-');
  const seq = parseInt(parts[2] || '0', 10) + 1;
  return `INV-${year}-${String(seq).padStart(3, '0')}`;
}
