'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface RevenueTrendChartProps {
  data: AnalyticsData['dailyTrendData'];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg text-taksu-forest">Revenue Trend</CardTitle>
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
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `Rp${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `Rp${(value / 1000).toFixed(0)}k`;
                  }
                  return `Rp${value}`;
                }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value: number) => [`Rp${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
