'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Unlink, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { connectBeds24, syncBeds24Properties } from '@/lib/actions/beds24-actions';

interface Status {
  connected: boolean;
  lastConnected: string | null;
}

interface SyncedProperty {
  id: number;
  name: string;
  rooms?: { id: number; name: string }[];
}

export function Beds24Settings({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [inviteCode, setInviteCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [properties, setProperties] = useState<SyncedProperty[] | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
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
      if (res.success) {
        setStatus({ connected: true, lastConnected: new Date().toISOString() });
        setInviteCode('');
        setSuccessMsg('Successfully connected to Beds24!');
      } else {
        setErrorMsg(res.error || 'Unknown error connecting to Beds24.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncProperties = async () => {
    clearMessages();
    setSyncing(true);
    try {
      const res = await syncBeds24Properties();
      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data);
        setSuccessMsg(
          res.data.length > 0
            ? `Fetched ${res.data.length} propert${res.data.length === 1 ? 'y' : 'ies'} from Beds24.`
            : 'No properties found in this Beds24 account.'
        );
      } else {
        setErrorMsg(res.error || 'Failed to fetch properties from Beds24.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-taksu-jungle" />
                Last synchronized:{' '}
                {status.lastConnected
                  ? new Date(status.lastConnected).toLocaleString()
                  : 'Never'}
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSyncProperties}
                  disabled={syncing}
                  variant="outline"
                  className="flex-1"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Fetch Properties
                </Button>
              </div>

              {/* Properties list */}
              {properties && properties.length > 0 && (
                <div className="space-y-2">
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
                          To enable sync, assign this property and room ID to a Villa via Admin → Villas.
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook setup guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Setup</CardTitle>
          <CardDescription>
            Configure Beds24 to push booking events in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            In Beds24, go to <strong>Settings → Notifications → HTTP Requests</strong> and add a
            POST notification to:
          </p>
          <code className="block bg-gray-100 rounded px-3 py-2 text-xs text-gray-700 break-all">
            {typeof window !== 'undefined' ? window.location.origin : '[YOUR_DOMAIN]'}
            /api/webhooks/beds24
          </code>
          <p className="text-xs text-gray-400">
            Set the <strong>BEDS24_WEBHOOK_SECRET</strong> environment variable and configure the
            same value as the secret header in Beds24 for secure, authenticated webhooks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
