import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/supabase/types';

type Owner = Database['public']['Tables']['owners']['Row'];
type Villa = Database['public']['Tables']['villas']['Row'];

// ─── Get current authenticated user ──────────────────────────────────────────

export async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('[getAuthUser] FAILED!', 'error:', error);
    return null;
  }
  return user;
}

// ─── Require auth — redirect to login if not authenticated ───────────────────

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

// ─── Get current owner profile ───────────────────────────────────────────────

export async function getCurrentOwner(): Promise<Owner | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Require owner — redirect if no owner record ─────────────────────────────

export async function requireOwner(): Promise<Owner> {
  await requireAuth();
  const owner = await getCurrentOwner();

  if (!owner) {
    // Owner profile doesn't exist yet — redirect to setup
    redirect('/setup-account');
  }

  if (owner.status !== 'active') {
    redirect('/login?error=account_suspended');
  }

  return owner;
}

// ─── Get owner's primary villa ────────────────────────────────────────────────

export async function getOwnerVilla(ownerId: string): Promise<Villa | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('villas')
    .select('*')
    .eq('owner_id', ownerId)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}
