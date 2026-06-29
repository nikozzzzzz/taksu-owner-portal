'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePreferences } from '@/lib/actions/settings-actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

const prefsSchema = z.object({
  preferred_language: z.string().min(2),
  statement_language: z.string().min(2),
  statement_email: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  report_frequency: z.enum(['monthly', 'quarterly']),
  email_notifications_enabled: z.boolean(),
  booking_notifications_enabled: z.boolean(),
  dgt1_notifications_enabled: z.boolean(),
});

type PrefsFormValues = z.infer<typeof prefsSchema>;

export function PreferencesForm({ owner }: { owner: any }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PrefsFormValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      preferred_language: owner?.preferred_language || 'en',
      statement_language: owner?.statement_language || 'en',
      statement_email: owner?.statement_email || '',
      report_frequency: owner?.report_frequency || 'monthly',
      email_notifications_enabled: owner?.email_notifications_enabled ?? true,
      booking_notifications_enabled: owner?.booking_notifications_enabled ?? true,
      dgt1_notifications_enabled: owner?.dgt1_notifications_enabled ?? true,
    },
  });

  const watchLanguage = watch('preferred_language');
  const watchStmtLanguage = watch('statement_language');
  const watchFreq = watch('report_frequency');
  const watchEmailNotifs = watch('email_notifications_enabled');
  const watchBookingNotifs = watch('booking_notifications_enabled');
  const watchDgt1Notifs = watch('dgt1_notifications_enabled');

  const onSubmit = (data: PrefsFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('preferred_language', data.preferred_language);
      formData.append('statement_language', data.statement_language);
      if (data.statement_email) formData.append('statement_email', data.statement_email);
      formData.append('report_frequency', data.report_frequency);
      formData.append('email_notifications_enabled', data.email_notifications_enabled.toString());
      formData.append('booking_notifications_enabled', data.booking_notifications_enabled.toString());
      formData.append('dgt1_notifications_enabled', data.dgt1_notifications_enabled.toString());

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
        <h3 className="text-sm font-medium text-taksu-forest">Language & Frequency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_language">Portal Language</Label>
            <Select 
              disabled={isPending} 
              value={watchLanguage} 
              onValueChange={(val) => setValue('preferred_language', val)}
            >
              <SelectTrigger id="preferred_language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Indonesian</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-taksu-sage">Used for the web interface.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="statement_language">Statement Document Language</Label>
            <Select 
              disabled={isPending} 
              value={watchStmtLanguage} 
              onValueChange={(val) => setValue('statement_language', val)}
            >
              <SelectTrigger id="statement_language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Indonesian</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-taksu-sage">Used for generated PDFs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="statement_email">Alternative Statement Email</Label>
            <Input id="statement_email" {...register('statement_email')} disabled={isPending} placeholder="Leave blank to use primary" />
            {errors.statement_email && <p className="text-xs text-red-500">{errors.statement_email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="report_frequency">Reporting Frequency</Label>
            <Select 
              disabled={isPending} 
              value={watchFreq} 
              onValueChange={(val) => setValue('report_frequency', val as 'monthly' | 'quarterly')}
            >
              <SelectTrigger id="report_frequency" className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Notification Toggles</h3>
          
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifs">General Email Notifications</Label>
              <p className="text-sm text-taksu-sage">Receive emails when new statements and requests are available.</p>
            </div>
            <Switch 
              id="email_notifs" 
              checked={watchEmailNotifs} 
              onCheckedChange={(val) => setValue('email_notifications_enabled', val)}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="booking_notifs">New Booking Notifications</Label>
              <p className="text-sm text-taksu-sage">Receive an alert when a guest books your villa.</p>
            </div>
            <Switch 
              id="booking_notifs" 
              checked={watchBookingNotifs} 
              onCheckedChange={(val) => setValue('booking_notifications_enabled', val)}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="dgt1_notifs">DGT-1 Expiry Reminders</Label>
              <p className="text-sm text-taksu-sage">Receive a reminder 60 days before your DGT-1 certificate expires.</p>
            </div>
            <Switch 
              id="dgt1_notifs" 
              checked={watchDgt1Notifs} 
              onCheckedChange={(val) => setValue('dgt1_notifications_enabled', val)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto mt-6">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>
    </form>
  );
}
