'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = (await createServerSupabaseClient()) as any;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: owner } = await supabase
    .from('owners')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!owner || (owner.role !== 'admin' && owner.role !== 'root')) {
    throw new Error('Unauthorized');
  }
}

export async function createYieldFormula(data: any) {
  await requireAdmin();
  const supabase = (await createServerSupabaseClient()) as any;

  const { error } = await supabase.from('yield_formulas').insert({
    name: data.name,
    description: data.description,
    rules: data.rules,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/formulas');
}

export async function updateYieldFormula(id: string, data: any) {
  await requireAdmin();
  const supabase = (await createServerSupabaseClient()) as any;

  const { error } = await supabase
    .from('yield_formulas')
    .update({
      name: data.name,
      description: data.description,
      rules: data.rules,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/formulas');
}

export async function deleteYieldFormula(id: string) {
  await requireAdmin();
  const supabase = (await createServerSupabaseClient()) as any;

  // Check if it's in use
  const { data: pools } = await supabase
    .from('pools')
    .select('id')
    .eq('yield_formula_id', id)
    .limit(1);
    
  if (pools && pools.length > 0) {
    throw new Error('Cannot delete formula because it is currently assigned to one or more pools.');
  }

  const { error } = await supabase.from('yield_formulas').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/formulas');
}
