'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronUp, ChevronDown, Activity, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, Circle,
  Wifi, Clock, Zap, Database
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type HealthLevel = 'healthy' | 'warning' | 'error' | 'unknown';
type EventLevel  = 'info' | 'success' | 'warning' | 'error';

interface ServiceHealth {
  beds24: {
    status: HealthLevel;
    tokenAgeHours: number | null;
    lastTokenRefreshAt: string | null;
    lastSyncAt: string | null;
    lastSync: { status: string; started_at: string; error_message?: string; triggered_by: string } | null;
  };
  cron: {
    lastRun: string | null;
    lastStatus: string | null;
    lastTitle: string | null;
  };
}

interface SystemEvent {
  id: string;
  created_at: string;
  category: string;
  level: EventLevel;
  title: string;
  body?: string;
}

interface HealthPayload {
  timestamp: string;
  overall: HealthLevel;
  services: ServiceHealth;
  recentEvents: SystemEvent[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusDot({ level }: { level: HealthLevel | EventLevel }) {
  const color =
    level === 'healthy' || level === 'success' ? 'bg-emerald-400 shadow-emerald-400/50' :
    level === 'warning'                         ? 'bg-amber-400 shadow-amber-400/50' :
    level === 'error'                           ? 'bg-red-500 shadow-red-500/50' :
    'bg-gray-400 shadow-gray-400/50';

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} shadow-[0_0_4px_1px] shrink-0`} />
  );
}

function EventIcon({ level }: { level: EventLevel }) {
  if (level === 'success') return <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />;
  if (level === 'warning')  return <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />;
  if (level === 'error')    return <XCircle className="h-3 w-3 text-red-400 shrink-0" />;
  return <Circle className="h-3 w-3 text-gray-400 shrink-0" />;
}

function categoryBadge(cat: string) {
  const map: Record<string, string> = {
    beds24: 'bg-violet-900/60 text-violet-300',
    sync:   'bg-blue-900/60 text-blue-300',
    cron:   'bg-teal-900/60 text-teal-300',
    auth:   'bg-amber-900/60 text-amber-300',
    system: 'bg-gray-700 text-gray-300',
  };
  return map[cat] ?? 'bg-gray-700 text-gray-300';
}

// ── Main component ────────────────────────────────────────────────────────────

export function SystemStatusBar() {
  const [open, setOpen]         = useState(false);
  const [data, setData]         = useState<HealthPayload | null>(null);
  const [loading, setLoading]   = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/health', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastFetch(new Date());
      }
    } catch {
      // Silently fail — don't break the UI
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  // Scroll log to bottom when opened
  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [open, data]);

  const overall = data?.overall ?? 'unknown';
  const overallLabel =
    overall === 'healthy' ? 'System OK' :
    overall === 'warning' ? 'Warning' :
    overall === 'error'   ? 'Error' :
    'Checking…';

  const b24 = data?.services.beds24;
  const cron = data?.services.cron;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 font-mono text-xs
        border-t border-gray-700/80 bg-gray-900/95 backdrop-blur-sm text-gray-300
        shadow-[0_-4px_24px_rgba(0,0,0,0.4)]
        transition-all duration-300 ease-in-out`}
      style={{ height: open ? '320px' : '28px' }}
    >
      {/* ── Collapsed bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 h-7 cursor-pointer select-none hover:bg-gray-800/60 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <StatusDot level={overall} />
          <span className={`font-semibold ${
            overall === 'healthy' ? 'text-emerald-400' :
            overall === 'warning' ? 'text-amber-400' :
            overall === 'error'   ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {overallLabel}
          </span>

          {b24 && (
            <span className="text-gray-500 hidden sm:inline">
              Beds24:
              <span className={`ml-1 ${
                b24.status === 'healthy' ? 'text-emerald-400' :
                b24.status === 'warning' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {b24.status === 'healthy' ? '✓' : b24.status === 'warning' ? '⚠' : '✗'}
              </span>
              {b24.lastSyncAt && (
                <span className="text-gray-500 ml-1">synced {timeAgo(b24.lastSyncAt)}</span>
              )}
            </span>
          )}

          {data?.recentEvents?.[0] && (
            <span className="text-gray-600 hidden lg:inline truncate max-w-xs">
              · Last: {data.recentEvents[0].title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="text-gray-600 hidden sm:inline">
              {lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); fetchHealth(); }}
            className={`text-gray-500 hover:text-gray-300 transition-colors p-0.5 ${loading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronUp className="h-3.5 w-3.5 text-gray-500" />}
        </div>
      </div>

      {/* ── Expanded panel ─────────────────────────────────────────────────── */}
      {open && (
        <div className="flex h-[calc(320px-28px)] overflow-hidden border-t border-gray-700/60">
          {/* Left: service health cards */}
          <div className="w-80 shrink-0 border-r border-gray-700/60 overflow-y-auto p-3 space-y-2">
            <p className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold pb-1">
              Service Health
            </p>

            {/* Beds24 */}
            <div className="rounded bg-gray-800/60 px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-violet-400" />
                <span className="font-semibold text-gray-200">Beds24 API</span>
                <StatusDot level={b24?.status ?? 'unknown'} />
                <span className={`text-[10px] uppercase font-semibold ${
                  b24?.status === 'healthy' ? 'text-emerald-400' :
                  b24?.status === 'warning' ? 'text-amber-400' :
                  b24?.status === 'error'   ? 'text-red-400' :
                  'text-gray-500'
                }`}>{b24?.status ?? '–'}</span>
              </div>
              <div className="pl-5 space-y-0.5 text-gray-400">
                <div>Token age: <span className={`${
                  (b24?.tokenAgeHours ?? 0) > 12 ? 'text-amber-400' : 'text-gray-300'
                }`}>{b24?.tokenAgeHours != null ? `${b24.tokenAgeHours.toFixed(1)}h` : '–'}</span></div>
                <div>Refreshed: <span className="text-gray-300">{timeAgo(b24?.lastTokenRefreshAt ?? null)}</span></div>
                <div>Last sync: <span className="text-gray-300">{timeAgo(b24?.lastSyncAt ?? null)}</span></div>
                {b24?.lastSync && (
                  <div>Sync by: <span className="text-gray-300 capitalize">{b24.lastSync.triggered_by}</span></div>
                )}
                {b24?.lastSync?.error_message && (
                  <div className="text-red-400 truncate" title={b24.lastSync.error_message}>
                    ✗ {b24.lastSync.error_message.substring(0, 60)}
                  </div>
                )}
              </div>
            </div>

            {/* Cron */}
            <div className="rounded bg-gray-800/60 px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                <span className="font-semibold text-gray-200">Cron Scheduler</span>
                <StatusDot level={cron?.lastStatus === 'success' ? 'healthy' : cron?.lastStatus === 'error' ? 'error' : 'unknown'} />
              </div>
              <div className="pl-5 space-y-0.5 text-gray-400">
                <div>Last run: <span className="text-gray-300">{timeAgo(cron?.lastRun ?? null)}</span></div>
                {cron?.lastTitle && (
                  <div className="text-gray-500 truncate">{cron.lastTitle}</div>
                )}
              </div>
            </div>

            {/* App */}
            <div className="rounded bg-gray-800/60 px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-semibold text-gray-200">Next.js App</span>
                <StatusDot level="healthy" />
                <span className="text-[10px] text-emerald-400 uppercase font-semibold">Running</span>
              </div>
              <div className="pl-5 text-gray-400">
                <div>Portal responding ✓</div>
              </div>
            </div>

            {/* DB */}
            <div className="rounded bg-gray-800/60 px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-gray-200">Supabase DB</span>
                <StatusDot level={data ? 'healthy' : 'unknown'} />
              </div>
              <div className="pl-5 text-gray-400">
                <div>{data ? 'Connected ✓' : 'Checking…'}</div>
              </div>
            </div>
          </div>

          {/* Right: event log */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <p className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                System Events
              </p>
              <span className="text-gray-600">
                {data?.recentEvents.length ?? 0} entries
              </span>
            </div>
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700"
            >
              {(!data?.recentEvents || data.recentEvents.length === 0) && (
                <div className="text-gray-600 py-4 text-center">No events yet</div>
              )}
              {[...(data?.recentEvents ?? [])].reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-0.5 border-b border-gray-800/60 last:border-0"
                >
                  <span className="text-gray-600 shrink-0 w-[72px] text-right">
                    {new Date(event.created_at).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </span>
                  <EventIcon level={event.level} />
                  <span className={`shrink-0 uppercase text-[9px] font-bold px-1 py-0.5 rounded ${categoryBadge(event.category)}`}>
                    {event.category}
                  </span>
                  <span className={`flex-1 min-w-0 ${
                    event.level === 'error'   ? 'text-red-300' :
                    event.level === 'warning' ? 'text-amber-300' :
                    event.level === 'success' ? 'text-emerald-300' :
                    'text-gray-400'
                  }`}>
                    {event.title}
                    {event.body && (
                      <span className="text-gray-600 ml-1">— {event.body}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
