import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { getOwnerRequests } from '@/lib/data/requests-data';
import { MessageSquarePlus } from 'lucide-react';
import { RequestList } from '@/components/requests/request-list';
import { CreateRequestModal } from '@/components/requests/create-request-modal';

export const metadata: Metadata = {
  title: 'Owner Requests',
  description: 'Manage your requests and personal stays',
};

export default async function RequestsPage() {
  const owner = await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  const isAdmin = ['admin', 'root'].includes(role);
  
  const requests = await getOwnerRequests(owner.id, isAdmin);

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="portal-page-title flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6 text-taksu-bamboo" />
            Support & Requests
          </h1>
          <p className="portal-page-subtitle">
            Submit maintenance reports, ask questions, or book personal stays.
          </p>
        </div>
        
        <CreateRequestModal />
      </div>

      <div className="mt-8 max-w-4xl">
        <RequestList requests={requests} />
      </div>
    </div>
  );
}
