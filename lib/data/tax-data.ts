import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type TaxDocumentRow = Pick<
  Database['public']['Tables']['monthly_statements']['Row'],
  'id' | 'billing_month' | 'bukti_potong_pdf_url' | 'pph26_amount_usd' | 'gross_revenue_usd' | 'owner_gross_payout_usd'
>;

export async function getTaxDocuments(ownerId: string): Promise<TaxDocumentRow[]> {
  const supabase = await createServerSupabaseClient();
  
  // Fetch statements that have tax withholding
  const { data, error } = await supabase
    .from('monthly_statements')
    .select('id, billing_month, bukti_potong_pdf_url, pph26_amount_usd, gross_revenue_usd, owner_gross_payout_usd')
    .eq('owner_id', ownerId)
    .gt('pph26_amount_usd', 0) // Only those with tax withheld
    .in('status', ['approved', 'sent_to_owner', 'paid', 'disputed'])
    .order('billing_month', { ascending: false });

  if (error) {
    console.error('Error fetching tax documents:', error);
    return [];
  }
  
  return data;
}

export async function getDgt1Status(ownerId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('owners')
    .select('dgt1_status, dgt1_valid_until, dgt1_document_url, pph26_effective_rate')
    .eq('id', ownerId)
    .single();

  if (error || !data) {
    return {
      status: 'none' as const,
      validUntil: null,
      documentUrl: null,
      rate: 0.20
    };
  }
  
  return {
    status: data.dgt1_status,
    validUntil: data.dgt1_valid_until,
    documentUrl: data.dgt1_document_url,
    rate: data.pph26_effective_rate
  };
}
