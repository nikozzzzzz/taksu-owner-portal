'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, CheckCircle, Send, XCircle, Clock } from 'lucide-react';
import { deleteInvoice, updateInvoiceStatus } from '@/lib/actions/accounting-actions';
import { InvoiceFormDialog } from './invoice-form-dialog';

interface InvoiceListProps {
  invoices: any[];
  categories: any[];
  entityType: string;
  entityId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-50 text-blue-700', icon: Send },
  paid: { label: 'Paid', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-400', icon: XCircle },
};

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function InvoiceList({ invoices, categories, entityType, entityId }: InvoiceListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm('Delete this draft invoice?')) return;
    startTransition(async () => {
      try { await deleteInvoice(id); } catch (err: any) { alert(err.message); }
    });
  };

  const handleMarkPaid = (id: string) => {
    if (!confirm('Mark this invoice as paid?')) return;
    startTransition(async () => {
      try { await updateInvoiceStatus(id, 'paid'); } catch (err: any) { alert(err.message); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-500">Create and manage invoices and closing documents.</p>
        </div>
        <Button
          onClick={() => { setEditingInvoice(null); setIsDialogOpen(true); }}
          className="bg-taksu-jungle hover:bg-taksu-forest text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No invoices yet. Click "Create Invoice" to start.
                </td>
              </tr>
            ) : (
              invoices.map(inv => {
                const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{inv.client_name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{inv.title}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(inv.issue_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {fmt(inv.total_usd)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/accounting/${entityType}/${entityId}/invoices/${inv.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </Link>
                      {inv.status === 'sent' && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleMarkPaid(inv.id)}
                          className="h-8 px-2 text-xs text-green-600"
                          disabled={isPending}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {inv.status === 'draft' && (
                        <>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setEditingInvoice(inv); setIsDialogOpen(true); }}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4 rotate-45 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleDelete(inv.id)}
                            className="h-8 w-8 p-0"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <InvoiceFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        invoice={editingInvoice}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
}
