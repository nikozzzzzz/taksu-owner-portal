'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { FormulaFormDialog } from './formula-form-dialog';
import { deleteFormula } from '@/lib/actions/formula-actions';

export function FormulaList({ initialFormulas }: { initialFormulas: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<any | null>(null);

  const handleEdit = (formula: any) => {
    setSelectedFormula(formula);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedFormula(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this formula?')) return;
    try {
      await deleteFormula(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="bg-taksu-jungle hover:bg-taksu-forest text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Formula
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Rules count</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialFormulas.map((formula) => (
                <tr key={formula.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{formula.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-md truncate">{formula.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {Array.isArray(formula.rules) ? formula.rules.length : 0} Rules
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(formula)}>
                        <Edit2 className="h-4 w-4 text-taksu-jungle" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(formula.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialFormulas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No formulas found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <FormulaFormDialog
          formula={selectedFormula}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
