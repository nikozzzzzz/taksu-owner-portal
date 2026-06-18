import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { Landmark } from 'lucide-react';
import type { TaxDocumentRow } from '@/lib/data/tax-data';

interface AnnualSummaryProps {
  documents: TaxDocumentRow[];
}

export function AnnualSummary({ documents }: AnnualSummaryProps) {
  if (documents.length === 0) return null;

  // Aggregate by year
  const yearAggregates = documents.reduce((acc, doc) => {
    const year = doc.billing_month.substring(0, 4);
    if (!acc[year]) {
      acc[year] = { gross: 0, tax: 0, count: 0 };
    }
    acc[year].gross += doc.owner_gross_payout_usd;
    acc[year].tax += doc.pph26_amount_usd;
    acc[year].count += 1;
    return acc;
  }, {} as Record<string, { gross: number; tax: number; count: number }>);

  // Get current year
  const currentYear = new Date().getFullYear().toString();
  const summary = yearAggregates[currentYear];

  if (!summary) return null;

  return (
    <Card className="bg-taksu-cream border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-full">
            <Landmark className="h-6 w-6 text-taksu-bamboo" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-taksu-forest">{currentYear} Annual Summary</h3>
            <p className="text-sm text-taksu-sage">
              Cumulative tax withheld for the current calendar year ({summary.count} months).
            </p>
            <div className="grid grid-cols-2 gap-4 pt-3 mt-3 border-t border-border/50">
              <div>
                <p className="text-xs text-taksu-sage">Total Gross Payout</p>
                <p className="font-semibold text-taksu-forest">{formatCurrency(summary.gross)}</p>
              </div>
              <div>
                <p className="text-xs text-taksu-sage">Total Tax Withheld</p>
                <p className="font-bold text-taksu-terracotta">{formatCurrency(summary.tax)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
