import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatDateShort } from '@/lib/utils/dates';

interface CurrentMonthCardProps {
  data: {
    period: string;
    occupancy_rate: number;
    gross_revenue: number;
    owner_net_payout: number;
    payout_scheduled_at: string | null;
    bookings_count: number;
    occupied_nights: number;
    adr_usd: number | null;
    revpar_usd: number | null;
  } | null;
}

export function CurrentMonthCard({ data }: CurrentMonthCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-taksu-sage">No statement available yet for last month.</p>
        </CardContent>
      </Card>
    );
  }

  const occupancyPct = data.occupancy_rate * 100;
  const periodDate = new Date(data.period);
  const monthName = periodDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{monthName}</CardTitle>
          <span className="rounded-full bg-taksu-parchment px-3 py-1 text-xs font-medium text-taksu-sage">
            Last Month
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Owner net payout */}
          <div className="space-y-1">
            <p className="text-xs text-taksu-sage">Your Payout</p>
            <p className="tabular-nums text-2xl font-bold text-taksu-jungle">
              {formatCurrency(data.owner_net_payout)}
            </p>
            {data.payout_scheduled_at && (
              <p className="text-xs text-taksu-sage">
                <Calendar className="mr-1 inline h-3 w-3" />
                Due {formatDateShort(data.payout_scheduled_at)}
              </p>
            )}
          </div>

          {/* Occupancy */}
          <div className="space-y-1">
            <p className="text-xs text-taksu-sage">Occupancy</p>
            <p className="tabular-nums text-2xl font-bold text-taksu-forest">
              {formatPercent(data.occupancy_rate)}
            </p>
            <p className="text-xs text-taksu-sage">{data.occupied_nights} nights booked</p>
          </div>

          {/* ADR */}
          <div className="space-y-1">
            <p className="text-xs text-taksu-sage">ADR</p>
            <p className="tabular-nums text-2xl font-bold text-taksu-forest">
              {data.adr_usd ? formatCurrency(data.adr_usd) : '—'}
            </p>
            <p className="text-xs text-taksu-sage">avg. daily rate</p>
          </div>

          {/* RevPAR */}
          <div className="space-y-1">
            <p className="text-xs text-taksu-sage">RevPAR</p>
            <p className="tabular-nums text-2xl font-bold text-taksu-forest">
              {data.revpar_usd ? formatCurrency(data.revpar_usd) : '—'}
            </p>
            <p className="text-xs text-taksu-sage">{data.bookings_count} bookings</p>
          </div>
        </div>

        {/* Revenue bar */}
        <div className="mt-4 rounded-lg bg-taksu-parchment p-3">
          <div className="flex items-center justify-between text-xs text-taksu-sage">
            <span>Gross Revenue</span>
            <span className="tabular-nums font-semibold text-taksu-forest">
              {formatCurrency(data.gross_revenue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
