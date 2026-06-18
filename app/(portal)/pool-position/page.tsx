import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { getPoolState } from '@/lib/data/pool-data';
import { Activity } from 'lucide-react';
import { PoolMetricsCard } from '@/components/pool/pool-metrics-card';
import { AlgorithmExplainer } from '@/components/pool/algorithm-explainer';

export const metadata: Metadata = {
  title: 'Pool Position',
  description: 'View your property rotation metrics and priority score',
};

export default async function PoolPositionPage() {
  const owner = await requireOwner();
  const poolState = await getPoolState(owner.id);

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <Activity className="h-6 w-6 text-taksu-bamboo" />
          Pool Position
        </h1>
        <p className="portal-page-subtitle">
          Track your property&apos;s priority queue status within its rental pool.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PoolMetricsCard state={poolState} />
        </div>
        <div className="lg:col-span-1">
          <AlgorithmExplainer />
        </div>
      </div>
    </div>
  );
}
