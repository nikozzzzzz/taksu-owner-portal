'use server';

import { getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logUserActivity } from '@/lib/user-logger';

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata?.role)) {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function getQuickReplies() {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;
    const { data, error } = await supabase
      .from('quick_replies')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getQuickReplies error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createQuickReply(name: string, text: string) {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;
    const { error } = await supabase
      .from('quick_replies')
      .insert({ name, text });
      
    if (error) throw error;
    await logUserActivity('create_quick_reply', { name });
    return { success: true };
  } catch (error: any) {
    console.error('createQuickReply error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateQuickReply(id: string, name: string, text: string) {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;
    const { error } = await supabase
      .from('quick_replies')
      .update({ name, text })
      .eq('id', id);
      
    if (error) throw error;
    await logUserActivity('update_quick_reply', { id });
    return { success: true };
  } catch (error: any) {
    console.error('updateQuickReply error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteQuickReply(id: string) {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;
    const { error } = await supabase
      .from('quick_replies')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    await logUserActivity('delete_quick_reply', { id });
    return { success: true };
  } catch (error: any) {
    console.error('deleteQuickReply error:', error);
    return { success: false, error: error.message };
  }
}
