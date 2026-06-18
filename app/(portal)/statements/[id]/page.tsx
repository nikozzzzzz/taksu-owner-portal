import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/auth/middleware';
import { getStatementDetail } from '@/lib/data/statements';
import { StatementDetail } from '@/components/statements/statement-detail';

export const metadata: Metadata = {
  title: 'Statement Detail',
};

export default async function StatementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const owner = await requireOwner();
  
  const data = await getStatementDetail(resolvedParams.id, owner.id);
  
  if (!data) {
    notFound();
  }

  return (
    <div className="portal-page animate-in">
      <StatementDetail statement={data.statement} expenses={data.expenses} />
    </div>
  );
}
