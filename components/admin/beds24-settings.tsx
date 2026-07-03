'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, Unlink, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { connectBeds24, syncProperties } from '@/lib/actions/beds24-actions';

interface Status {
  connected: boolean;
  lastConnected: string | null;
}

export function Beds24Settings({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [inviteCode, setInviteCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;

    setConnecting(true);
    try {
      const res = await connectBeds24(inviteCode);
      if (res.success) {
        setStatus({ connected: true, lastConnected: new Date().toISOString() });
        setInviteCode('');
        alert('Successfully connected to Beds24!');
      } else {
        alert(`Failed to connect: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncProperties = async () => {
    setSyncing(true);
    try {
      const res = await syncProperties();
      if (res.success) {
        alert(`Synced ${res.data.length} properties from Beds24. (Mapping UI coming soon)`);
      } else {
        alert(`Failed to sync: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
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
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. abc123def456"
                    required
                  />
                  <Button type="submit" disabled={connecting} className="bg-taksu-jungle hover:bg-taksu-jungle/90">
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Connect
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generate an Invite Code in your Beds24 account under Settings {'>'} Account {'>'} API v2.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 text-taksu-jungle" />
                Last synchronized: {status.lastConnected ? new Date(status.lastConnected).toLocaleString() : 'Never'}
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSyncProperties} disabled={syncing} variant="outline" className="flex-1">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Fetch Properties
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
