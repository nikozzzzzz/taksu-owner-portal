import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UserList } from '@/components/admin/user-list';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'User Management | Admin Panel',
  description: 'Manage users, roles, and statuses',
};

export default async function AdminUsersPage() {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  const supabase = await createServerSupabaseClient();
  const { data: owners, error } = await supabase
    .from('owners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error loading users: {error.message}</div>;
  }

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title">User Management</h1>
        <p className="portal-page-subtitle">Manage system access, roles, and user statuses.</p>
      </div>

      <div className="mt-8">
        <UserList initialUsers={owners} currentRole={role} />
      </div>
    </div>
  );
}
