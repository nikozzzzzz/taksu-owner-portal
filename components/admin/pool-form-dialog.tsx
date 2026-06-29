'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface PoolFormDialogProps {
  pool?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (poolData: any) => Promise<void>;
}

export function PoolFormDialog({ pool, isOpen, onClose, onSave }: PoolFormDialogProps) {
  const isEditing = !!pool;
  
  const [formData, setFormData] = useState({
    id: pool?.id,
    name: pool?.name || '',
    description: pool?.description || '',
    villa_type: pool?.villa_type || 'mixed',
    active: pool?.active !== undefined ? pool.active : true,
    yield_formula: pool?.yield_formula || 'equal_share',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-taksu-forest">
            {isEditing ? 'Edit Pool' : 'Create New Pool'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          <div className="space-y-2">
            <Label htmlFor="name">Pool Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="villa_type">Villa Type</Label>
              <select 
                id="villa_type" 
                name="villa_type" 
                value={formData.villa_type} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm"
              >
                <option value="1br">1 Bedroom</option>
                <option value="2br">2 Bedroom</option>
                <option value="3br">3 Bedroom</option>
                <option value="1br_l">1 Bedroom (L)</option>
                <option value="1br_xl">1 Bedroom (XL)</option>
                <option value="2br_l">2 Bedroom (L)</option>
                <option value="2br_xl">2 Bedroom (XL)</option>
                <option value="4br">4 Bedroom</option>
                <option value="mixed">Mixed Types</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yield_formula">Yield Formula</Label>
              <select 
                id="yield_formula" 
                name="yield_formula" 
                value={formData.yield_formula} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm"
              >
                <option value="equal_share">Equal Share</option>
                <option value="revenue_weighted">Revenue Weighted</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="active" 
              checked={formData.active} 
              onCheckedChange={(checked) => handleSwitchChange('active', checked)} 
            />
            <Label htmlFor="active">Active Pool</Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-taksu-jungle hover:bg-taksu-forest text-white">
              {loading ? 'Saving...' : 'Save Pool'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
