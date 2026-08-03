'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  Unlink,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Download,
  Clock,
  Building2,
  CalendarCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  connectBeds24,
  syncBeds24Properties,
  fullSyncBeds24,
  getBeds24SyncHistory,
  getBeds24Status,
} from '@/lib/actions/beds24-actions';

type Staleness = 'healthy' | 'warning' | 'stale' | 'error' | undefined;

interface Status {
  connected: boolean;
  lastConnected: string | null;
  lastSyncAt?: string | null;
  tokenAgeHours?: number | null;
  staleness?: Staleness;
  nextSyncAt?: string | null;
}

interface SyncedProperty {
  id: number;
  name: string;
  rooms?: { id: number; name: string }[];
}

interface SyncLogEntry {
  id: string;
  triggered_by: string;
  status: 'running' | 'success' | 'error';
  properties_found: number;
  bookings_fetched: number;
  bookings_created: number;
  bookings_updated: number;
  bookings_skipped: number;
  error_message?: string;
  started_at: string;
  finished_at?: string;
}

// ── Health Banner ─────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Beds24HealthBanner({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const s = await getBeds24Status();
      setStatus(s as Status);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const staleness = status.staleness;

  const bannerStyle =
    staleness === 'healthy' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
    staleness === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' :
    staleness === 'stale'   ? 'border-orange-200 bg-orange-50 text-orange-800' :
    staleness === 'error'   ? 'border-red-200 bg-red-50 text-red-800' :
    'border-gray-200 bg-gray-50 text-gray-600';

  const BannerIcon =
    staleness === 'healthy' ? ShieldCheck :
    staleness === 'warning' ? AlertTriangle :
    staleness === 'stale'   ? AlertCircle :
    staleness === 'error'   ? XCircle :
    AlertCircle;

  const bannerTitle =
    staleness === 'healthy' ? 'Connection healthy' :
    staleness === 'warning' ? 'Token aging — refresh recommended' :
    staleness === 'stale'   ? 'Token stale — cron may not be running' :
    staleness === 'error'   ? 'Not connected — credentials missing' :
    'Status unknown';

  return (
    <div className={`rounded-lg border px-4 py-3 ${bannerStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <BannerIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">{bannerTitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs opacity-80">
              <div>
                <span className="font-medium">Token age:</span>{' '}
                {status.tokenAgeHours != null ? `${status.tokenAgeHours}h` : '–'}
              </div>
              <div>
                <span className="font-medium">Refreshed:</span>{' '}
                {timeAgo(status.lastConnected)}
              </div>
              <div>
                <span className="font-medium">Last sync:</span>{' '}
                {timeAgo(status.lastSyncAt)}
              </div>
              <div>
                <span className="font-medium">Next sync:</span>{' '}
                {status.nextSyncAt ? timeAgo(status.nextSyncAt).replace(' ago', '') + ' (est)' : '–'}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// ── Main Settings Component ───────────────────────────────────────────────────

export function Beds24Settings({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [inviteCode, setInviteCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [reconnecting, setReconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [properties, setProperties] = useState<SyncedProperty[] | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncLogEntry[] | null>(null);
  const [syncResult, setSyncResult] = useState<{
    properties_found: number;
    bookings_fetched: number;
    bookings_created: number;
    bookings_updated: number;
    bookings_skipped: number;
  } | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSyncResult(null);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an invite code.');
      return;
    }

    setConnecting(true);
    try {
      const res = await connectBeds24(trimmed);
      if (res?.success) {
        setStatus({ connected: true, lastConnected: new Date().toISOString() });
        setInviteCode('');
        setReconnecting(false);
        setSuccessMsg('Successfully connected to Beds24!');
      } else {
        setErrorMsg(res?.error || 'Unknown error connecting to Beds24.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error.');
    } finally {
      setConnecting(false);
    }
  };

  const handleFetchProperties = async () => {
    clearMessages();
    setSyncing(true);
    try {
      const res = await syncBeds24Properties();
      if (res?.success && Array.isArray(res.data)) {
        setProperties(res.data);
        setSuccessMsg(
          res.data.length > 0
            ? `Fetched ${res.data.length} propert${res.data.length === 1 ? 'y' : 'ies'} from Beds24.`
            : 'No properties found in this Beds24 account.'
        );
      } else {
        setErrorMsg(res?.error || 'Failed to fetch properties from Beds24.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error.');
    } finally {
      setSyncing(false);
    }
  };

  const handleFullSync = async () => {
    clearMessages();
    setFullSyncing(true);
    setSyncResult(null);
    try {
      const res = await fullSyncBeds24();
      if (res?.success) {
        setSyncResult(res.data ?? null);
        setSuccessMsg(
          `Full sync complete — ${res.data?.bookings_created ?? 0} created, ${res.data?.bookings_updated ?? 0} updated.`
        );
        // Refresh sync history
        const hist = await getBeds24SyncHistory(5);
        if (hist?.success) setSyncHistory(hist.data);
      } else {
        setErrorMsg(res?.error || 'Full sync failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error during sync.');
    } finally {
      setFullSyncing(false);
    }
  };

  const loadSyncHistory = useCallback(async () => {
    const res = await getBeds24SyncHistory(5);
    if (res?.success) setSyncHistory(res.data);
  }, []);

  return (
    <div className="space-y-6">
      {/* Permanent health status banner — always visible */}
      <Beds24HealthBanner initialStatus={status} />

      {/* Alert messages */}

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Connection Status Card ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Connection Status</CardTitle>
              <CardDescription>
                Link Taksu to your Beds24 Account using an Invite Code
              </CardDescription>
            </div>
            {status.connected ? (
              <div className="flex items-center gap-2 text-taksu-jungle bg-taksu-bamboo/20 px-3 py-1.5 rounded-full text-sm font-medium">
                <Link2 className="h-4 w-4" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium">
                <Unlink className="h-4 w-4" />
                Disconnected
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!status.connected ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Beds24 Invite Code</Label>
                <div className="flex gap-3">
                  <Input
                    id="inviteCode"
                    type="password"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Paste your invite code here"
                    required
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={connecting}
                    className="bg-taksu-jungle hover:bg-taksu-jungle/90"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Connect
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generate an Invite Code in your Beds24 account under{' '}
                  <strong>Settings → Account → API v2 → Invite Codes</strong>.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-taksu-jungle" />
                  Last synchronized:{' '}
                  {status.lastConnected
                    ? new Date(status.lastConnected).toLocaleString()
                    : 'Never'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-700 text-xs gap-1.5"
                  onClick={() => { setReconnecting((v) => !v); clearMessages(); }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {reconnecting ? 'Cancel' : 'Update Invite Code'}
                </Button>
              </div>

              {reconnecting && (
                <form onSubmit={handleConnect} className="space-y-2 pt-1 border-t border-gray-100">
                  <Label htmlFor="inviteCodeReconnect" className="text-sm">
                    New Invite Code
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="inviteCodeReconnect"
                      type="password"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Paste your new invite code here"
                      required
                      autoComplete="off"
                    />
                    <Button
                      type="submit"
                      disabled={connecting}
                      className="bg-taksu-jungle hover:bg-taksu-jungle/90 shrink-0"
                    >
                      {connecting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      Reconnect
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Generate a new Invite Code in Beds24 under{' '}
                    <strong>Settings &rarr; Account &rarr; API v2 &rarr; Invite Codes</strong>.
                  </p>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Full Sync Card (only shown when connected) ─────────────────────── */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Full Two-Way Sync
            </CardTitle>
            <CardDescription>
              Pull all properties, rooms, and bookings (±2 years) from Beds24 into Taksu.
              Auto-maps villas by property/room ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleFullSync}
                disabled={fullSyncing}
                className="flex-1 bg-taksu-jungle hover:bg-taksu-jungle/90"
              >
                {fullSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                )}
                {fullSyncing ? 'Syncing…' : 'Run Full Sync'}
              </Button>

              <Button
                onClick={handleFetchProperties}
                disabled={syncing}
                variant="outline"
                className="flex-1"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                Fetch Properties
              </Button>

              <Button
                onClick={loadSyncHistory}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <Clock className="h-4 w-4 mr-1" />
                History
              </Button>
            </div>

            {/* Sync result counters */}
            {syncResult && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { label: 'Properties', value: syncResult.properties_found, icon: Building2, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Fetched',    value: syncResult.bookings_fetched,  icon: Download,       color: 'text-gray-600 bg-gray-50' },
                  { label: 'Created',    value: syncResult.bookings_created,  icon: ArrowDownToLine, color: 'text-green-700 bg-green-50' },
                  { label: 'Updated',    value: syncResult.bookings_updated,  icon: RefreshCw,      color: 'text-amber-700 bg-amber-50' },
                  { label: 'Skipped',    value: syncResult.bookings_skipped,  icon: CalendarCheck,  color: 'text-gray-500 bg-gray-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`rounded-lg px-3 py-2 text-center ${color}`}>
                    <Icon className="h-4 w-4 mx-auto mb-1 opacity-70" />
                    <div className="text-lg font-semibold">{value}</div>
                    <div className="text-xs">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Properties list */}
            {properties && properties.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-gray-700">
                  Beds24 Properties ({properties.length})
                </p>
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                  {properties.map((prop: SyncedProperty) => (
                    <div key={prop.id} className="px-4 py-3">
                      <p className="font-medium text-taksu-forest">
                        {prop.name || `Property ${prop.id}`}{' '}
                        <span className="text-gray-400 font-normal">#{prop.id}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Assign this property and room ID to a Villa via{' '}
                        <strong>Admin → Villas</strong>.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {properties && properties.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">
                No properties returned from Beds24. Check your account configuration.
              </p>
            )}

            {/* Sync history */}
            {syncHistory && syncHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">Recent Syncs</p>
                <div className="space-y-2">
                  {syncHistory.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-start gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      {run.status === 'success' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      ) : run.status === 'error' ? (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={run.status === 'success' ? 'success' : run.status === 'error' ? 'destructive' : 'outline'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {run.status}
                          </Badge>
                          <span className="text-gray-400">
                            {new Date(run.started_at).toLocaleString()}
                          </span>
                          <span className="text-gray-400 capitalize">· {run.triggered_by}</span>
                        </div>
                        {run.status === 'success' && (
                          <div className="mt-1 text-gray-500">
                            {run.bookings_created} created · {run.bookings_updated} updated ·{' '}
                            {run.bookings_skipped} skipped
                          </div>
                        )}
                        {run.error_message && (
                          <div className="mt-1 text-red-500 truncate">{run.error_message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Webhook Setup Guide ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Real-Time Webhook (Beds24 → Taksu)
          </CardTitle>
          <CardDescription>
            Configure Beds24 to push booking events in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-3">
          <p>
            In Beds24, go to <strong>Settings → Notifications → HTTP Requests</strong> and add a
            POST notification to:
          </p>
          <code className="block bg-gray-100 rounded px-3 py-2 text-xs text-gray-700 break-all">
            {typeof window !== 'undefined' ? window.location.origin : '[YOUR_DOMAIN]'}
            /api/webhooks/beds24
          </code>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <strong>Security:</strong> Set the <strong>BEDS24_WEBHOOK_SECRET</strong> environment
            variable and configure the same value as the secret header in Beds24 for authenticated
            webhooks.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
