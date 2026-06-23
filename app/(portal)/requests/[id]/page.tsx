import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { getOwnerRequest } from '@/lib/data/requests-data';
import { RequestDetail } from '@/components/requests/request-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const owner = await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  const isAdmin = ['admin', 'root'].includes(role);
  
  const request = await getOwnerRequest(id, owner.id, isAdmin);

  return {
    title: request ? `Request: ${request.subject}` : 'Request Not Found',
  };
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const owner = await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  const isAdmin = ['admin', 'root'].includes(role);
  
  const request = await getOwnerRequest(id, owner.id, isAdmin);

  if (!request) {
    notFound();
  }

  return (
    <div className="portal-page animate-in">
      <RequestDetail request={request} isAdmin={isAdmin} />
    </div>
  );
}
