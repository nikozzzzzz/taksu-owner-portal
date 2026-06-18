import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type PoolStateRow = Database['public']['Tables']['pool_rotation_state']['Row'];

export async function getPoolState(ownerId: string): Promise<PoolStateRow | null> {
  const supabase = await createServerSupabaseClient();
  
  // First, get the owner's primary villa
  const { data: villas } = await supabase
    .from('villas')
    .select('id')
    .eq('owner_id', ownerId)
    .limit(1);

  const villaId = (villas as any[])?.[0]?.id;
  if (!villaId) return null;

  // Then fetch the pool state for that villa
  const { data, error } = await supabase
    .from('pool_rotation_state')
    .select('*')
    .eq('villa_id', villaId)
    .single();

  if (error) {
    console.error('Error fetching pool state:', error);
    return null;
  }
  
  return data;
}
