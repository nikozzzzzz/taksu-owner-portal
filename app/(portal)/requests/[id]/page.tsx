import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { getOwnerRequest } from '@/lib/data/requests-data';
import { RequestDetail } from '@/components/requests/request-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const owner = await requireOwner();
  const request = await getOwnerRequest(id, owner.id);

  return {
    title: request ? `Request: ${request.subject}` : 'Request Not Found',
  };
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const owner = await requireOwner();
  const request = await getOwnerRequest(id, owner.id);

  if (!request) {
    notFound();
  }

  return (
    <div className="portal-page animate-in">
      <RequestDetail request={request} />
    </div>
  );
}
