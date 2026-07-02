'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertTransaction } from '@/lib/actions/accounting-actions';

interface TransactionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any | null;
  categories: any[];
  staffList: any[];
  entityType: string;
  entityId: string;
}

const CURRENCIES = ['USD', 'IDR', 'EUR'];

export function TransactionFormDialog({
  isOpen,
  onClose,
  transaction,
  categories,
  staffList,
  entityType,
  entityId,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;

  const defaultForm = {
    transaction_type: transaction?.transaction_type || 'expense',
    category_id: transaction?.category_id || '',
    title: transaction?.title || '',
    amount: transaction?.amount ? String(transaction.amount) : '',
    currency: transaction?.currency || 'USD',
    fx_rate: transaction?.fx_rate ? String(transaction.fx_rate) : '1',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    description: transaction?.description || '',
    comment: transaction?.comment || '',
    vendor_name: transaction?.vendor_name || '',
    invoice_number: transaction?.invoice_number || '',
    responsible_owner_id: transaction?.responsible_owner_id || '',
    status: transaction?.status || 'confirmed',
  };

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const currentTypeCategories = categories.filter(c => c.type === form.transaction_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await upsertTransaction({
        ...(isEditing ? { id: transaction.id } : {}),
        entity_type: entityType as any,
        villa_id: entityType === 'villa' ? entityId : null,
        ...form,
        amount: Number(form.amount),
        fx_rate: Number(form.fx_rate) || 1,
        responsible_owner_id: form.responsible_owner_id || null,
        invoice_number: form.invoice_number || null,
        vendor_name: form.vendor_name || null,
        comment: form.comment || null,
        description: form.description || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-taksu-forest">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {(['income', 'expense'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  set('transaction_type', type);
                  set('category_id', '');
                }}
                className={`rounded-lg border-2 py-2.5 text-sm font-semibold capitalize transition-all ${
                  form.transaction_type === type
                    ? type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="col-span-2">
              <Label>Category *</Label>
              <select
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
              >
                <option value="">Select category</option>
                {currentTypeCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="col-span-2">
              <Label htmlFor="tx-title">Title *</Label>
              <Input
                id="tx-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                placeholder="e.g. Monthly electricity bill"
                className="mt-1"
              />
            </div>

            {/* Amount + Currency */}
            <div>
              <Label htmlFor="tx-amount">Amount *</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* FX Rate (show only when non-USD) */}
            {form.currency !== 'USD' && (
              <div className="col-span-2">
                <Label htmlFor="tx-fx">Exchange Rate (1 USD = ? {form.currency})</Label>
                <Input
                  id="tx-fx"
                  type="number"
                  step="0.0001"
                  value={form.fx_rate}
                  onChange={(e) => set('fx_rate', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {/* Date */}
            <div>
              <Label htmlFor="tx-date">Date *</Label>
              <input
                id="tx-date"
                type="date"
                value={form.transaction_date}
                onChange={(e) => set('transaction_date', e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
              />
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>

            {/* Vendor */}
            <div>
              <Label htmlFor="tx-vendor">Vendor / Supplier</Label>
              <Input
                id="tx-vendor"
                value={form.vendor_name}
                onChange={(e) => set('vendor_name', e.target.value)}
                placeholder="e.g. PLN"
                className="mt-1"
              />
            </div>

            {/* Invoice # */}
            <div>
              <Label htmlFor="tx-invoice">Invoice Number</Label>
              <Input
                id="tx-invoice"
                value={form.invoice_number}
                onChange={(e) => set('invoice_number', e.target.value)}
                placeholder="e.g. INV-001"
                className="mt-1"
              />
            </div>

            {/* Responsible staff */}
            <div className="col-span-2">
              <Label>Responsible Employee</Label>
              <select
                value={form.responsible_owner_id}
                onChange={(e) => set('responsible_owner_id', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— Not assigned —</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label htmlFor="tx-desc">Description</Label>
              <textarea
                id="tx-desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                placeholder="Short description..."
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle resize-none"
              />
            </div>

            {/* Comment */}
            <div className="col-span-2">
              <Label htmlFor="tx-comment">Comment</Label>
              <textarea
                id="tx-comment"
                value={form.comment}
                onChange={(e) => set('comment', e.target.value)}
                rows={2}
                placeholder="Internal comment..."
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-taksu-jungle hover:bg-taksu-forest text-white"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
