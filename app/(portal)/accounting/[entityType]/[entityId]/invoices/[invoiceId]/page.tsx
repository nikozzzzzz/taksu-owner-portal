import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getInvoice, updateInvoiceStatus } from '@/lib/actions/accounting-actions';
import Link from 'next/link';
import { ChevronRight, BookOpen, ArrowLeft, CheckCircle, Send, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ entityType: string; entityId: string; invoiceId: string }>;
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export const metadata: Metadata = {
  title: 'Invoice Detail | Taksu Living',
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root', 'accountant'].includes(role)) {
    redirect('/dashboard');
  }

  const { entityType, entityId, invoiceId } = await params;
  let invoice: any;
  try {
    invoice = await getInvoice(invoiceId);
  } catch {
    redirect(`/accounting/${entityType}/${entityId}?tab=invoices`);
  }

  return (
    <div className="portal-page animate-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/accounting" className="hover:text-taksu-jungle flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          Accounting
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/accounting/${entityType}/${entityId}?tab=invoices`} className="hover:text-taksu-jungle">
          Invoices
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium font-mono">{invoice.invoice_number}</span>
      </nav>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/accounting/${entityType}/${entityId}?tab=invoices`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 print:shadow-none print:border-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-taksu-jungle">
                  <span className="text-xs font-bold text-white">TL</span>
                </div>
                <span className="font-serif text-lg font-semibold text-taksu-forest">
                  {invoice.issuer_name}
                </span>
              </div>
              <p className="text-xs text-gray-400">Bali, Indonesia</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
              <p className="font-mono text-lg text-taksu-forest">{invoice.invoice_number}</p>
              <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[invoice.status] || STATUS_COLORS.draft}`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Issue Date</p>
              <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Due Date</p>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>

          {/* Bill To */}
          <div className="mb-8 rounded-lg bg-gray-50 p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-semibold text-gray-900">{invoice.client_name}</p>
            {invoice.client_address && <p className="text-sm text-gray-600">{invoice.client_address}</p>}
            {invoice.client_tax_id && <p className="text-sm text-gray-500">NPWP: {invoice.client_tax_id}</p>}
            {invoice.client_email && <p className="text-sm text-gray-500">{invoice.client_email}</p>}
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{invoice.title}</h2>
            {invoice.description && <p className="text-sm text-gray-500 mt-1">{invoice.description}</p>}
          </div>

          {/* Line Items */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 w-20">Qty</th>
                <th className="text-right py-2 w-32">Unit Price</th>
                <th className="text-right py-2 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800">{item.description}</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{fmt(item.unit_price_usd)}</td>
                  <td className="py-3 text-right font-medium">{fmt(item.total_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{fmt(invoice.subtotal_usd)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ({(invoice.tax_rate * 100).toFixed(0)}%)</span>
                  <span>{fmt(invoice.tax_amount_usd)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-taksu-forest">{fmt(invoice.total_usd)}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          {invoice.paid_at && (
            <div className="mt-8 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Paid on {new Date(invoice.paid_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {invoice.payment_reference && <span>· Ref: {invoice.payment_reference}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
