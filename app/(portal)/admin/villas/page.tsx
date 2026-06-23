import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { VillaList } from '@/components/admin/villa-list';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Villas Management | Admin Panel',
  description: 'Manage villas and assignments',
};

export default async function AdminVillasPage() {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  const supabase = await createServerSupabaseClient();
  
  const [villasRes, ownersRes, poolsRes] = await Promise.all([
    supabase
      .from('villas')
      .select('*, owner:owners(full_name, email), pool:pools(name)')
      .order('display_name', { ascending: true }),
    supabase
      .from('owners')
      .select('id, full_name')
      .order('full_name', { ascending: true }),
    supabase
      .from('pools')
      .select('id, name')
      .order('name', { ascending: true })
  ]);

  if (villasRes.error) {
    return <div>Error loading villas: {villasRes.error.message}</div>;
  }

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title">Villas Management</h1>
        <p className="portal-page-subtitle">Manage properties, assignments, and basic details.</p>
      </div>

      <div className="mt-8">
        <VillaList 
          initialVillas={villasRes.data || []} 
          owners={ownersRes.data || []} 
          pools={poolsRes.data || []} 
        />
      </div>
    </div>
  );
}
