import { TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';

interface YtdSummaryProps {
  data: {
    gross_revenue: number;
    owner_net_payout: number;
    statements_count: number;
    total_pph26: number;
    avg_occupancy: number;
  };
}

export function YtdSummary({ data }: YtdSummaryProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-taksu-bamboo" />
          {currentYear} Year-to-Date
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Net payout */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-taksu-sage">Total Received</p>
            <p className="tabular-nums text-xl font-bold text-taksu-jungle">
              {formatCurrency(data.owner_net_payout)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-taksu-sage">Gross Revenue</p>
            <p className="tabular-nums text-sm font-semibold text-taksu-forest">
              {formatCurrency(data.gross_revenue)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-taksu-forest tabular-nums">
              {data.statements_count}
            </p>
            <p className="text-[10px] text-taksu-sage">Statements</p>
          </div>
          <div>
            <p className="text-lg font-bold text-taksu-forest tabular-nums">
              {formatPercent(data.avg_occupancy)}
            </p>
            <p className="text-[10px] text-taksu-sage">Avg Occ.</p>
          </div>
          <div>
            <p className="text-lg font-bold text-taksu-terracotta tabular-nums">
              {formatCurrency(data.total_pph26)}
            </p>
            <p className="text-[10px] text-taksu-sage">PPh 26 Tax</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
