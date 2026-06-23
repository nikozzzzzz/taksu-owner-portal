'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';

// Admin permission check helper
async function requireAdmin() {
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  if (!['admin', 'root'].includes(role)) {
    throw new Error('Unauthorized');
  }
  return { user, role };
}

// ─── User Actions ────────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: string) {
  const { role } = await requireAdmin();
  const supabase = await createServerSupabaseClient();
  
  // Protect root users from being modified by normal admins
  if (role === 'admin') {
    const { data: targetUser }: { data: any } = await supabase
      .from('owners')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (targetUser?.role === 'root') {
      throw new Error('Admins cannot modify root users.');
    }
  }
  
  const { error } = await (supabase as any)
    .from('owners')
    .update({ role: newRole as any })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserStatus(userId: string, newStatus: string) {
  const { role } = await requireAdmin();
  const supabase = await createServerSupabaseClient();
  
  // Protect root users
  if (role === 'admin') {
    const { data: targetUser }: { data: any } = await supabase
      .from('owners')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (targetUser?.role === 'root') {
      throw new Error('Admins cannot modify root users.');
    }
  }

  const { error } = await (supabase as any)
    .from('owners')
    .update({ status: newStatus as any })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

// ─── Villa Actions ───────────────────────────────────────────────────────────

export async function upsertVilla(villaData: any) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await (supabase as any)
    .from('villas')
    .upsert(villaData);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/villas');
  return { success: true };
}

// ─── Request Actions ─────────────────────────────────────────────────────────

export async function updateRequestStatus(requestId: string, newStatus: string) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await (supabase as any)
    .from('owner_requests')
    .update({ status: newStatus as any })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  revalidatePath('/requests');
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}
