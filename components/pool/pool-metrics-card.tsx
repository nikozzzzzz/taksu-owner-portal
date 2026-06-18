import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { Trophy, Scale, CalendarDays, DollarSign } from 'lucide-react';
import type { PoolStateRow } from '@/lib/data/pool-data';

interface PoolMetricsCardProps {
  state: PoolStateRow | null;
}

export function PoolMetricsCard({ state }: PoolMetricsCardProps) {
  if (!state) {
    return (
      <Card className="border-border">
        <CardContent className="p-8 text-center text-taksu-sage">
          No pool rotation data available for this property yet.
        </CardContent>
      </Card>
    );
  }

  // A lower score usually means higher priority in the queue, 
  // but let's just display the raw score for transparency
  const priorityScore = Number(state.priority_score).toFixed(2);
  const fairShare = Number(state.fair_share_metric).toFixed(2);
  
  // Fair share color coding (target is 1.0)
  const isUnderperforming = Number(state.fair_share_metric) < 0.95;
  const isOverperforming = Number(state.fair_share_metric) > 1.05;

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="bg-taksu-cream border-b border-border pb-4">
        <CardTitle className="text-xl font-serif text-taksu-forest flex items-center gap-2">
          <Trophy className="h-5 w-5 text-taksu-bamboo" />
          Current Rotation Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-medium text-taksu-sage uppercase tracking-wider">Queue Position</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-taksu-jungle/10 rounded-full">
                  <Scale className="h-5 w-5 text-taksu-jungle" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-taksu-forest">{priorityScore}</p>
                  <p className="text-xs text-taksu-sage">Priority Score</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isUnderperforming ? 'bg-taksu-terracotta/10' : isOverperforming ? 'bg-amber-100' : 'bg-taksu-jungle/10'}`}>
                  <Scale className={`h-5 w-5 ${isUnderperforming ? 'text-taksu-terracotta' : isOverperforming ? 'text-amber-600' : 'text-taksu-jungle'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-taksu-forest">{fairShare}</p>
                  <p className="text-xs text-taksu-sage">Fair Share Target (1.0)</p>
                </div>
              </div>
            </div>
            
            {isUnderperforming && (
              <p className="text-xs text-taksu-terracotta font-medium mt-2 bg-taksu-terracotta/10 p-2 rounded">
                Your property is currently prioritized for upcoming channel bookings to balance the pool.
              </p>
            )}
            {isOverperforming && (
              <p className="text-xs text-amber-700 font-medium mt-2 bg-amber-100 p-2 rounded">
                Your property has received slightly more bookings recently. Priority is temporarily lowered to balance the pool.
              </p>
            )}
          </div>

          <div className="p-6 space-y-4 bg-taksu-parchment/30">
            <h3 className="text-sm font-medium text-taksu-sage uppercase tracking-wider">90-Day History</h3>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm border border-border">
                <DollarSign className="h-5 w-5 text-taksu-sage" />
              </div>
              <div>
                <p className="text-xl font-bold text-taksu-forest">{formatCurrency(state.revenue_last_90_days_usd)}</p>
                <p className="text-xs text-taksu-sage">Revenue Generated</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="p-2 bg-white rounded-full shadow-sm border border-border">
                <CalendarDays className="h-5 w-5 text-taksu-sage" />
              </div>
              <div>
                <p className="text-xl font-bold text-taksu-forest">{state.nights_booked_last_90_days}</p>
                <p className="text-xs text-taksu-sage">Nights Booked</p>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
