import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FormulaList } from '@/components/admin/formula-list';

export const metadata = {
  title: 'Yield Formulas | Taksu Owner Portal',
};

export default async function AdminFormulasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role || 'guest';
  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  const { data: formulas } = await (supabase as any)
    .from('yield_formulas')
    .select('*')
    .order('name');

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-taksu-forest">Yield Formulas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage distribution rules and calculation formulas for Pools.
        </p>
      </div>

      <FormulaList initialFormulas={formulas || []} />
    </div>
  );
}
