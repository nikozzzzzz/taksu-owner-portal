import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPoolDailyReport } from '@/lib/actions/pool-actions';
import { PoolDailyChart } from '@/components/admin/pool-daily-chart';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pool Reports | Taksu Owner Portal',
};

export default async function AdminPoolReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createServerSupabaseClient();
  const poolId = resolvedParams.id;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role || 'guest';

  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  // Get pool details
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single();

  if (!pool) redirect('/admin/pools');
  const p = pool as any;

  // Hardcode 90 days report for MVP
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const report = await getPoolDailyReport(poolId, startStr, endStr);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <Link href="/admin/pools">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Pool Report: {p.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily financial metrics (revenue and expenses) for the last 90 days.
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="rounded-md border bg-white px-4 py-2 text-sm">
          <span className="text-gray-500 mr-2">Formula:</span>
          <span className="font-medium text-taksu-jungle">{p.yield_formula.replace('_', ' ')}</span>
        </div>
        <div className="rounded-md border bg-white px-4 py-2 text-sm">
          <span className="text-gray-500 mr-2">Villa Type:</span>
          <span className="font-medium text-gray-900">{p.villa_type}</span>
        </div>
        <div className="rounded-md border bg-white px-4 py-2 text-sm">
          <span className="text-gray-500 mr-2">Status:</span>
          <span className={`font-medium ${p.active ? 'text-green-600' : 'text-red-600'}`}>
            {p.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <PoolDailyChart data={report.data} villas={report.villas} />
    </div>
  );
}
