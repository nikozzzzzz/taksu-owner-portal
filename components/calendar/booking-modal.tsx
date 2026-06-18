'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/currency';
import { CalendarBooking } from '@/lib/data/calendar';
import { Calendar, Globe, User, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CHANNEL_COLORS } from './channel-legend';

interface BookingModalProps {
  booking: CalendarBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ booking, open, onOpenChange }: BookingModalProps) {
  if (!booking) return null;

  const colors = CHANNEL_COLORS[booking.channel.toLowerCase()] || CHANNEL_COLORS.other;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${colors.bg} ${colors.text} ${colors.border} border`}>
              {booking.channel}
            </span>
            Booking Details
          </DialogTitle>
          <DialogDescription>
            Anonymized guest details and reservation financial summary.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-taksu-cream p-3">
              <Calendar className="h-5 w-5 text-taksu-sage mt-0.5" />
              <div>
                <p className="text-xs text-taksu-sage font-medium uppercase tracking-wider">Check In</p>
                <p className="font-medium text-taksu-forest">{format(parseISO(booking.check_in_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-taksu-cream p-3">
              <Calendar className="h-5 w-5 text-taksu-sage mt-0.5" />
              <div>
                <p className="text-xs text-taksu-sage font-medium uppercase tracking-wider">Check Out</p>
                <p className="font-medium text-taksu-forest">{format(parseISO(booking.check_out_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-taksu-sage">
                <User className="h-4 w-4" />
                <span>Guest Initials</span>
              </div>
              <span className="font-medium text-taksu-forest">{booking.guest_initials}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2 text-taksu-sage">
                <Globe className="h-4 w-4" />
                <span>Guest Country</span>
              </div>
              <span className="font-medium text-taksu-forest">{booking.guest_country || 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-taksu-sage">
                <TrendingUp className="h-4 w-4" />
                <span>Net Revenue (to Villa)</span>
              </div>
              <span className="font-bold tabular-nums text-taksu-jungle">
                {formatCurrency(booking.net_to_villa_usd)}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-center text-taksu-sage italic">
            * Complete guest details are hidden in accordance with privacy regulations for investor view.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
