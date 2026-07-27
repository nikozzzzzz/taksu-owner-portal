import type { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { ApiLogsViewer } from '@/components/admin/api-logs-viewer';
import { Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Logs | Admin Panel',
  description: 'View live API requests and webhooks',
};

export default async function AdminLogsPage() {
  await requireOwner();
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';

  // Visible ONLY for admin/root
  if (!['admin', 'root'].includes(role)) {
    redirect('/dashboard');
  }

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <Activity className="h-6 w-6 text-taksu-bamboo" />
          API Logs
        </h1>
        <p className="portal-page-subtitle">Monitor all inbound and outbound requests between Taksu and Beds24.</p>
      </div>

      <div className="mt-8">
        <ApiLogsViewer />
      </div>
    </div>
  );
}
