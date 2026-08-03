'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MARKET_BENCHMARKS } from '@/lib/calculations/analytics-calc';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface MarketBenchmarkProps {
  data: AnalyticsData;
}

export function MarketBenchmark({ data }: MarketBenchmarkProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('ubud');
  const marketData = MARKET_BENCHMARKS[selectedRegion] || MARKET_BENCHMARKS['ubud'];

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
      market: marketData.revpar_usd,
      formatter: formatCurrency,
      comparison: getComparison(data.avg_revpar, marketData.revpar_usd),
    },
    {
      label: 'ADR',
      villa: data.avg_adr,
      market: marketData.adr_usd,
      formatter: formatCurrency,
      comparison: getComparison(data.avg_adr, marketData.adr_usd),
    },
    {
      label: 'Occupancy',
      villa: data.avg_occupancy,
      market: marketData.occupancy,
      formatter: formatPercent,
      comparison: getComparison(data.avg_occupancy, marketData.occupancy),
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg text-taksu-forest">Market Benchmark</CardTitle>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="text-sm bg-white border border-border rounded-md px-2 py-1 outline-none focus:border-taksu-sage text-taksu-forest shadow-sm"
        >
          {Object.entries(MARKET_BENCHMARKS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.name}
            </option>
          ))}
        </select>
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
            * Market data reflects the median performance of comparable properties in {marketData.name} over the selected period. Note: This data is currently hardcoded for demonstration purposes and will be integrated with live market data sources in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
