'use client';

import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';

interface PoolDailyChartProps {
  data: any[];
  villas: any[];
}

export function PoolDailyChart({ data, villas }: PoolDailyChartProps) {
  // Extract overall KPI metrics
  const totalRevenue = data.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
  const totalExpenses = data.reduce((acc, curr) => acc + (curr.total_expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Format currency
  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Pool Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-taksu-jungle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-taksu-jungle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-taksu-forest">{formatUSD(netProfit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-taksu-forest">Daily Financials Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => formatUSD(value)}
                  labelStyle={{ color: '#1a362d', fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="net_profit" name="Net Profit" stroke="#047857" strokeWidth={3} dot={{r: 4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Villa Revenue Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl text-taksu-forest">Revenue by Villa (Daily Breakdown)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} />
                <YAxis tickFormatter={(value) => `$${value}`} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => formatUSD(value)}
                  labelStyle={{ color: '#1a362d', fontWeight: 'bold' }}
                />
                <Legend />
                {villas.map((villa, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                  return (
                    <Bar 
                      key={villa.id} 
                      dataKey={`revenue_${villa.internal_code}`} 
                      name={villa.display_name} 
                      stackId="a" 
                      fill={colors[index % colors.length]} 
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
