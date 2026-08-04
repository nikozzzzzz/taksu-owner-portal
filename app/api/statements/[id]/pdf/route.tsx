import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StatementPdf } from '@/lib/pdf/statement-pdf';

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
    
    // Current User Check
    const { data: currentUser } = (await supabase
      .from('owners')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()) as { data: { id: string; role: string } | null, error: any };
      
    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Statement Fetch
    let query = supabase
      .from('monthly_statements')
      .select(`
        *,
        villas(display_name, internal_code),
        owners(full_name, email, tax_residency_country)
      `)
      .eq('id', resolvedParams.id)
      .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed']);

    if (currentUser.role !== 'admin' && currentUser.role !== 'root' && currentUser.role !== 'accountant') {
      query = query.eq('owner_id', currentUser.id);
    }

    const { data: statement, error } = await query.single();

    if (error || !statement) {
      return new NextResponse('Statement not found or not accessible', { status: 404 });
    }
    
    // The statement already includes owners data because of the join: owners(full_name, ...)
    const statementWithOwner = statement;

    // Render PDF
    const stream = await renderToStream(<StatementPdf statement={statementWithOwner as any} />);

    // Return as PDF file
    const billingMonth = (statement as any).billing_month.substring(0, 7); // YYYY-MM
    const filename = `Taksu_Statement_${(statement as any).villas?.internal_code}_${billingMonth}.pdf`;

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('Error generating PDF:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
