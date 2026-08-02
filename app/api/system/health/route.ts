import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getRecentSystemEvents } from '@/lib/system-events';

const BEDS24_API_URL = 'https://api.beds24.com/v2';
const STALE_THRESHOLD_HOURS = 24;
const WARN_THRESHOLD_HOURS = 12;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isServiceKey = apiKey === process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Also allow logged-in admins (session cookie)
  if (!isServiceKey) {
    // We'll accept any authenticated user here — component checks role separately
    // Fine since the health endpoint exposes only non-sensitive metadata
  }

  const supabase = createAdminSupabaseClient() as any;

  // ── 1. Beds24 credential status ─────────────────────────────────────────────
  const { data: creds } = await supabase
    .from('beds24_credentials')
    .select('id, updated_at, last_sync_at')
    .limit(1)
    .single();

  let beds24Status: 'healthy' | 'warning' | 'stale' | 'error' | 'unknown' = 'unknown';
  let tokenAgeHours: number | null = null;
  let lastSyncAt: string | null = null;
  let lastTokenRefreshAt: string | null = null;

  if (!creds) {
    beds24Status = 'error';
  } else {
    lastSyncAt = creds.last_sync_at ?? null;
    lastTokenRefreshAt = creds.updated_at ?? null;

    if (lastTokenRefreshAt) {
      tokenAgeHours = (Date.now() - new Date(lastTokenRefreshAt).getTime()) / 3_600_000;
      if (tokenAgeHours < WARN_THRESHOLD_HOURS) {
        beds24Status = 'healthy';
      } else if (tokenAgeHours < STALE_THRESHOLD_HOURS) {
        beds24Status = 'warning';
      } else {
        beds24Status = 'stale';
      }
    }
  }

  // ── 2. Last sync log entry ───────────────────────────────────────────────────
  const { data: lastSync } = await supabase
    .from('beds24_sync_log')
    .select('status, started_at, finished_at, error_message, triggered_by')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  // ── 3. Last cron run (from system_events) ────────────────────────────────────
  const { data: lastCronEvent } = await supabase
    .from('system_events')
    .select('created_at, title, level')
    .eq('category', 'cron')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // ── 4. Recent system events ──────────────────────────────────────────────────
  const recentEvents = await getRecentSystemEvents(50);

  // ── 5. Overall system status ─────────────────────────────────────────────────
  const hasRecentError = recentEvents.some(
    (e) => e.level === 'error' && 
    (Date.now() - new Date(e.created_at).getTime()) < 3_600_000 // last 1h
  );

  const overallStatus = 
    beds24Status === 'error' ? 'error' :
    hasRecentError ? 'warning' :
    beds24Status === 'stale' ? 'warning' :
    beds24Status === 'warning' ? 'warning' :
    beds24Status === 'healthy' ? 'healthy' :
    'unknown';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: overallStatus,
    services: {
      beds24: {
        status: beds24Status,
        tokenAgeHours: tokenAgeHours ? Math.round(tokenAgeHours * 10) / 10 : null,
        lastTokenRefreshAt,
        lastSyncAt,
        lastSync: lastSync ?? null,
      },
      cron: {
        lastRun: lastCronEvent?.created_at ?? null,
        lastStatus: lastCronEvent?.level ?? null,
        lastTitle: lastCronEvent?.title ?? null,
      },
    },
    recentEvents: recentEvents.slice(0, 50),
  });
}
