'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { setRoomPrice } from '@/lib/actions/booking-actions';
import { toast } from 'sonner';

interface PriceModalProps {
  villaId: string;
  selectedDates: Date[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function PriceModal({ villaId, selectedDates, open, onOpenChange, onSave }: PriceModalProps) {
  const [price, setPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Get the range
  const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
  const fromDate = sortedDates[0] ? format(sortedDates[0], 'yyyy-MM-dd') : '';
  const toDate = sortedDates[sortedDates.length - 1] ? format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd') : '';
  
  const displayRange = sortedDates.length === 1 
    ? format(sortedDates[0], 'MMM d, yyyy')
    : sortedDates.length > 1 
      ? `${format(sortedDates[0], 'MMM d')} - ${format(sortedDates[sortedDates.length - 1], 'MMM d, yyyy')}`
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || isNaN(Number(price))) return;
    
    setLoading(true);
    try {
      const result = await setRoomPrice(villaId, fromDate, toDate, Number(price));
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast.success('Price Updated', {
        description: `Successfully set nightly price to $${price} for ${displayRange}.`
      });
      onOpenChange(false);
      setPrice('');
      if (onSave) onSave();
    } catch (err: any) {
      toast.error('Failed to set price', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Set Nightly Price</DialogTitle>
          <DialogDescription>
            Update the price for {displayRange}. This will sync to Beds24 (Price Row 1).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nightly Price (USD)</Label>
            <Input 
              type="number" 
              required
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 150"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-taksu-terracotta hover:bg-taksu-terracotta/90 text-white" disabled={loading}>
              {loading ? 'Saving...' : 'Set Price'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
