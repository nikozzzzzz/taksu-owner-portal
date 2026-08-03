'use client';

import { useState } from 'react';
import { updateAiSettings } from '@/lib/actions/settings-actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AiSettingsFormProps {
  owner: any;
}

export function AiSettingsForm({ owner }: AiSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(owner.ai_provider || 'anthropic');

  async function actionHandler(formData: FormData) {
    setLoading(true);
    formData.append('ai_provider', provider);
    const result = await updateAiSettings(formData);
    setLoading(false);

    if (result.success) {
      toast.success('AI settings updated successfully');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  }

  return (
    <form action={actionHandler} className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai_model">Model</Label>
          <input
            type="text"
            id="ai_model"
            name="ai_model"
            defaultValue={owner.ai_model || 'claude-3-5-haiku-20241022'}
            placeholder="e.g. claude-3-5-haiku-20241022"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_api_key">API Key</Label>
        <input
          type="password"
          id="ai_api_key"
          name="ai_api_key"
          defaultValue={owner.ai_api_key || ''}
          placeholder="sk-ant-..."
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">Your API key is used directly to make requests.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai_pricing_prompt">Pricing Optimization Prompt Editor</Label>
        <textarea
          id="ai_pricing_prompt"
          name="ai_pricing_prompt"
          defaultValue={owner.ai_pricing_prompt || 'You are a helpful AI pricing assistant...'}
          rows={5}
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">This system prompt guides the AI in deciding prices.</p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Saving...' : 'Save AI Settings'}
        </Button>
      </div>
    </form>
  );
}
