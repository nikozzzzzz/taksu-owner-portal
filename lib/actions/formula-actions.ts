'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata?.role)) {
    throw new Error('Unauthorized');
  }
  return supabase;
}

export async function upsertFormula(payload: any) {
  const supabase = await requireAdmin();

  const { id, name, description, rules } = payload;
  
  if (!name) throw new Error('Formula name is required');
  if (!rules || !Array.isArray(rules)) throw new Error('Valid rules array is required');

  const { error } = await (supabase as any)
    .from('yield_formulas')
    .upsert({
      id: id || undefined,
      name,
      description: description || null,
      rules
    });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/formulas');
  revalidatePath('/admin/pools');
}

export async function deleteFormula(id: string) {
  const supabase = await requireAdmin();

  // Check if it's assigned to any pools
  const { data: pools, error: poolsError } = await (supabase as any)
    .from('pools')
    .select('id')
    .eq('yield_formula_id', id)
    .limit(1);

  if (poolsError) throw new Error(poolsError.message);
  if (pools && pools.length > 0) {
    throw new Error('Cannot delete formula because it is currently assigned to one or more pools.');
  }

  const { error } = await supabase
    .from('yield_formulas')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/formulas');
}
