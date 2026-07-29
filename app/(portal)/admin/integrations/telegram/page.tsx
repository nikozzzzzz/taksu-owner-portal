import { Metadata } from 'next';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { redirect } from 'next/navigation';
import { getTelegramSettings } from '@/lib/actions/telegram-actions';
import { TelegramSettings } from '@/components/admin/telegram-settings';

export const metadata: Metadata = {
  title: 'Telegram Integration | Taksu Admin',
};

export default async function TelegramIntegrationPage() {
  await requireOwner();
  const user = await getAuthUser();
  if (user?.app_metadata?.role !== 'admin' && user?.app_metadata?.role !== 'root') {
    redirect('/dashboard');
  }

  const res = await getTelegramSettings();
  const settings = res.success ? res.settings : null;

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title">Telegram Integration</h1>
        <p className="portal-page-subtitle">
          Manage logging, error monitoring, and startup notifications through a Telegram bot.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <TelegramSettings initialSettings={settings} />
      </div>
    </div>
  );
}
