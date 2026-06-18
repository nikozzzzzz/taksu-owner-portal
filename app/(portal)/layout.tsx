import { redirect } from 'next/navigation';
import { requireOwner, getOwnerVilla } from '@/lib/auth/middleware';
import { PortalLayoutClient } from './layout-client';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check — redirects to /login if not authenticated
  const owner = await requireOwner();
  const villa = await getOwnerVilla(owner.id);

  return (
    <PortalLayoutClient
      ownerName={owner.full_name}
      villaName={villa?.display_name}
    >
      {children}
    </PortalLayoutClient>
  );
}
