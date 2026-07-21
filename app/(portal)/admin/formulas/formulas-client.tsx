'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormulaFormDialog } from '@/components/admin/formula-form-dialog';
import { deleteYieldFormula } from '@/lib/actions/formula-actions';
import { toast } from 'sonner';

interface FormulasClientProps {
  initialFormulas: any[];
}

export function FormulasClient({ initialFormulas }: FormulasClientProps) {
  const [formulas, setFormulas] = useState(initialFormulas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (formula: any) => {
    setEditingFormula(formula);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this formula?')) return;
    
    setIsDeleting(id);
    try {
      await deleteYieldFormula(id);
      setFormulas((prev) => prev.filter((f) => f.id !== id));
      toast.success('Formula deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete formula');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatRules = (rules: any[]) => {
    if (!Array.isArray(rules)) return 'Invalid rules';
    return rules
      .map(r => {
        const methodLabel = r.method === 'equal_share' ? 'Equal Share' : 'Proportional';
        const metricLabel = r.metric && r.metric !== 'none'
          ? ` (${r.metric.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())})`
          : '';
        return `${methodLabel}${metricLabel}: ${r.weight}%`;
      })
      .join(' | ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingFormula(null);
            setDialogOpen(true);
          }}
          className="bg-taksu-forest text-white hover:bg-taksu-jungle"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Formula
        </Button>
      </div>

      <div className="rounded-lg border border-taksu-ink/10 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-taksu-bone/50">
            <TableRow>
              <TableHead className="w-[200px] text-taksu-forest">Name</TableHead>
              <TableHead className="text-taksu-forest">Description</TableHead>
              <TableHead className="text-taksu-forest">Distribution Rules</TableHead>
              <TableHead className="w-[100px] text-right text-taksu-forest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formulas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-taksu-ink/50">
                  No formulas found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              formulas.map((formula) => (
                <TableRow key={formula.id} className="hover:bg-taksu-bone/30">
                  <TableCell className="font-medium text-taksu-ink">
                    {formula.name}
                  </TableCell>
                  <TableCell className="text-taksu-ink/70">
                    {formula.description || '-'}
                  </TableCell>
                  <TableCell className="text-taksu-ink/80 text-sm">
                    {formatRules(formula.rules)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(formula)}
                        className="h-8 w-8 text-taksu-forest hover:bg-taksu-bone hover:text-taksu-jungle"
                      >
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(formula.id)}
                        disabled={isDeleting === formula.id}
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {dialogOpen && (
        <FormulaFormDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            window.location.reload();
          }}
          formula={editingFormula}
        />
      )}
    </div>
  );
}
