import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FormulasClient } from './formulas-client';

export const metadata = {
  title: 'Yield Formulas | Taksu Owner Portal',
};

export default async function FormulasPage() {
  const supabase = (await createServerSupabaseClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user?.app_metadata?.role || 'guest';
  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  // Fetch formulas
  const { data: formulas, error } = await supabase
    .from('yield_formulas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching yield formulas:', error);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-taksu-forest">Yield Formulas</h1>
        <p className="mt-2 text-sm text-taksu-ink/70">
          Define distribution models for revenue pools.
        </p>
      </div>

      <FormulasClient initialFormulas={formulas || []} />
    </div>
  );
}
