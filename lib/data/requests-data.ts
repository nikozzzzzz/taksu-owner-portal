import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type OwnerRequestRow = Database['public']['Tables']['owner_requests']['Row'];

export async function getOwnerRequests(ownerId: string): Promise<OwnerRequestRow[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('owner_requests')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching owner requests:', error);
    return [];
  }
  
  return data;
}
