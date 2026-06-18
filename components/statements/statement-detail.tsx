'use client';

import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Percent } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCategory } from './expense-category';
import { StatementDownloadButtons } from './statement-download-buttons';
import type { Database } from '@/lib/supabase/types';

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'] & {
  villas?: {
    display_name: string;
    internal_code: string;
    max_guests: number;
    bedrooms: number;
  } | null;
};
type ExpenseRow = Database['public']['Tables']['operating_expenses']['Row'];

interface StatementDetailProps {
  statement: StatementRow;
  expenses: ExpenseRow[];
}

export function StatementDetail({ statement, expenses }: StatementDetailProps) {
  const date = new Date(statement.billing_month);
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = [];
    acc[exp.category].push(exp);
    return acc;
  }, {} as Record<string, ExpenseRow[]>);

  // Use the opex_breakdown from the statement if available, otherwise calculate from expenses
  const breakdown = statement.opex_breakdown as Record<string, { amount: number, items: number }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-6">
        <div>
          <Link href="/statements" className="inline-flex items-center text-sm text-taksu-sage hover:text-taksu-forest mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Statements
          </Link>
          <h1 className="font-serif text-3xl font-semibold text-taksu-forest">{monthName}</h1>
          <p className="text-taksu-sage mt-1">
            {statement.villas?.display_name} • {statement.villas?.internal_code}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm text-taksu-sage text-right">Owner Net Payout</p>
          <p className="text-3xl font-bold tabular-nums text-taksu-jungle">
            {formatCurrency(statement.owner_net_payout_usd)}
          </p>
          <div className="rounded-full bg-taksu-jungle/10 px-3 py-1 text-xs font-medium text-taksu-jungle">
            Status: <span className="uppercase">{statement.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <StatementDownloadButtons 
        statementId={statement.id} 
        monthName={monthName}
        hasBuktiPotong={!!statement.bukti_potong_pdf_url}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Revenue & Calculations */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 bg-taksu-cream rounded-t-xl border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-taksu-bamboo" />
                Revenue Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-taksu-sage">Gross Booking Revenue</span>
                <span className="font-medium tabular-nums text-taksu-forest">{formatCurrency(statement.gross_revenue_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-taksu-terracotta">
                <span>Less: Channel Commissions</span>
                <span className="tabular-nums">- {formatCurrency(statement.channel_commission_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-taksu-terracotta pb-2 border-b border-border/50">
                <span>Less: PHR Tax (10%)</span>
                <span className="tabular-nums">- {formatCurrency(statement.phr_tax_usd)}</span>
              </div>
              <div className="flex justify-between items-center font-semibold pt-2">
                <span className="text-taksu-forest">Net Villa Revenue</span>
                <span className="tabular-nums text-taksu-forest">{formatCurrency(statement.net_revenue_usd)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 bg-taksu-cream rounded-t-xl border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-taksu-bamboo" />
                Profit & Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-taksu-sage">Net Villa Revenue</span>
                <span className="font-medium tabular-nums text-taksu-forest">{formatCurrency(statement.net_revenue_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-taksu-terracotta pb-2 border-b border-border/50">
                <span>Less: Operating Expenses</span>
                <span className="tabular-nums">- {formatCurrency(statement.total_opex_usd)}</span>
              </div>
              <div className="flex justify-between items-center font-medium pt-2 pb-2">
                <span className="text-taksu-forest">Net Operating Profit</span>
                <span className="tabular-nums text-taksu-forest">{formatCurrency(statement.net_profit_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-taksu-terracotta pb-2 border-b border-border/50">
                <span>Less: Management Fee ({formatPercent(statement.management_fee_rate)})</span>
                <span className="tabular-nums">- {formatCurrency(statement.management_fee_usd)}</span>
              </div>
              <div className="flex justify-between items-center font-semibold pt-2 pb-2">
                <span className="text-taksu-forest">Gross Owner Payout</span>
                <span className="tabular-nums text-taksu-forest">{formatCurrency(statement.owner_gross_payout_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-taksu-terracotta pb-2 border-b border-border/50">
                <span>Less: PPh 26 Withholding Tax ({formatPercent(statement.pph26_rate)})</span>
                <span className="tabular-nums">- {formatCurrency(statement.pph26_amount_usd)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold pt-2">
                <span className="text-taksu-jungle">Net Owner Payout</span>
                <span className="tabular-nums text-taksu-jungle">{formatCurrency(statement.owner_net_payout_usd)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Expenses & KPI */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-taksu-sage mb-1">Occupancy</p>
                <p className="text-xl font-bold tabular-nums text-taksu-forest">{formatPercent(statement.occupancy_rate)}</p>
                <p className="text-[10px] text-taksu-sage mt-1">{statement.occupied_nights} nights</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-taksu-sage mb-1">ADR</p>
                <p className="text-xl font-bold tabular-nums text-taksu-forest">{statement.adr_usd ? formatCurrency(statement.adr_usd) : '—'}</p>
                <p className="text-[10px] text-taksu-sage mt-1">avg daily rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-taksu-sage mb-1">Bookings</p>
                <p className="text-xl font-bold tabular-nums text-taksu-forest">{statement.bookings_count}</p>
                <p className="text-[10px] text-taksu-sage mt-1">reservations</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 bg-taksu-cream rounded-t-xl border-b border-border">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-taksu-terracotta" />
                  Operating Expenses
                </div>
                <span className="text-base tabular-nums font-semibold text-taksu-forest">{formatCurrency(statement.total_opex_usd)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(breakdown).length > 0 ? (
                <div className="flex flex-col">
                  {Object.entries(breakdown).map(([category, data]) => (
                    <ExpenseCategory
                      key={category}
                      title={category}
                      amount={data.amount}
                      expenses={expensesByCategory[category] || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-taksu-sage">
                  No operating expenses recorded for this month.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
