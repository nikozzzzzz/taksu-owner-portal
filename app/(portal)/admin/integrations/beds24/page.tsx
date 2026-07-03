import { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getBeds24Status } from '@/lib/actions/beds24-actions';
import { Beds24Settings } from '@/components/admin/beds24-settings';

export const metadata: Metadata = {
  title: 'Beds24 Integration | Taksu Admin',
};

export default async function Beds24IntegrationPage() {
  await requireOwner();
  const user = await getAuthUser();
  if (user?.app_metadata?.role !== 'admin' && user?.app_metadata?.role !== 'root') {
    redirect('/dashboard');
  }

  const status = await getBeds24Status();

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title">Beds24 Integration</h1>
        <p className="portal-page-subtitle">
          Manage the two-way API connection with Beds24 Channel Manager.
        </p>
      </div>

      <div className="mt-8 max-w-2xl">
        <Beds24Settings initialStatus={status} />
      </div>
    </div>
  );
}
