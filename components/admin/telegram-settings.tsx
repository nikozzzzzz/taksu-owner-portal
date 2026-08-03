'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Bot,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { saveTelegramSettings, testTelegramSettings } from '@/lib/actions/telegram-actions';

interface TelegramConfig {
  id?: string;
  bot_token: string;
  bot_name: string;
  chat_id: string;
  acl: number[];
  is_enabled: boolean;
  report_system_usage_hourly: boolean;
  health_status: string;
  last_health_check: string | null;
}

interface TelegramSettingsProps {
  initialSettings: TelegramConfig | null;
}

export function TelegramSettings({ initialSettings }: TelegramSettingsProps) {
  const [botToken, setBotToken] = useState(initialSettings?.bot_token || '');
  const [chatId, setChatId] = useState(initialSettings?.chat_id || '');
  const [botName, setBotName] = useState(initialSettings?.bot_name || '');
  const [isEnabled, setIsEnabled] = useState(initialSettings?.is_enabled || false);
  const [reportHourly, setReportHourly] = useState(initialSettings?.report_system_usage_hourly || false);
  const [aclStr, setAclStr] = useState(initialSettings?.acl?.join(', ') || '');
  
  const [healthStatus, setHealthStatus] = useState(initialSettings?.health_status || 'unknown');
  const [lastHealthCheck, setLastHealthCheck] = useState(initialSettings?.last_health_check || null);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (isEnabled && (!botToken || !chatId)) {
      setErrorMsg('Bot Token and Chat ID are required when enabling the bot.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveTelegramSettings({
        bot_token: botToken,
        bot_name: botName,
        chat_id: chatId,
        acl: aclStr,
        is_enabled: isEnabled,
        report_system_usage_hourly: reportHourly,
      });

      if (res.success) {
        setSuccessMsg('Telegram settings saved successfully!');
      } else {
        setErrorMsg(res.error || 'Failed to save Telegram settings.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    clearMessages();
    const token = botToken.trim();
    const chat = chatId.trim();

    if (!token || !chat) {
      setErrorMsg('Both Bot Token and Chat ID are required to test the connection.');
      return;
    }

    setTesting(true);
    try {
      const res = await testTelegramSettings({
        bot_token: token,
        chat_id: chat,
      });

      setLastHealthCheck(new Date().toISOString());
      if (res.success) {
        setHealthStatus('healthy');
        if (res.botName) setBotName(res.botName);
        setSuccessMsg(`Test message sent successfully! Connected bot: "${res.botName || 'Telegram Bot'}"`);
      } else {
        setHealthStatus('unhealthy');
        setErrorMsg(res.error || 'Connection test failed. Verify token and chat permissions.');
      }
    } catch (err: any) {
      setHealthStatus('unhealthy');
      setErrorMsg(err.message || 'Unexpected error while testing connection.');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (healthStatus) {
      case 'healthy':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
          </Badge>
        );
      case 'unhealthy':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Unhealthy
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-100 text-gray-600 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 backdrop-blur-sm transition-all duration-200">
          <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-red-500" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 backdrop-blur-sm transition-all duration-200">
          <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 shrink-0 text-emerald-500" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Telegram Card */}
      <Card className="border border-taksu-ink/5 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-gray-50 pb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-500 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-serif text-taksu-forest">Telegram Bot Logs</CardTitle>
                <CardDescription>
                  Configure system alerts, error reports, and API activity alerts.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  id="bot-toggle"
                />
                <Label htmlFor="bot-toggle" className="font-medium text-sm text-taksu-ink cursor-pointer">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bot-token" className="text-sm font-semibold text-taksu-ink">
                  Bot Token (API Key)
                </Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsT..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="bg-taksu-bone/30 focus-visible:ring-sky-500 font-mono text-sm"
                />
                <p className="text-xs text-taksu-ink/50">
                  Obtained from Telegram's <span className="font-medium text-sky-600">@BotFather</span>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-id" className="text-sm font-semibold text-taksu-ink">
                  Target Chat / Channel ID
                </Label>
                <Input
                  id="chat-id"
                  type="text"
                  placeholder="-1001234567890"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="bg-taksu-bone/30 focus-visible:ring-sky-500 font-mono text-sm"
                />
                <p className="text-xs text-taksu-ink/50">
                  Can be a private group ID, channel ID, or your personal chat ID.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bot-name" className="text-sm font-semibold text-taksu-ink">
                  Bot Display Name
                </Label>
                <Input
                  id="bot-name"
                  type="text"
                  placeholder="TaksuLoggingBot"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="bg-taksu-bone/30 focus-visible:ring-sky-500"
                />
                <p className="text-xs text-taksu-ink/50">
                  Identifies the bot within the system UI.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acl-input" className="text-sm font-semibold text-taksu-ink flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Access Control List (ACL)
                </Label>
                <Input
                  id="acl-input"
                  type="text"
                  placeholder="12345678, 98765432"
                  value={aclStr}
                  onChange={(e) => setAclStr(e.target.value)}
                  className="bg-taksu-bone/30 focus-visible:ring-sky-500 font-mono text-sm"
                />
                <p className="text-xs text-taksu-ink/50">
                  Comma-separated list of Telegram user IDs allowed to interact with the bot.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 border-t border-gray-50 pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-taksu-ink">
                  Automated Reports
                </Label>
                <div className="flex items-center gap-3 bg-taksu-bone/20 p-3 rounded-md border border-taksu-bone/50">
                  <Switch
                    checked={reportHourly}
                    onCheckedChange={setReportHourly}
                    id="report-hourly-toggle"
                  />
                  <Label htmlFor="report-hourly-toggle" className="text-sm text-taksu-ink cursor-pointer">
                    Report System Usage Hourly (CPU/RAM)
                  </Label>
                </div>
              </div>
            </div>

            {/* Health Info Block */}
            {lastHealthCheck && (
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 text-xs text-taksu-ink/75 flex items-center gap-2">
                <Settings className="h-4 w-4 text-taksu-ink/50 animate-spin-slow" />
                <div>
                  <span className="font-semibold">Last Connection Test: </span>
                  {new Date(lastHealthCheck).toLocaleString('en-US', { timeZone: 'Asia/Makassar' })} WITA
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-50 pt-6 flex-wrap gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing || saving}
                className="border-gray-200 text-taksu-ink hover:bg-gray-50 active:scale-95 transition-transform"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-500" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 text-sky-500" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={saving || testing}
                className="bg-taksu-forest text-white hover:bg-taksu-jungle active:scale-95 transition-transform"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
