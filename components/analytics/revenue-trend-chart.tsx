'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface RevenueTrendChartProps {
  data: AnalyticsData['trendData'];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg text-taksu-forest">Revenue & Payout Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="gross_revenue" 
                name="Gross Revenue" 
                stroke="#6B7B6B" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#6B7B6B', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="net_payout" 
                name="Net Payout" 
                stroke="#2C3E2C" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#2C3E2C', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
