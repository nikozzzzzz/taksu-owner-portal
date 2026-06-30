import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PoolList } from '@/components/admin/pool-list';

export const metadata = {
  title: 'Manage Pools | Taksu Owner Portal',
};

export default async function AdminPoolsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role || 'guest';

  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  const { data: pools } = await (supabase as any)
    .from('pools')
    .select('*, yield_formula:yield_formulas(id, name)')
    .order('name', { ascending: true });

  const { data: formulas } = await (supabase as any)
    .from('yield_formulas')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="border-b border-border pb-5">
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Manage Pools</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create and configure villa rental pools and yield sharing formulas.
        </p>
      </div>

      <PoolList pools={pools || []} formulas={formulas || []} />
    </div>
  );
}
