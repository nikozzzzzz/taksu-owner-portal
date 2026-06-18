import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';

// Ubud market median benchmarks (from spec)
const UBUD_MARKET_MEDIAN = {
  occupancy: 0.377,
  adr_usd: 113,
  revpar_usd: 46,
};

interface PerformanceSummaryProps {
  currentMonth: {
    occupancy_rate: number;
    adr_usd: number | null;
    revpar_usd: number | null;
  } | null;
}

function CompareBar({
  label,
  value,
  benchmark,
  format,
}: {
  label: string;
  value: number | null;
  benchmark: number;
  format: (n: number) => string;
}) {
  if (value === null) return null;
  const isAbove = value >= benchmark;
  const pct = Math.min((value / benchmark) * 100, 200);
  const benchmarkPct = 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-taksu-sage">{label}</span>
        <span className={`tabular-nums font-semibold ${isAbove ? 'text-taksu-jungle' : 'text-taksu-terracotta'}`}>
          {format(value)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        {/* Your performance */}
        <div
          className={`absolute left-0 h-full rounded-full transition-all ${
            isAbove ? 'bg-taksu-jungle' : 'bg-taksu-terracotta'
          }`}
          style={{ width: `${Math.min(pct / 2, 100)}%` }}
        />
        {/* Market benchmark marker */}
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-taksu-sand"
          style={{ left: '50%' }}
          title={`Market median: ${format(benchmark)}`}
        />
      </div>
      <p className="text-right text-[10px] text-taksu-sage/60">
        Market: {format(benchmark)}
      </p>
    </div>
  );
}

export function PerformanceSummary({ currentMonth }: PerformanceSummaryProps) {
  if (!currentMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-taksu-bamboo" />
            vs. Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-taksu-sage">No data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-taksu-bamboo" />
          vs. Ubud Market
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CompareBar
          label="Occupancy"
          value={currentMonth.occupancy_rate}
          benchmark={UBUD_MARKET_MEDIAN.occupancy}
          format={formatPercent}
        />
        <CompareBar
          label="ADR"
          value={currentMonth.adr_usd}
          benchmark={UBUD_MARKET_MEDIAN.adr_usd}
          format={(n) => formatCurrency(n)}
        />
        <CompareBar
          label="RevPAR"
          value={currentMonth.revpar_usd}
          benchmark={UBUD_MARKET_MEDIAN.revpar_usd}
          format={(n) => formatCurrency(n)}
        />

        <p className="text-[10px] text-taksu-sage/60">
          Market data: Ubud short-term rental median (2025)
        </p>
      </CardContent>
    </Card>
  );
}
