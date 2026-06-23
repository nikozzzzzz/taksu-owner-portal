import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export type OwnerRequestRow = Database['public']['Tables']['owner_requests']['Row'];
export type RequestCommentRow = Database['public']['Tables']['request_comments']['Row'];

export interface RequestWithComments extends OwnerRequestRow {
  comments: RequestCommentRow[];
}

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

export async function getOwnerRequest(
  id: string,
  ownerId: string
): Promise<RequestWithComments | null> {
  const supabase = await createServerSupabaseClient();

  const { data: request, error: requestError } = await supabase
    .from('owner_requests')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single();

  if (requestError || !request) {
    return null;
  }

  const { data: comments, error: commentsError } = await supabase
    .from('request_comments')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  if (commentsError) {
    console.error('Error fetching request comments:', commentsError);
  }

  return {
    ...(request as OwnerRequestRow),
    comments: comments ?? [],
  };
}
