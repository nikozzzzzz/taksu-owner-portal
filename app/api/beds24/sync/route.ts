import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runBeds24FullSync } from '@/lib/beds24/sync';

/**
 * POST /api/beds24/sync
 * Triggers a full pull from Beds24.
 *
 * Requires: service-role Authorization header OR valid admin session cookie.
 */
export async function POST(req: NextRequest) {
  const supabase = (await createServerSupabaseClient()) as any;

  // ── Auth: allow both session-cookie (admin UI) and Authorization header ─────
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isServiceKey = apiKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isServiceKey) {
    // Fall back to session auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: owner } = await supabase
      .from('owners')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (!owner || !['admin', 'root'].includes(owner.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const result = await runBeds24FullSync(isServiceKey ? 'cron' : 'manual');
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
