'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/currency';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Clock, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { markBookingPayoutReceived } from '@/lib/actions/booking-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PayoutList({ payouts, villaId }: { payouts: any[], villaId: string }) {
  const [loading, setLoading] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [payoutDate, setPayoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    
    setLoading(true);
    try {
      await markBookingPayoutReceived(selectedPayout.id, payoutDate);
      setSelectedPayout(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to mark payout as received: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (payouts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-taksu-sage/50 mb-3" />
        <p className="text-gray-900 font-medium">All caught up!</p>
        <p className="text-sm text-gray-500 mt-1">No pending payouts for this villa.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-taksu-terracotta" />
            Pending Expected Payouts
          </h2>
          <span className="text-xs font-medium bg-taksu-cream text-taksu-terracotta px-2.5 py-1 rounded-full">
            {payouts.length} Bookings
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {payouts.map((booking: any) => (
            <div key={booking.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="uppercase text-[10px] font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {booking.channel}
                  </span>
                  <span className="font-medium text-gray-900 truncate">
                    {booking.guest_full_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(booking.check_in_date), 'MMM d')} - {format(parseISO(booking.check_out_date), 'MMM d, yyyy')}
                  </span>
                  <span>&bull;</span>
                  <span>{booking.nights} nights</span>
                </div>
              </div>
              <div className="flex items-center gap-6 sm:pl-4 sm:border-l border-gray-200">
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Expected Net</div>
                  <div className="font-semibold text-taksu-jungle tabular-nums">
                    {formatCurrency(booking.net_to_villa_usd)}
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedPayout(booking)}
                  variant="outline" 
                  className="shrink-0 group hover:border-taksu-jungle hover:text-taksu-jungle"
                >
                  Mark Received
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedPayout} onOpenChange={(open) => !open && setSelectedPayout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payout Receipt</DialogTitle>
            <DialogDescription>
              Marking this booking as received will automatically generate a paid Income Invoice in the accounting module.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <form onSubmit={handleConfirmPayout} className="space-y-6 pt-4">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Guest</span>
                  <span className="font-medium text-gray-900">{selectedPayout.guest_full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Channel</span>
                  <span className="font-medium uppercase text-gray-900">{selectedPayout.channel}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-500">Amount Received</span>
                  <span className="font-bold text-taksu-jungle">{formatCurrency(selectedPayout.net_to_villa_usd)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Received (in Bank)</Label>
                <Input 
                  type="date" 
                  required 
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSelectedPayout(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-taksu-jungle hover:bg-taksu-jungle/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm & Generate Invoice
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
