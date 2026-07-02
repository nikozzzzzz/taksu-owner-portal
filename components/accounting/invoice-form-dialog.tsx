'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { upsertInvoice, generateNextInvoiceNumber } from '@/lib/actions/accounting-actions';

interface InvoiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any | null;
  entityType: string;
  entityId: string;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: string;
  unit_price_usd: string;
}

export function InvoiceFormDialog({ isOpen, onClose, invoice, entityType, entityId }: InvoiceFormDialogProps) {
  const isEditing = !!invoice;

  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || '',
    issuer_name: invoice?.issuer_name || 'PT Taksu Living Management',
    client_name: invoice?.client_name || '',
    client_address: invoice?.client_address || '',
    client_tax_id: invoice?.client_tax_id || '',
    client_email: invoice?.client_email || '',
    title: invoice?.title || '',
    description: invoice?.description || '',
    issue_date: invoice?.issue_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || '',
    currency: invoice?.currency || 'USD',
    tax_rate: invoice?.tax_rate ? String(Math.round(invoice.tax_rate * 100)) : '0',
    status: invoice?.status || 'draft',
  });

  const [items, setItems] = useState<LineItem[]>(
    invoice?.items?.length
      ? invoice.items.map((i: any) => ({
          id: i.id,
          description: i.description,
          quantity: String(i.quantity),
          unit_price_usd: String(i.unit_price_usd),
        }))
      : [{ description: '', quantity: '1', unit_price_usd: '' }]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate invoice number on new invoice
  useEffect(() => {
    if (!isEditing && isOpen) {
      generateNextInvoiceNumber().then(num => {
        setForm(prev => ({ ...prev, invoice_number: num }));
      }).catch(() => {});
    }
  }, [isOpen, isEditing]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: '1', unit_price_usd: '' }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: keyof LineItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.unit_price_usd) || 0;
    return sum + q * p;
  }, 0);
  const taxRate = (parseFloat(form.tax_rate) || 0) / 100;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await upsertInvoice({
        ...(isEditing ? { id: invoice.id } : {}),
        ...form,
        tax_rate: taxRate,
        due_date: form.due_date || null,
        client_email: form.client_email || null,
        entity_type: entityType as any,
        villa_id: entityType === 'villa' ? entityId : null,
        items: items.map((item, i) => ({
          ...(item.id ? { id: item.id } : {}),
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit_price_usd: parseFloat(item.unit_price_usd) || 0,
          sort_order: i,
        })),
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
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-taksu-forest">
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="inv-number">Invoice Number *</Label>
              <Input
                id="inv-number"
                value={form.invoice_number}
                onChange={(e) => set('invoice_number', e.target.value)}
                required
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <Label htmlFor="inv-issue">Issue Date *</Label>
              <input
                id="inv-issue"
                type="date"
                value={form.issue_date}
                onChange={(e) => set('issue_date', e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
              />
            </div>
            <div>
              <Label htmlFor="inv-due">Due Date</Label>
              <input
                id="inv-due"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="inv-title">Invoice Title *</Label>
            <Input
              id="inv-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              placeholder="e.g. Management Services – July 2025"
              className="mt-1"
            />
          </div>

          {/* Client info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Client Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="inv-client">Client Name *</Label>
                <Input
                  id="inv-client"
                  value={form.client_name}
                  onChange={(e) => set('client_name', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="inv-addr">Address</Label>
                <Input
                  id="inv-addr"
                  value={form.client_address}
                  onChange={(e) => set('client_address', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="inv-tax">Tax ID (NPWP)</Label>
                <Input
                  id="inv-tax"
                  value={form.client_tax_id}
                  onChange={(e) => set('client_tax_id', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => set('client_email', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-taksu-jungle">
                <Plus className="mr-1 h-3 w-3" /> Add Row
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Unit Price (USD)</div>
                <div className="col-span-1" />
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      required
                      placeholder="Description..."
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price_usd}
                      onChange={(e) => updateItem(idx, 'unit_price_usd', e.target.value)}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tax (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.tax_rate}
                    onChange={(e) => set('tax_rate', e.target.value)}
                    className="w-16 h-6 text-xs"
                  />
                </div>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-bold">
                <span>Total</span>
                <span className="text-taksu-forest">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="inv-desc">Notes / Description</Label>
            <textarea
              id="inv-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Payment terms, notes..."
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded-md bg-red-50 px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-taksu-jungle hover:bg-taksu-forest text-white">
              {loading ? 'Saving...' : isEditing ? 'Save Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
