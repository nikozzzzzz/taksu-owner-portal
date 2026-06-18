import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDateRange } from '@/lib/utils/dates';
import type { Database } from '@/lib/supabase/types';

type BookingRow = Database['public']['Views']['v_bookings_anonymized']['Row'];

const CHANNEL_COLORS: Record<string, string> = {
  airbnb: 'bg-rose-100 text-rose-700',
  booking: 'bg-blue-100 text-blue-700',
  agoda: 'bg-red-100 text-red-700',
  expedia: 'bg-yellow-100 text-yellow-800',
  direct: 'bg-taksu-bamboo/20 text-taksu-jungle',
  other: 'bg-muted text-muted-foreground',
};

interface RecentBookingCardProps {
  bookings: BookingRow[];
}

export function RecentBookingCard({ bookings }: RecentBookingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-taksu-bamboo" />
          Recent Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-taksu-sage">No recent bookings.</p>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 py-3">
                {/* Guest avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-taksu-parchment text-xs font-semibold text-taksu-forest">
                  {booking.guest_initials ?? '??'}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-taksu-forest">
                      {booking.guest_initials}
                    </p>
                    {booking.guest_country && (
                      <span className="flex items-center gap-1 text-xs text-taksu-sage">
                        <MapPin className="h-3 w-3" />
                        {booking.guest_country}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-taksu-sage">
                    {formatDateRange(booking.check_in_date, booking.check_out_date)}
                    {' · '}
                    {booking.nights}n
                  </p>
                </div>

                {/* Channel + Revenue */}
                <div className="shrink-0 text-right">
                  <p className="tabular-nums text-sm font-semibold text-taksu-forest">
                    {formatCurrency(booking.net_to_villa_usd)}
                  </p>
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                      CHANNEL_COLORS[booking.channel] ?? CHANNEL_COLORS.other
                    }`}
                  >
                    {booking.channel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
