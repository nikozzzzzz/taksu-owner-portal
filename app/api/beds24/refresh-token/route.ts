import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logSystemEvent } from '@/lib/system-events';

const BEDS24_API_URL = 'https://api.beds24.com/v2';

/**
 * POST /api/beds24/refresh-token
 *
 * Proactively refreshes the Beds24 access token using the stored refresh token.
 * This keeps the token alive even during idle periods.
 *
 * Requires: service-role Authorization header.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isServiceKey = apiKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isServiceKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabaseClient() as any;
    const { data: creds, error } = await supabase
      .from('beds24_credentials')
      .select('id, refresh_token')
      .limit(1)
      .single();

    if (error || !creds) {
      await logSystemEvent({
        category: 'cron',
        level: 'warning',
        title: 'Beds24 heartbeat: No credentials found',
        body: 'Cron token refresh skipped because Beds24 is disconnected.',
      });
      return NextResponse.json(
        { error: 'No Beds24 credentials found. Please connect via Admin > Integrations.' },
        { status: 404 }
      );
    }

    // Call Beds24 token refresh endpoint
    const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
      method: 'GET',
      headers: { refreshToken: creds.refresh_token },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Beds24 Refresh] Token refresh failed:', errText);
      await logSystemEvent({
        category: 'cron',
        level: 'error',
        title: 'Beds24 heartbeat: Token refresh failed',
        body: `HTTP ${response.status}: ${errText.substring(0, 200)}`,
      });
      return NextResponse.json(
        { error: `Beds24 token refresh failed (${response.status}). You may need to reconnect via Admin > Integrations.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    if (!data.token) {
      await logSystemEvent({
        category: 'cron',
        level: 'error',
        title: 'Beds24 heartbeat: Empty token returned',
      });
      return NextResponse.json({ error: 'No token returned from Beds24' }, { status: 502 });
    }

    // Persist the new access token
    const { error: saveError } = await supabase
      .from('beds24_credentials')
      .update({
        token: data.token,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', creds.id);

    if (saveError) {
      console.error('[Beds24 Refresh] Failed to save refreshed token:', saveError);
      return NextResponse.json({ error: 'Failed to persist refreshed token' }, { status: 500 });
    }

    console.log('[Beds24 Refresh] Token refreshed successfully via cron heartbeat.');
    await logSystemEvent({
      category: 'cron',
      level: 'success',
      title: 'Beds24 cron heartbeat: Token refreshed',
      body: 'Token renewed successfully via automated cron run.',
    });
    return NextResponse.json({ success: true, refreshed_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Beds24 Refresh] Unexpected error:', err);
    await logSystemEvent({
      category: 'cron',
      level: 'error',
      title: 'Beds24 heartbeat error',
      body: err.message,
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
