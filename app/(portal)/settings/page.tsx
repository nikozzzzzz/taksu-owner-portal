import { getOwnerProfile } from '@/lib/actions/settings-actions';
import { redirect } from 'next/navigation';
import { SettingsTabs } from './settings-tabs';
import { getAuthUser } from '@/lib/auth/middleware';

export const metadata = {
  title: 'Settings | Taksu Living Owner Portal',
};

export default async function SettingsPage() {
  const owner = await getOwnerProfile();

  if (!owner) {
    redirect('/login');
  }

  const authUser = await getAuthUser();
  const isAdmin = ['admin', 'root'].includes(authUser?.app_metadata?.role || '');

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-taksu-forest">
          Profile & Settings
        </h1>
        <p className="mt-1 text-sm text-taksu-sage">
          Manage your personal information, preferences, and banking details.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-card-sm overflow-hidden">
        <SettingsTabs owner={owner} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
