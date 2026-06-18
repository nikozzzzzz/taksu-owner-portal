import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { TrendingUp, Activity, Percent } from 'lucide-react';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface KpiTilesProps {
  data: AnalyticsData;
}

export function KpiTiles({ data }: KpiTilesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-taksu-sage">Total Revenue</h3>
            <TrendingUp className="h-4 w-4 text-taksu-jungle" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-taksu-forest">
            {formatCurrency(data.total_revenue)}
          </div>
          <p className="text-xs text-taksu-sage mt-1">
            Net payout: <span className="font-semibold text-taksu-jungle">{formatCurrency(data.total_net_payout)}</span>
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-taksu-sage">Average RevPAR</h3>
            <Activity className="h-4 w-4 text-taksu-bamboo" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-taksu-forest">
            {formatCurrency(data.avg_revpar)}
          </div>
          <p className="text-xs text-taksu-sage mt-1">
            Avg ADR: <span className="font-medium text-taksu-forest">{formatCurrency(data.avg_adr)}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-taksu-sage">Average Occupancy</h3>
            <Percent className="h-4 w-4 text-taksu-terracotta" />
          </div>
          <div className="text-2xl font-bold tabular-nums text-taksu-forest">
            {formatPercent(data.avg_occupancy)}
          </div>
          <p className="text-xs text-taksu-sage mt-1">
            For selected period
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
