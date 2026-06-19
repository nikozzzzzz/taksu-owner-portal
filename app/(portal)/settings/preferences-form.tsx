'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePreferences } from '@/lib/actions/settings-actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

const prefsSchema = z.object({
  preferred_language: z.string().min(2),
  email_notifications_enabled: z.boolean(),
});

type PrefsFormValues = z.infer<typeof prefsSchema>;

export function PreferencesForm({ owner }: { owner: any }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { handleSubmit, setValue, watch } = useForm<PrefsFormValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      preferred_language: owner?.preferred_language || 'en',
      email_notifications_enabled: owner?.email_notifications_enabled ?? true,
    },
  });

  const watchLanguage = watch('preferred_language');
  const watchEmailNotifs = watch('email_notifications_enabled');

  const onSubmit = (data: PrefsFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('preferred_language', data.preferred_language);
      formData.append('email_notifications_enabled', data.email_notifications_enabled.toString());

      const result = await updatePreferences(formData);
      if (result.success) {
        setSuccessMsg('Preferences updated successfully.');
      } else {
        setErrorMsg(result.error || 'Failed to update preferences.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="preferred_language">Preferred Language</Label>
          <Select 
            disabled={isPending} 
            value={watchLanguage} 
            onValueChange={(val) => setValue('preferred_language', val)}
          >
            <SelectTrigger id="preferred_language" className="w-full md:w-[240px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Indonesian</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="ru">Russian</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-taksu-sage">This language will be used for your portal interface and emails.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="email_notifs">Email Notifications</Label>
            <p className="text-sm text-taksu-sage">Receive emails when new statements and requests are available.</p>
          </div>
          <Switch 
            id="email_notifs" 
            checked={watchEmailNotifs} 
            onCheckedChange={(val) => setValue('email_notifications_enabled', val)}
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>
    </form>
  );
}
