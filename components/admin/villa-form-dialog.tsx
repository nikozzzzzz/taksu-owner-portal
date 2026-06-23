'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface VillaFormDialogProps {
  villa: any | null;
  isOpen: boolean;
  owners: any[];
  pools: any[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function VillaFormDialog({ villa, isOpen, owners, pools, onClose, onSave }: VillaFormDialogProps) {
  const isEditing = !!villa;
  
  const [formData, setFormData] = useState({
    id: villa?.id,
    internal_code: villa?.internal_code || '',
    display_name: villa?.display_name || '',
    villa_type: villa?.villa_type || 'standard',
    bedrooms: villa?.bedrooms || 1,
    bathrooms: villa?.bathrooms || 1,
    max_guests: villa?.max_guests || 2,
    has_private_pool: villa?.has_private_pool || false,
    view_type: villa?.view_type || '',
    phase: villa?.phase || 1,
    ownership_type: villa?.ownership_type || 'investor_owned',
    owner_id: villa?.owner_id || '',
    pool_id: villa?.pool_id || '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Clean up empty strings to null for UUIDs
    const payload = {
      ...formData,
      owner_id: formData.owner_id || null,
      pool_id: formData.pool_id || null,
    };
    
    await onSave(payload);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                (type === 'number' ? Number(value) : value);
                
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Villa' : 'Create New Villa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="internal_code">Internal Code</Label>
              <input
                required
                id="internal_code"
                name="internal_code"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.internal_code}
                onChange={handleChange}
                placeholder="e.g. TL-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <input
                required
                id="display_name"
                name="display_name"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.display_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_id">Owner</Label>
              <select
                id="owner_id"
                name="owner_id"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.owner_id}
                onChange={handleChange}
              >
                <option value="">-- Unassigned --</option>
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.full_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pool_id">Pool</Label>
              <select
                id="pool_id"
                name="pool_id"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.pool_id}
                onChange={handleChange}
              >
                <option value="">-- No Pool --</option>
                {pools.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <input
                type="number"
                min="1"
                id="bedrooms"
                name="bedrooms"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.bedrooms}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <input
                type="number"
                min="1"
                id="bathrooms"
                name="bathrooms"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.bathrooms}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Max Guests</Label>
              <input
                type="number"
                min="1"
                id="max_guests"
                name="max_guests"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.max_guests}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Phase</Label>
              <select
                id="phase"
                name="phase"
                className="flex h-10 w-full rounded-md border border-taksu-bamboo bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-taksu-jungle"
                value={formData.phase}
                onChange={handleChange}
              >
                <option value={1}>Phase 1</option>
                <option value={2}>Phase 2</option>
                <option value={3}>Phase 3</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Villa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
