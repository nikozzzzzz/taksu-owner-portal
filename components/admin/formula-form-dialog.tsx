'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { upsertFormula } from '@/lib/actions/formula-actions';

interface FormulaFormDialogProps {
  formula?: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaFormDialog({ formula, isOpen, onClose }: FormulaFormDialogProps) {
  const isEditing = !!formula;
  
  const [formData, setFormData] = useState({
    id: formula?.id,
    name: formula?.name || '',
    description: formula?.description || '',
    rules: Array.isArray(formula?.rules) ? formula.rules : []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [
        ...prev.rules,
        { weight: 100, method: 'equal_share', metric: 'none' }
      ]
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => {
      const newRules = [...prev.rules];
      newRules.splice(index, 1);
      return { ...prev, rules: newRules };
    });
  };

  const updateRule = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newRules = [...prev.rules];
      newRules[index] = { ...newRules[index], [field]: value };
      
      // Clear metric if method is equal_share
      if (field === 'method' && value === 'equal_share') {
        newRules[index].metric = 'none';
      }
      
      return { ...prev, rules: newRules };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate weights total 100
    const totalWeight = formData.rules.reduce((sum: number, r: any) => sum + Number(r.weight || 0), 0);
    if (formData.rules.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
      setError(`Total weight must be exactly 100%. Current: ${totalWeight}%`);
      setLoading(false);
      return;
    }

    if (formData.rules.length === 0) {
      setError('Please add at least one distribution rule.');
      setLoading(false);
      return;
    }

    try {
      await upsertFormula(formData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-taksu-forest">
            {isEditing ? 'Edit Yield Formula' : 'Create Yield Formula'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Formula Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                required 
                placeholder="e.g. 50/50 Revenue & Equal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData(p => ({...p, description: e.target.value}))} 
                placeholder="Explain how this formula works..."
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg text-taksu-forest font-semibold">Distribution Rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRule}>
                <Plus className="mr-2 h-4 w-4" /> Add Rule
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Rules determine how the pool's net profit is split. The total weight of all rules must equal 100%.
            </p>

            {formData.rules.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
                No rules defined. Click "Add Rule" to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.rules.map((rule: any, idx: number) => (
                  <div key={idx} className="relative rounded-lg border bg-gray-50 p-4 shadow-sm flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-12 gap-4">
                      
                      {/* Weight */}
                      <div className="col-span-12 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Weight (%)</Label>
                        <Input 
                          type="number" 
                          min="0" max="100" step="1"
                          value={rule.weight} 
                          onChange={e => updateRule(idx, 'weight', e.target.value)}
                          required
                        />
                      </div>
                      
                      {/* Method */}
                      <div className="col-span-12 sm:col-span-4 space-y-1">
                        <Label className="text-xs">Method</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          value={rule.method}
                          onChange={e => updateRule(idx, 'method', e.target.value)}
                        >
                          <option value="equal_share">Equal Share</option>
                          <option value="proportional">Proportional</option>
                          {/* We can add fixed_percentages later if needed */}
                        </select>
                      </div>

                      {/* Metric (Only for proportional) */}
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Label className="text-xs">Metric</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm disabled:opacity-50"
                          value={rule.metric || 'none'}
                          onChange={e => updateRule(idx, 'metric', e.target.value)}
                          disabled={rule.method !== 'proportional'}
                        >
                          <option value="none" disabled={rule.method === 'proportional'}>Not Applicable</option>
                          <option value="revenue">Gross Revenue</option>
                          <option value="square_meters">Square Meters</option>
                        </select>
                      </div>

                    </div>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                      onClick={() => removeRule(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-taksu-jungle hover:bg-taksu-forest text-white">
              {loading ? 'Saving...' : 'Save Formula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
