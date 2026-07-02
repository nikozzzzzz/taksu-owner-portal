import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TransactionList } from '@/components/accounting/transaction-list';
import { CategoryList } from '@/components/accounting/category-list';
import { InvoiceList } from '@/components/accounting/invoice-list';
import { getTransactions, getCategories, getInvoices } from '@/lib/actions/accounting-actions';
import Link from 'next/link';
import { ChevronRight, BookOpen, Building2, Briefcase } from 'lucide-react';

interface PageProps {
  params: Promise<{ entityType: string; entityId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getStringParam(val: string | string[] | undefined): string | undefined {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { entityType, entityId } = await params;
  const label = entityType === 'management_company' ? 'Management Company' : 'Villa';
  return {
    title: `${label} Accounting | Taksu Living`,
    description: `Manage income and expenses for ${label}`,
  };
}

export default async function AccountingEntityPage({ params, searchParams }: PageProps) {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root', 'accountant'].includes(role)) {
    redirect('/dashboard');
  }

  const { entityType, entityId } = await params;
  const sp = await searchParams;

  if (!['villa', 'management_company'].includes(entityType)) {
    redirect('/accounting');
  }

  const tab = getStringParam(sp.tab) || 'transactions';
  const filters = {
    entity_type: entityType as 'villa' | 'management_company',
    villa_id: entityType === 'villa' ? entityId : undefined,
    transaction_type: getStringParam(sp.type) as any,
    category_id: getStringParam(sp.category_id),
    date_from: getStringParam(sp.date_from),
    date_to: getStringParam(sp.date_to),
    search: getStringParam(sp.search),
  };

  const supabase = await createServerSupabaseClient();

  // Get entity label
  let entityLabel = 'Management Company';
  let entitySubtitle = 'PT Taksu Living Management';
  if (entityType === 'villa') {
    const { data: villa } = await supabase
      .from('villas')
      .select('display_name, internal_code')
      .eq('id', entityId)
      .single();
    if (!villa) redirect('/accounting');
    const v = villa as any;
    entityLabel = v.display_name;
    entitySubtitle = v.internal_code || '';
  }

  const [transactions, categories, invoices, staffListRes] = await Promise.all([
    getTransactions(filters).catch(() => []),
    getCategories().catch(() => []),
    getInvoices({ entity_type: entityType, villa_id: entityType === 'villa' ? entityId : undefined }).catch(() => []),
    supabase.from('owners').select('id, full_name, role').in('role', ['admin', 'root', 'service', 'accountant']),
  ]);

  const staffList = staffListRes.data || [];

  const TABS = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'categories', label: 'Categories' },
  ];

  return (
    <div className="portal-page animate-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/accounting" className="hover:text-taksu-jungle flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          Accounting
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium">{entityLabel}</span>
      </nav>

      {/* Header */}
      <div className="portal-page-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-taksu-forest text-white">
            {entityType === 'management_company'
              ? <Briefcase className="h-5 w-5" />
              : <Building2 className="h-5 w-5" />
            }
          </div>
          <div>
            <h1 className="portal-page-title">{entityLabel}</h1>
            {entitySubtitle && <p className="portal-page-subtitle">{entitySubtitle}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/accounting/${entityType}/${entityId}?tab=${t.id}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-taksu-jungle text-taksu-jungle'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            staffList={staffList}
            entityType={entityType}
            entityId={entityId}
            filters={filters}
          />
        )}
        {tab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            categories={categories}
            entityType={entityType}
            entityId={entityId}
          />
        )}
        {tab === 'categories' && (
          <CategoryList categories={categories} />
        )}
      </div>
    </div>
  );
}
