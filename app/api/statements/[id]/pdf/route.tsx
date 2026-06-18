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
    
    // Owner Check
    const { data: owner } = await supabase
      .from('owners')
      .select('id, full_name, email, tax_residency_country')
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
    
    // Inject owner data into statement
    const statementWithOwner = {
      ...(statement as any),
      owners: owner
    };

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
