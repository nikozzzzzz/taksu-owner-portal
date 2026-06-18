import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { FileText, Plus, Upload } from 'lucide-react';
import { requireOwner, getOwnerVilla } from '@/lib/auth/middleware';
import { getOwnerDashboard, getLatestBookings, getPoolPosition } from '@/lib/data/dashboard';
import { CurrentMonthCard } from '@/components/dashboard/current-month-card';
import { YtdSummary } from '@/components/dashboard/ytd-summary';
import { Dgt1Alert } from '@/components/dashboard/dgt1-alert';
import { PoolPositionMini } from '@/components/dashboard/pool-position-mini';
import { RecentBookingCard } from '@/components/dashboard/recent-booking-card';
import { PerformanceSummary } from '@/components/dashboard/performance-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your villa performance and financial summary',
};

export default async function DashboardPage() {
  const owner = await requireOwner();
  const villa = await getOwnerVilla(owner.id);

  // Fetch dashboard data in parallel
  const [dashboardData, latestBookings, poolPosition] = await Promise.all([
    getOwnerDashboard(owner.id),
    villa ? getLatestBookings(villa.id, 5) : Promise.resolve([]),
    villa ? getPoolPosition(villa.id) : Promise.resolve(null),
  ]);

  const currentMonth = dashboardData?.current_month ?? null;
  const ytd = dashboardData?.ytd ?? {
    gross_revenue: 0,
    owner_net_payout: 0,
    statements_count: 0,
    total_pph26: 0,
    avg_occupancy: 0,
  };
  const dgt1 = dashboardData?.dgt1_alert ?? {
    status: 'none' as const,
    valid_until: null,
    days_to_expire: null,
    current_rate: 0.20,
    savings_if_renewed: 0,
  };
  const pendingRequests = dashboardData?.pending_requests ?? 0;

  const firstName = owner.full_name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="portal-page animate-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="portal-page-header">
          <h1 className="portal-page-title">
            {greeting}, {firstName} 👋
          </h1>
          {villa && (
            <p className="portal-page-subtitle">
              {villa.display_name} · {villa.internal_code}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/statements">
              <FileText className="h-4 w-4" />
              Statements
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/requests/new">
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          </Button>
          {(dgt1.status === 'none' || dgt1.status === 'expired') && (
            <Button asChild size="sm">
              <Link href="/tax-documents/upload-dgt1">
                <Upload className="h-4 w-4" />
                Upload DGT-1
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* DGT-1 Alert — shown above fold when relevant */}
      <Dgt1Alert data={dgt1} />

      {/* Main grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current month — spans 2 columns */}
        <div className="md:col-span-2">
          <CurrentMonthCard data={currentMonth} />
        </div>

        {/* YTD Summary */}
        <YtdSummary data={ytd} />

        {/* Recent Bookings — spans 2 cols */}
        <div className="md:col-span-2">
          <RecentBookingCard bookings={latestBookings as any} />
        </div>

        {/* Right column: Performance + Pool */}
        <div className="space-y-4">
          <PerformanceSummary currentMonth={currentMonth} />
          <PoolPositionMini
            fairShareMetric={(poolPosition as any)?.fair_share_metric ?? null}
            villaId={villa?.id ?? null}
          />
        </div>
      </div>

      {/* Pending requests banner */}
      {pendingRequests > 0 && (
        <div className="rounded-lg border border-taksu-bamboo/30 bg-taksu-parchment p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-taksu-forest">
              You have{' '}
              <span className="font-semibold text-taksu-jungle">{pendingRequests}</span>{' '}
              pending request{pendingRequests > 1 ? 's' : ''} in progress
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/requests">View requests →</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
