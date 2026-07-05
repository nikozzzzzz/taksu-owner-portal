'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createYieldFormula, updateYieldFormula } from '@/lib/actions/formula-actions';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const ruleSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  percentage: z.coerce.number().min(0, 'Must be >= 0').max(100, 'Must be <= 100'),
});

const formulaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  rules: z.array(ruleSchema).min(1, 'At least one rule is required'),
});

type FormulaFormValues = z.infer<typeof formulaSchema>;

interface FormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula?: any | null; // If null, create mode
}

const DEFAULT_TARGETS = [
  { value: 'owner', label: 'Owner' },
  { value: 'management_company', label: 'Management Company' },
  { value: 'sinking_fund', label: 'Sinking Fund' },
  { value: 'marketing_fund', label: 'Marketing Fund' },
];

export function FormulaDialog({ open, onOpenChange, formula }: FormulaDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormulaFormValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: formula?.name || '',
      description: formula?.description || '',
      rules: formula?.rules || [{ target: 'owner', percentage: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: 'rules',
    control: form.control,
  });

  async function onSubmit(data: FormulaFormValues) {
    // Validate that percentages add up to 100%
    const totalPercentage = data.rules.reduce((acc, rule) => acc + rule.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error('The total percentage must equal exactly 100%.');
      return;
    }

    setIsPending(true);
    try {
      if (formula) {
        await updateYieldFormula(formula.id, data);
        toast.success('Formula updated successfully');
      } else {
        await createYieldFormula(data);
        toast.success('Formula created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-taksu-bone text-taksu-ink sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-taksu-forest">
            {formula ? 'Edit Yield Formula' : 'New Yield Formula'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Formula Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g., Standard 80/20 Split"
              className="border-taksu-ink/20 bg-white"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Explain how this formula works..."
              className="border-taksu-ink/20 bg-white"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Distribution Rules *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ target: 'owner', percentage: 0 })}
                className="h-8 border-taksu-ink/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <Select
                      value={form.watch(`rules.${index}.target`)}
                      onValueChange={(val) => form.setValue(`rules.${index}.target`, val)}
                    >
                      <SelectTrigger className="border-taksu-ink/20 bg-white">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_TARGETS.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-24 space-y-1">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`rules.${index}.percentage` as const)}
                        className="border-taksu-ink/20 bg-white pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-taksu-ink/50">%</span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {form.formState.errors.rules && (
              <p className="text-sm text-red-600">{form.formState.errors.rules.message}</p>
            )}
            
            <div className="rounded-md bg-white p-3 text-sm border border-taksu-ink/10 flex justify-between">
              <span className="text-taksu-ink/70">Total Distribution:</span>
              <span className={`font-bold ${form.watch('rules').reduce((a, b) => a + (Number(b.percentage) || 0), 0) === 100 ? 'text-taksu-forest' : 'text-red-600'}`}>
                {form.watch('rules').reduce((a, b) => a + (Number(b.percentage) || 0), 0)}%
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="border-taksu-ink/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-taksu-forest text-white hover:bg-taksu-jungle"
            >
              {isPending ? 'Saving...' : formula ? 'Save Changes' : 'Create Formula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
