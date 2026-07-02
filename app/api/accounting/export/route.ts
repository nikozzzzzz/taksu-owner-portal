import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const role = user?.app_metadata?.role || 'guest';
    if (!['admin', 'root', 'accountant'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const villaId = searchParams.get('villa_id');
    const transactionType = searchParams.get('transaction_type');
    const categoryId = searchParams.get('category_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    const supabase = await createServerSupabaseClient();

    let query = (supabase as any)
      .from('accounting_transactions')
      .select(`
        *,
        category:accounting_categories(id, name, type),
        villa:villas(id, display_name),
        responsible:owners!accounting_transactions_responsible_owner_id_fkey(id, full_name)
      `)
      .neq('status', 'cancelled')
      .order('transaction_date', { ascending: false });

    if (entityType) query = query.eq('entity_type', entityType);
    if (villaId) query = query.eq('villa_id', villaId);
    if (transactionType) query = query.eq('transaction_type', transactionType);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (dateFrom) query = query.gte('transaction_date', dateFrom);
    if (dateTo) query = query.lte('transaction_date', dateTo);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,vendor_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Build CSV
    const headers = [
      'Date', 'Type', 'Category', 'Title', 'Description', 'Amount', 'Currency',
      'Amount USD', 'Vendor', 'Invoice #', 'Responsible', 'Status', 'Entity', 'Villa',
    ];

    const rows = (data as any[]).map(t => [
      t.transaction_date,
      t.transaction_type,
      t.category?.name || '',
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      t.amount_usd ?? '',
      `"${(t.vendor_name || '').replace(/"/g, '""')}"`,
      t.invoice_number || '',
      t.responsible?.full_name || '',
      t.status,
      t.entity_type,
      t.villa?.display_name || (t.entity_type === 'management_company' ? 'Management Company' : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const fileName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
