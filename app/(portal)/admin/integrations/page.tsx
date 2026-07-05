import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Link2 } from 'lucide-react';

export const metadata = {
  title: 'Integrations | Taksu Owner Portal',
};

export default async function IntegrationsPage() {
  const supabase = (await createServerSupabaseClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: owner } = await supabase
    .from('owners')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!owner || (owner.role !== 'admin' && owner.role !== 'root')) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium text-taksu-forest">Integrations</h1>
        <p className="mt-2 text-sm text-taksu-ink/70">
          Manage third-party connections and APIs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/integrations/beds24"
          className="flex flex-col gap-3 rounded-lg border border-taksu-ink/10 bg-white p-6 shadow-sm transition-all hover:border-taksu-bamboo hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-taksu-bone text-taksu-forest">
              <Link2 className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-taksu-ink">Beds24</h3>
          </div>
          <p className="text-sm text-taksu-ink/70">
            Channel manager integration for bookings, availability, and webhooks.
          </p>
        </Link>
      </div>
    </div>
  );
}
