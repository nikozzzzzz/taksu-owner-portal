'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Download, Search, X, TrendingUp, TrendingDown,
  Edit2, Trash2, Filter, ChevronDown,
} from 'lucide-react';
import { cancelTransaction } from '@/lib/actions/accounting-actions';
import { TransactionFormDialog } from './transaction-form-dialog';
import { AccountingSummaryBar } from './accounting-summary-bar';

interface TransactionListProps {
  transactions: any[];
  categories: any[];
  staffList: any[];
  entityType: string;
  entityId: string;
  filters: {
    transaction_type?: string;
    category_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  };
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'IDR' ? 'IDR' : currency === 'EUR' ? 'EUR' : 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function TransactionList({
  transactions,
  categories,
  staffList,
  entityType,
  entityId,
  filters,
}: TransactionListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state
  const [searchText, setSearchText] = useState(filters.search || '');
  const [typeFilter, setTypeFilter] = useState(filters.transaction_type || '');
  const [categoryFilter, setCategoryFilter] = useState(filters.category_id || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchText) params.set('search', searchText); else params.delete('search');
    if (typeFilter) params.set('type', typeFilter); else params.delete('type');
    if (categoryFilter) params.set('category_id', categoryFilter); else params.delete('category_id');
    if (dateFrom) params.set('date_from', dateFrom); else params.delete('date_from');
    if (dateTo) params.set('date_to', dateTo); else params.delete('date_to');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchText, typeFilter, categoryFilter, dateFrom, dateTo, searchParams, pathname, router]);

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    router.push(pathname);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this transaction?')) return;
    startTransition(async () => {
      try {
        await cancelTransaction(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const buildExportUrl = () => {
    const params = new URLSearchParams();
    params.set('entity_type', entityType);
    if (entityType === 'villa') params.set('villa_id', entityId);
    if (filters.transaction_type) params.set('transaction_type', filters.transaction_type);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.search) params.set('search', filters.search);
    return `/api/accounting/export?${params.toString()}`;
  };

  const income = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + (t.amount_usd ?? t.amount), 0);
  const expense = transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + (t.amount_usd ?? t.amount), 0);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <AccountingSummaryBar income={income} expense={expense} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => { setEditingTransaction(null); setIsDialogOpen(true); }}
          className="bg-taksu-jungle hover:bg-taksu-forest text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>

        <Button variant="outline" onClick={() => setShowFilters(v => !v)}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        <a href={buildExportUrl()} download>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </a>

        <div className="ml-auto flex gap-2">
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="w-48"
          />
          <Button variant="outline" size="icon" onClick={applyFilters}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">All categories</option>
                <optgroup label="Income">
                  {incomeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={applyFilters} className="bg-taksu-jungle text-white">Apply</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">USD Equiv.</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No transactions found. Click "Add Transaction" to get started.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(tx.transaction_date).toLocaleDateString('en-US', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                      tx.transaction_type === 'income'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {tx.transaction_type === 'income'
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />
                      }
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${tx.category?.color || '#6B7280'}20`,
                        color: tx.category?.color || '#6B7280',
                      }}
                    >
                      {tx.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tx.title}
                    {tx.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{tx.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tx.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                    <span className={tx.transaction_type === 'income' ? 'text-green-700' : 'text-red-700'}>
                      {tx.transaction_type === 'income' ? '+' : '-'}
                      {fmt(tx.amount, tx.currency)} {tx.currency !== 'USD' && tx.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                    {tx.currency !== 'USD' ? fmt(tx.amount_usd ?? tx.amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingTransaction(tx); setIsDialogOpen(true); }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tx.id)}
                      className="h-8 w-8 p-0"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TransactionFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        transaction={editingTransaction}
        categories={categories}
        staffList={staffList}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
}
