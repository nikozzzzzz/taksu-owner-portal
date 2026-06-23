import { redirect } from 'next/navigation';
import { requireOwner, getOwnerVilla, getAuthUser } from '@/lib/auth/middleware';
import { PortalLayoutClient } from './layout-client';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check — redirects to /login if not authenticated
  const owner = await requireOwner();
  const villa = await getOwnerVilla(owner.id);
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  return (
    <PortalLayoutClient
      ownerName={owner.full_name}
      villaName={villa?.display_name}
      role={role}
    >
      {children}
    </PortalLayoutClient>
  );
}
