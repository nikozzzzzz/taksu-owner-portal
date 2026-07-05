'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarBooking } from '@/lib/data/calendar';
import { format, parseISO, addDays } from 'date-fns';
import { CHANNEL_COLORS } from './channel-legend';
import { createBooking, updateBooking, cancelBooking } from '@/lib/actions/booking-actions';
import { Loader2 } from 'lucide-react';

interface BookingModalProps {
  villaId: string;
  booking: CalendarBooking | null;
  selectedDate: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function BookingModal({ villaId, booking, selectedDate, open, onOpenChange, onSave }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    check_in_date: '',
    check_out_date: '',
    guest_full_name: '',
    guest_country: '',
    net_to_villa_usd: 0,
    channel: 'direct'
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        guest_full_name: (booking as any).guest_full_name || booking.guest_full_name,
        guest_country: booking.guest_country || '',
        net_to_villa_usd: booking.net_to_villa_usd,
        channel: booking.channel
      });
    } else if (selectedDate) {
      setFormData({
        check_in_date: format(selectedDate, 'yyyy-MM-dd'),
        check_out_date: format(addDays(selectedDate, 1), 'yyyy-MM-dd'),
        guest_full_name: '',
        guest_country: '',
        net_to_villa_usd: 0,
        channel: 'direct'
      });
    }
  }, [booking, selectedDate, open]);

  if (!open) return null;

  const isBlock = formData.channel === 'maintenance' || formData.channel === 'owner_stay';
  const isEditing = !!booking;
  const colors = CHANNEL_COLORS[formData.channel.toLowerCase()] || CHANNEL_COLORS.other;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await updateBooking(booking.id, villaId, formData);
      } else {
        await createBooking(villaId, formData);
      }
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await cancelBooking(booking!.id, villaId);
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            {isEditing ? 'Edit Booking' : 'New Reservation'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify or cancel this reservation.' : 'Create a new direct booking or block dates.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check In</Label>
              <Input 
                type="date" 
                required
                value={formData.check_in_date}
                onChange={e => setFormData({...formData, check_in_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Check Out</Label>
              <Input 
                type="date" 
                required
                value={formData.check_out_date}
                onChange={e => setFormData({...formData, check_out_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-select">Type / Channel</Label>
            <Select 
              value={formData.channel} 
              onValueChange={v => setFormData({...formData, channel: v, guest_full_name: v === 'maintenance' || v === 'owner_stay' ? 'BLOCK' : formData.guest_full_name})}
            >
              <SelectTrigger id="channel-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct Booking</SelectItem>
                <SelectItem value="airbnb">Airbnb (Sync)</SelectItem>
                <SelectItem value="booking.com">Booking.com (Sync)</SelectItem>
                <SelectItem value="owner_stay">Owner Stay (Block)</SelectItem>
                <SelectItem value="maintenance">Maintenance (Block)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isBlock && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guest Full Name</Label>
                  <Input 
                    required
                    value={formData.guest_full_name}
                    onChange={e => setFormData({...formData, guest_full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Guest Country</Label>
                  <Input 
                    value={formData.guest_country}
                    onChange={e => setFormData({...formData, guest_country: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Net Revenue (USD)</Label>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.net_to_villa_usd}
                  onChange={e => setFormData({...formData, net_to_villa_usd: parseFloat(e.target.value) || 0})}
                />
              </div>
            </>
          )}

          {isBlock && (
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input 
                placeholder="Reason for block..."
                value={formData.guest_country} // Storing notes in country field for blocks for simplicity
                onChange={e => setFormData({...formData, guest_country: e.target.value})}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            {isEditing ? (
              <Button type="button" variant="destructive" onClick={handleCancel} disabled={loading}>
                Cancel Booking
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Close
              </Button>
              <Button type="submit" className="bg-taksu-terracotta hover:bg-taksu-terracotta/90" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
