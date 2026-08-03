/**
 * lib/system-events.ts
 *
 * Central helper for writing to the system_events table.
 * Used by sync, cron, token refresh, and health checks.
 * All writes go through the service-role admin client so they
 * are never blocked by RLS policies.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendTelegramNotification, escapeHtml } from '@/lib/telegram';

export type EventCategory = 'beds24' | 'system' | 'cron' | 'auth' | 'sync';
export type EventLevel = 'info' | 'success' | 'warning' | 'error';

export interface SystemEvent {
  category: EventCategory;
  level: EventLevel;
  title: string;
  body?: string;
  metadata?: Record<string, any>;
}

/**
 * Write a structured event to the system_events table.
 * Also sends a Telegram alert for warning/error levels.
 * Never throws — logs to console on failure.
 */
export async function logSystemEvent(event: SystemEvent): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient() as any;
    await supabase.from('system_events').insert({
      category: event.category,
      level: event.level,
      title: event.title,
      body: event.body ?? null,
      metadata: event.metadata ?? null,
    });
  } catch (err) {
    console.error('[logSystemEvent] DB write failed:', err);
  }

  // Send Telegram alert for warning/error events
  if (event.level === 'warning' || event.level === 'error') {
    try {
      const emoji = event.level === 'error' ? '🔴' : '🟡';
      const msg =
        `${emoji} <b>${escapeHtml(event.title)}</b>\n` +
        `<b>Category:</b> <code>${event.category}</code>\n` +
        (event.body ? `<b>Details:</b> ${escapeHtml(event.body)}\n` : '');
      await sendTelegramNotification(msg, 'system');
    } catch (err) {
      console.error('[logSystemEvent] Telegram alert failed:', err);
    }
  }
}

/**
 * Fetch recent system events (for the status bar).
 * Returns newest-first.
 */
export async function getRecentSystemEvents(limit = 50): Promise<any[]> {
  try {
    const supabase = createAdminSupabaseClient() as any;
    const { data } = await supabase
      .from('system_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
