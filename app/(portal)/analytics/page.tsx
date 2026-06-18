import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { getAnalyticsData } from '@/lib/data/analytics';
import { calculateAnalytics } from '@/lib/calculations/analytics-calc';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { KpiTiles } from '@/components/analytics/kpi-tiles';
import { RevenueTrendChart } from '@/components/analytics/revenue-trend-chart';
import { ChannelMix } from '@/components/analytics/channel-mix';
import { MarketBenchmark } from '@/components/analytics/market-benchmark';
import { SeasonalityView } from '@/components/analytics/seasonality-view';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Performance analytics for your property',
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const resolvedParams = await searchParams;
  const owner = await requireOwner();
  const period = resolvedParams.period || '12m';

  const statements = await getAnalyticsData(owner.id, period);
  const analyticsData = calculateAnalytics(statements);

  const currentYear = new Date().getFullYear();

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="portal-page-title flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-taksu-bamboo" />
            Performance Analytics
          </h1>
          <p className="portal-page-subtitle">
            Track your revenue, occupancy, and market position.
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-white rounded-md p-1 border border-border shadow-sm w-fit">
          <Link
            href="/analytics?period=12m"
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              period === '12m' 
                ? 'bg-taksu-parchment text-taksu-forest' 
                : 'text-taksu-sage hover:text-taksu-forest'
            }`}
          >
            Last 12 Months
          </Link>
          <Link
            href="/analytics?period=ytd"
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              period === 'ytd' 
                ? 'bg-taksu-parchment text-taksu-forest' 
                : 'text-taksu-sage hover:text-taksu-forest'
            }`}
          >
            YTD
          </Link>
          <Link
            href={`/analytics?period=${currentYear - 1}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              period === String(currentYear - 1)
                ? 'bg-taksu-parchment text-taksu-forest' 
                : 'text-taksu-sage hover:text-taksu-forest'
            }`}
          >
            {currentYear - 1}
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <KpiTiles data={analyticsData} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RevenueTrendChart data={analyticsData.trendData} />
          <ChannelMix data={analyticsData.channelMix} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MarketBenchmark data={analyticsData} />
          <SeasonalityView data={analyticsData.trendData} />
        </div>
      </div>
    </div>
  );
}
