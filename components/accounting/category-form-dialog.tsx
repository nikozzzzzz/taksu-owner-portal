'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertCategory } from '@/lib/actions/accounting-actions';

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any | null;
}

const PRESET_COLORS = [
  '#10B981', '#059669', '#3B82F6', '#6366F1',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#8B5CF6', '#EC4899', '#06B6D4', '#64748B',
];

export function CategoryFormDialog({ isOpen, onClose, category }: CategoryFormDialogProps) {
  const isEditing = !!category;
  const [form, setForm] = useState({
    name: category?.name || '',
    type: category?.type || 'expense',
    description: category?.description || '',
    color: category?.color || '#6B7280',
    sort_order: category?.sort_order ? String(category.sort_order) : '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await upsertCategory({
        ...(isEditing ? { id: category.id } : {}),
        ...form,
        sort_order: Number(form.sort_order) || 0,
        type: form.type as 'income' | 'expense',
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-taksu-forest">
            {isEditing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {(['income', 'expense'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set('type', type)}
                className={`rounded-lg border-2 py-2 text-sm font-semibold capitalize transition-all ${
                  form.type === type
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

          <div>
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className="mt-1"
              placeholder="e.g. Electricity & Water"
            />
          </div>

          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Input
              id="cat-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="mt-1"
              placeholder="Optional description"
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('color', color)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border"
              />
              <span className="text-sm text-gray-500">{form.color}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="cat-order">Sort Order</Label>
            <Input
              id="cat-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => set('sort_order', e.target.value)}
              className="mt-1 w-24"
            />
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
