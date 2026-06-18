import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateStatementExcel } from '@/lib/excel/statement-excel';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createServerSupabaseClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Owner Check
    const { data: owner } = await supabase
      .from('owners')
      .select('id, full_name, email')
      .eq('auth_user_id', user.id)
      .single();
      
    if (!owner) {
      return new NextResponse('Owner not found', { status: 404 });
    }

    // Statement Fetch
    const { data: statement, error } = await supabase
      .from('monthly_statements')
      .select(`
        *,
        villas(display_name, internal_code)
      `)
      .eq('id', resolvedParams.id)
      .eq('owner_id', (owner as any).id)
      .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed'])
      .single();

    if (error || !statement) {
      return new NextResponse('Statement not found or not accessible', { status: 404 });
    }
    
    // Fetch Expenses
    const { data: expenses } = await supabase
      .from('operating_expenses')
      .select('*')
      .eq('statement_id', (statement as any).id)
      .order('expense_date', { ascending: false });
      
    // Fetch Bookings (for that month, simplification for MVP)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('villa_id', (statement as any).villa_id)
      .neq('status', 'cancelled')
      // Basic month filtering (In real app, link bookings to statement via junction table or exact period)
      .gte('check_in_date', (statement as any).billing_month)
      .lte('check_in_date', new Date(new Date((statement as any).billing_month).getFullYear(), new Date((statement as any).billing_month).getMonth() + 1, 0).toISOString().split('T')[0]);

    // Inject owner data into statement
    const statementWithOwner = {
      ...(statement as any),
      owners: owner
    };

    // Generate Excel Buffer
    const buffer = await generateStatementExcel(
      statementWithOwner as any,
      expenses || [],
      bookings || []
    );

    const billingMonth = (statement as any).billing_month.substring(0, 7); // YYYY-MM
    const filename = `Taksu_Statement_${(statement as any).villas?.internal_code}_${billingMonth}.xlsx`;

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('Error generating Excel:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
