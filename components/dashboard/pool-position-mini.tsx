import { Droplets, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent } from '@/lib/utils/currency';

interface PoolPositionMiniProps {
  fairShareMetric: number | null;
  villaId: string | null;
}

export function PoolPositionMini({ fairShareMetric, villaId }: PoolPositionMiniProps) {
  const metric = fairShareMetric ?? 1.0;

  // Normalize for display: 1.0 = fair, <1 = below, >1 = above
  const pct = Math.min(Math.max(metric * 100, 0), 200); // cap 0–200%
  const fillPct = Math.min((pct / 200) * 100, 100);

  let statusColor = 'text-taksu-jungle';
  let barColor = 'bg-taksu-jungle';
  let statusLabel = 'On Track';

  if (metric < 0.85) {
    statusColor = 'text-taksu-terracotta';
    barColor = 'bg-taksu-terracotta';
    statusLabel = 'Below Average';
  } else if (metric > 1.15) {
    statusColor = 'text-sky-600';
    barColor = 'bg-sky-400';
    statusLabel = 'Above Average';
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-taksu-bamboo" />
            Pool Position
          </CardTitle>
          {villaId && (
            <Link
              href="/pool-position"
              className="flex items-center gap-1 text-xs text-taksu-jungle hover:underline"
            >
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Gauge */}
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs text-taksu-sage">Fair Share</p>
            <p className={`tabular-nums text-2xl font-bold ${statusColor}`}>
              {formatPercent(metric)}
            </p>
          </div>
          <p className={`mb-1 text-sm font-medium ${statusColor}`}>{statusLabel}</p>
        </div>

        {/* Bar */}
        <div className="relative h-2 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${fillPct}%` }}
          />
          {/* Fair line at 50% (= 1.0) */}
          <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-taksu-forest/30" />
        </div>

        <p className="text-[10px] text-taksu-sage">
          Fair share = 1.00 · Pool rotation ensures equal booking distribution
        </p>
      </CardContent>
    </Card>
  );
}
