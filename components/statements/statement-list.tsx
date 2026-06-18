'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Filter, FileText } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StatementRow } from '@/lib/data/statements';

interface StatementListProps {
  statements: StatementRow[];
  currentYear: number;
}

export function StatementList({ statements, currentYear }: StatementListProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  const years = Array.from(new Set(statements.map(s => s.billing_month.substring(0, 4))));
  if (!years.includes(currentYear.toString())) {
    years.unshift(currentYear.toString());
  }

  const filtered = statements.filter(s => s.billing_month.startsWith(selectedYear));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-taksu-jungle/10 text-taksu-jungle border-none">Paid</Badge>;
      case 'sent_to_owner':
        return <Badge className="bg-sky-100 text-sky-700 border-none">Ready</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-100 text-amber-700 border-none">In Review</Badge>;
      default:
        return <Badge variant="outline" className="text-taksu-sage">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-taksu-forest">All Statements</h2>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-taksu-sage" />
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-md border-border bg-white py-1.5 pl-3 pr-8 text-sm text-taksu-forest focus:border-taksu-jungle focus:ring-taksu-jungle"
            title="Filter by year"
          >
            {years.sort().reverse().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {(selectedYear !== 'all' ? filtered : statements).length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-taksu-parchment">
                <FileText className="h-6 w-6 text-taksu-sage" />
              </div>
              <h3 className="font-medium text-taksu-forest">No statements found</h3>
              <p className="mt-1 text-sm text-taksu-sage">
                {selectedYear === 'all' 
                  ? 'You don\'t have any statements yet.' 
                  : `No statements available for ${selectedYear}.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(selectedYear !== 'all' ? filtered : statements).map((statement) => {
                const date = new Date(statement.billing_month);
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                return (
                  <button
                    key={statement.id}
                    onClick={() => router.push(`/statements/${statement.id}`)}
                    className="flex w-full items-center justify-between p-4 transition-colors hover:bg-taksu-cream/50 text-left"
                  >
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="font-medium text-taksu-forest">{monthName}</p>
                        <div className="mt-1">{getStatusBadge(statement.status)}</div>
                      </div>
                      
                      <div className="hidden sm:block">
                        <p className="text-xs text-taksu-sage">Gross Revenue</p>
                        <p className="font-medium tabular-nums text-taksu-forest">
                          {formatCurrency(statement.gross_revenue_usd)}
                        </p>
                      </div>

                      <div className="hidden lg:block">
                        <p className="text-xs text-taksu-sage">Occupancy</p>
                        <p className="font-medium tabular-nums text-taksu-forest">
                          {formatPercent(statement.occupancy_rate)}
                        </p>
                      </div>
                      
                      <div className="col-span-2 text-right sm:col-span-2 sm:text-left">
                        <p className="text-xs text-taksu-sage">Your Net Payout</p>
                        <p className="font-bold tabular-nums text-taksu-jungle">
                          {formatCurrency(statement.owner_net_payout_usd)}
                        </p>
                      </div>
                    </div>
                    
                    <ChevronRight className="ml-4 h-5 w-5 shrink-0 text-taksu-sage/50" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
