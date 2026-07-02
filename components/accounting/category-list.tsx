'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Circle } from 'lucide-react';
import { deleteCategory } from '@/lib/actions/accounting-actions';
import { CategoryFormDialog } from './category-form-dialog';

interface CategoryListProps {
  categories: any[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm('Delete this category? It cannot be deleted if transactions exist.')) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const renderTable = (cats: any[], title: string, color: string) => (
    <div>
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${color}`}>{title}</h3>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
            <tr>
              <th className="px-4 py-3 text-left">Color</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No categories yet.</td>
              </tr>
            ) : (
              cats.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: cat.color || '#6B7280' }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { setEditingCategory(cat); setIsDialogOpen(true); }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleDelete(cat.id)}
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Transaction Categories</h2>
          <p className="text-sm text-gray-500">Manage income and expense categories.</p>
        </div>
        <Button
          onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}
          className="bg-taksu-jungle hover:bg-taksu-forest text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {renderTable(incomeCategories, 'Income Categories', 'text-green-600')}
      {renderTable(expenseCategories, 'Expense Categories', 'text-red-600')}

      <CategoryFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        category={editingCategory}
      />
    </div>
  );
}
