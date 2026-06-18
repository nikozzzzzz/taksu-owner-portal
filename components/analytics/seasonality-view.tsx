'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, YAxis } from 'recharts';
import type { AnalyticsData } from '@/lib/calculations/analytics-calc';

interface SeasonalityViewProps {
  data: AnalyticsData['trendData'];
}

export function SeasonalityView({ data }: SeasonalityViewProps) {
  if (!data || data.length === 0) return null;

  // Use occupancy rate for seasonality heat
  return (
    <Card className="col-span-full xl:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg text-taksu-forest">Occupancy Seasonality</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                tick={{ fill: '#6B7B6B', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: '#F2EDE0' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Occupancy']}
              />
              <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => {
                  // Color intensity based on occupancy level
                  let fill = '#D4C5A0'; // Low: taksu-sand
                  if (entry.occupancy > 0.6) fill = '#6B7B6B'; // Medium: taksu-sage
                  if (entry.occupancy > 0.8) fill = '#2C3E2C'; // High: taksu-forest
                  
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
