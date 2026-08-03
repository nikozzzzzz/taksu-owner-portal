'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';
import { cn } from '@/lib/utils/cn';

interface RevenueTrendChartProps {
  data: AnalyticsData['dailyTrendData'];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const [activeLines, setActiveLines] = useState({
    grossRevenue: true,
    netRevenue: true,
    nightlyPrice: false,
    occupancy: false,
  });

  const toggleLine = (key: keyof typeof activeLines) => {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!data || data.length === 0) return null;

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg text-taksu-forest">Revenue Trend</CardTitle>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => toggleLine('grossRevenue')}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-colors",
              activeLines.grossRevenue ? "bg-taksu-sage/20 border-taksu-sage text-taksu-forest" : "bg-transparent border-border text-muted-foreground"
            )}
          >
            Gross Revenue
          </button>
          <button
            onClick={() => toggleLine('netRevenue')}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-colors",
              activeLines.netRevenue ? "bg-taksu-forest/20 border-taksu-forest text-taksu-forest font-medium" : "bg-transparent border-border text-muted-foreground"
            )}
          >
            Net Revenue
          </button>
          <button
            onClick={() => toggleLine('nightlyPrice')}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-colors",
              activeLines.nightlyPrice ? "bg-taksu-sand/30 border-taksu-sand text-[#B5A37A] font-medium" : "bg-transparent border-border text-muted-foreground"
            )}
          >
            Nightly Price
          </button>
          <button
            onClick={() => toggleLine('occupancy')}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-colors",
              activeLines.occupancy ? "bg-taksu-bamboo/20 border-taksu-bamboo text-[#D4C5A0] font-medium" : "bg-transparent border-border text-muted-foreground"
            )}
          >
            Occupancy
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
                dy={10}
                minTickGap={30}
              />
              
              {/* Left Y-Axis for Currency */}
              {(activeLines.grossRevenue || activeLines.netRevenue || activeLines.nightlyPrice) && (
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7B6B', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}k`;
                    return `Rp${value}`;
                  }}
                />
              )}

              {/* Right Y-Axis for Occupancy Percentage */}
              {activeLines.occupancy && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7B6B', fontSize: 12 }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                />
              )}

              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Occupancy') return [`${(value * 100).toFixed(1)}%`, name];
                  return [`Rp${value.toLocaleString()}`, name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />

              {activeLines.grossRevenue && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="gross_revenue_idr" 
                  name="Gross Revenue" 
                  stroke="#6B7B6B" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
              {activeLines.netRevenue && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="net_revenue_idr" 
                  name="Net Revenue" 
                  stroke="#2C3E2C" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
              {activeLines.nightlyPrice && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="adr_idr" 
                  name="Nightly Price" 
                  stroke="#B5A37A" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
              {activeLines.occupancy && (
                <Line 
                  yAxisId="right"
                  type="stepAfter" 
                  dataKey="occupancy" 
                  name="Occupancy" 
                  stroke="#D4C5A0" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
