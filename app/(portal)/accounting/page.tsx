import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EntitySelector } from '@/components/accounting/entity-selector';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accounting | Taksu Living Owner Portal',
  description: 'Manage income, expenses, and invoices for villas and management company',
};

export default async function AccountingPage() {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root', 'accountant'].includes(role)) {
    redirect('/dashboard');
  }

  const supabase = await createServerSupabaseClient();
  const { data: villas } = await supabase
    .from('villas')
    .select('id, display_name, internal_code')
    .neq('status', 'closed')
    .order('display_name', { ascending: true });

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-taksu-jungle">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="portal-page-title">Accounting</h1>
            <p className="portal-page-subtitle">
              Select an entity to view and manage its income and expenses.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <EntitySelector villas={villas || []} />
      </div>
    </div>
  );
}
