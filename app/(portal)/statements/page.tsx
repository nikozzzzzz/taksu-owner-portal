import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { requireOwner } from '@/lib/auth/middleware';
import { getOwnerStatements } from '@/lib/data/statements';
import { StatementList } from '@/components/statements/statement-list';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Statements',
  description: 'View your monthly financial statements and tax documents',
};

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ villaId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const owner = await requireOwner();
  const currentYear = new Date().getFullYear();
  
  const supabase = await createServerSupabaseClient();
  
  let query = supabase.from('villas').select('id, display_name, internal_code').in('status', ['active', 'paused', 'pre_launch']);
  if (owner.role !== 'admin' && owner.role !== 'root') {
    query = query.eq('owner_id', owner.id);
  }
  
  const { data: villas } = await query.order('internal_code', { ascending: true });
  const allowedVillas = (villas as any[]) || [];

  let selectedVillaId = resolvedParams.villaId;
  const villaOptions = [
    { id: 'all', display_name: 'All Properties', internal_code: '*' },
    ...allowedVillas
  ];

  if (!selectedVillaId || !villaOptions.find(v => v.id === selectedVillaId)) {
    selectedVillaId = 'all';
  }

  // Fetch all statements for this owner (no year filter here, client will filter)
  const statements = await getOwnerStatements(owner.id, owner.role, undefined, selectedVillaId);

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <FileText className="h-6 w-6 text-taksu-bamboo" />
          Financial Statements
        </h1>
        <p className="portal-page-subtitle">
          Review your monthly revenue, expenses, and download tax documents.
        </p>
      </div>

      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-taksu-parchment" />}>
          <StatementList 
            statements={statements} 
            currentYear={currentYear} 
            villas={villaOptions}
            selectedVillaId={selectedVillaId}
          />
        </Suspense>
      </div>
    </div>
  );
}
