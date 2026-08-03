import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { getAnalyticsData } from '@/lib/data/analytics';
import { calculateAnalytics } from '@/lib/calculations/analytics-calc';
import { BarChart3, Filter } from 'lucide-react';
import Link from 'next/link';
import { KpiTiles } from '@/components/analytics/kpi-tiles';
import { RevenueTrendChart } from '@/components/analytics/revenue-trend-chart';
import { ChannelMix } from '@/components/analytics/channel-mix';
import { MarketBenchmark } from '@/components/analytics/market-benchmark';
import { SeasonalityView } from '@/components/analytics/seasonality-view';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { VillaSelector } from '@/components/calendar/villa-selector';
import { CustomPeriodModal } from '@/components/analytics/custom-period-modal';
import { getExchangeRates } from '@/lib/utils/exchange-rate';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Performance analytics for your property',
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; villaId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const owner = await requireOwner();
  const period = resolvedParams.period || '12m';

  const supabase = await createServerSupabaseClient();
  
  let query = supabase.from('villas').select('id, display_name, internal_code').in('status', ['active', 'paused', 'pre_launch']);
  if (owner.role !== 'admin' && owner.role !== 'root') {
    query = query.eq('owner_id', owner.id);
  }
  
  const { data: villas } = await query.order('internal_code', { ascending: true });
  const allowedVillas = (villas as any[]) || [];

  let selectedVillaId = resolvedParams.villaId;
  
  const villaOptions = [
    { id: 'all', display_name: 'All Properties', internal_code: '*' },
    ...allowedVillas
  ];

  if (!selectedVillaId || !villaOptions.find(v => v.id === selectedVillaId)) {
    selectedVillaId = 'all';
  }

  const data = await getAnalyticsData(owner.id, owner.role, period, selectedVillaId);
  const rates = await getExchangeRates();
  const idrRate = rates.IDR || 15500;
  const analyticsData = calculateAnalytics(data, idrRate);

  const currentYear = new Date().getFullYear();

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="portal-page-title flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-taksu-bamboo" />
            Performance Analytics
          </h1>
          <p className="portal-page-subtitle">
            Track your revenue, occupancy, and market position.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Property Selector */}
          {allowedVillas.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-border shadow-sm h-[38px]">
              <Filter className="h-4 w-4 text-gray-400" />
              <VillaSelector villas={villaOptions} selectedId={selectedVillaId} />
            </div>
          )}

          {/* Period Selector */}
          <div className="flex bg-white rounded-md p-1 border border-border shadow-sm w-fit h-[38px]">
            <Link
              href={`/analytics?period=12m${selectedVillaId !== 'all' ? `&villaId=${selectedVillaId}` : ''}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              period === '12m' 
                ? 'bg-taksu-parchment text-taksu-forest' 
                : 'text-taksu-sage hover:text-taksu-forest'
            }`}
          >
            Last 12 Months
          </Link>
            <Link
              href={`/analytics?period=ytd${selectedVillaId !== 'all' ? `&villaId=${selectedVillaId}` : ''}`}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                period === 'ytd' 
                  ? 'bg-taksu-parchment text-taksu-forest' 
                  : 'text-taksu-sage hover:text-taksu-forest'
              }`}
            >
              YTD
            </Link>
            <Link
              href={`/analytics?period=${currentYear - 1}${selectedVillaId !== 'all' ? `&villaId=${selectedVillaId}` : ''}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
              period === String(currentYear - 1)
                ? 'bg-taksu-parchment text-taksu-forest' 
                : 'text-taksu-sage hover:text-taksu-forest'
            }`}
            >
              {currentYear - 1}
            </Link>
            <CustomPeriodModal currentPeriod={period} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <KpiTiles data={analyticsData} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RevenueTrendChart data={analyticsData.dailyTrendData} />
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
