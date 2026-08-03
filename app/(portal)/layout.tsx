import { redirect } from 'next/navigation';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { PortalLayoutClient } from './layout-client';
import { UserActivityTracker } from '@/components/user-activity-tracker';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check — redirects to /login if not authenticated
  const owner = await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  
  const supabase = await createServerSupabaseClient();
  let query = supabase.from('villas').select('id, display_name').in('status', ['active', 'paused', 'pre_launch']);
  if (role !== 'admin' && role !== 'root') {
    query = query.eq('owner_id', owner.id);
  }
  const { data: villas } = await query.order('internal_code', { ascending: true });

  return (
    <PortalLayoutClient
      ownerName={owner.full_name}
      villas={villas || []}
      role={role}
    >
      <UserActivityTracker />
      {children}
    </PortalLayoutClient>
  );
}
