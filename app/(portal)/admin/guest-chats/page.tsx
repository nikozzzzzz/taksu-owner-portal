import { getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GuestChatsClient } from './guest-chats-client';
import { getQuickReplies } from '@/lib/actions/quick-reply-actions';

export const metadata = {
  title: 'Guest Chats | Taksu Living',
};

export default async function GuestChatsPage() {
  const user = await getAuthUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata?.role)) {
    redirect('/dashboard');
  }

  // Fetch quick replies
  const qrRes = await getQuickReplies();
  const quickReplies = qrRes.success ? qrRes.data : [];

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] flex flex-col">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-taksu-forest mb-4">Guest Chats</h1>
      </div>
      <div className="flex-1 rounded-xl border border-border bg-white shadow-card-sm overflow-hidden flex">
        <GuestChatsClient quickReplies={quickReplies} />
      </div>
    </div>
  );
}
