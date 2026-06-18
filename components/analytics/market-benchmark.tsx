import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UBUD_MARKET_MEDIAN } from '@/lib/calculations/analytics-calc';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface MarketBenchmarkProps {
  data: AnalyticsData;
}

export function MarketBenchmark({ data }: MarketBenchmarkProps) {
  const getComparison = (villaValue: number, marketValue: number) => {
    if (!villaValue || !marketValue) return { diff: 0, status: 'equal' };
    const diff = (villaValue - marketValue) / marketValue;
    return {
      diff,
      status: diff > 0.05 ? 'above' : diff < -0.05 ? 'below' : 'equal'
    };
  };

  const metrics = [
    {
      label: 'RevPAR',
      villa: data.avg_revpar,
      market: UBUD_MARKET_MEDIAN.revpar_usd,
      formatter: formatCurrency,
      comparison: getComparison(data.avg_revpar, UBUD_MARKET_MEDIAN.revpar_usd),
    },
    {
      label: 'ADR',
      villa: data.avg_adr,
      market: UBUD_MARKET_MEDIAN.adr_usd,
      formatter: formatCurrency,
      comparison: getComparison(data.avg_adr, UBUD_MARKET_MEDIAN.adr_usd),
    },
    {
      label: 'Occupancy',
      villa: data.avg_occupancy,
      market: UBUD_MARKET_MEDIAN.occupancy,
      formatter: formatPercent,
      comparison: getComparison(data.avg_occupancy, UBUD_MARKET_MEDIAN.occupancy),
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'above': return <TrendingUp className="h-4 w-4 text-taksu-jungle" />;
      case 'below': return <TrendingDown className="h-4 w-4 text-taksu-terracotta" />;
      default: return <Minus className="h-4 w-4 text-taksu-sage" />;
    }
  };

  return (
    <Card className="col-span-full xl:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg text-taksu-forest">Ubud Market Benchmark</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mt-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-taksu-forest">{metric.label}</span>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(metric.comparison.status)}
                  <span className={`font-semibold ${
                    metric.comparison.status === 'above' ? 'text-taksu-jungle' : 
                    metric.comparison.status === 'below' ? 'text-taksu-terracotta' : 
                    'text-taksu-sage'
                  }`}>
                    {metric.comparison.diff > 0 ? '+' : ''}{formatPercent(metric.comparison.diff)}
                  </span>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-1 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-taksu-jungle/10 text-taksu-jungle">
                      Villa: {metric.formatter(metric.villa)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-taksu-sage">
                      Market: {metric.formatter(metric.market)}
                    </span>
                  </div>
                </div>
                {/* Visual bar comparing the two (relative to the max of both) */}
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-taksu-parchment">
                  <div 
                    style={{ width: `${Math.min(100, (metric.villa / Math.max(metric.villa, metric.market)) * 100)}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-taksu-jungle"
                  ></div>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-taksu-sage mt-4 pt-4 border-t border-border">
            * Market data reflects the median performance of comparable properties in Ubud over the selected period.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
