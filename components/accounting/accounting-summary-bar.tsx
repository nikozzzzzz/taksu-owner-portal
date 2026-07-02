'use client';

import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface AccountingSummaryBarProps {
  income: number;
  expense: number;
  currency?: string;
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

export function AccountingSummaryBar({ income, expense, currency = 'USD' }: AccountingSummaryBarProps) {
  const net = income - expense;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-green-600">Total Income</p>
          <p className="text-xl font-bold text-green-800">{fmt(income)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <TrendingDown className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-red-600">Total Expenses</p>
          <p className="text-xl font-bold text-red-800">{fmt(expense)}</p>
        </div>
      </div>

      <div className={`flex items-center gap-4 rounded-xl border p-4 ${
        net >= 0
          ? 'border-blue-100 bg-blue-50'
          : 'border-orange-100 bg-orange-50'
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          net >= 0 ? 'bg-blue-100' : 'bg-orange-100'
        }`}>
          <Scale className={`h-5 w-5 ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
        </div>
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Net Balance
          </p>
          <p className={`text-xl font-bold ${net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            {net >= 0 ? '' : '-'}{fmt(Math.abs(net))}
          </p>
        </div>
      </div>
    </div>
  );
}
