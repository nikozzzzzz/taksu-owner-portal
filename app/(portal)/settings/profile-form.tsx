'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileInfo } from '@/lib/actions/settings-actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  citizenship: z.string().optional(),
  date_of_birth: z.string().optional(),
  country_of_residence: z.string().optional(),
  passport_number: z.string().optional(),
  passport_issue_date: z.string().optional(),
  passport_expiry_date: z.string().optional(),
  passport_document_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  npwp_document_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  registration_address: z.string().optional(),
  actual_address: z.string().optional(),
  phone_whatsapp: z.string().optional(),
  phone_telegram: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({ owner }: { owner: any }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: owner?.full_name || '',
      citizenship: owner?.citizenship || '',
      date_of_birth: owner?.date_of_birth || '',
      country_of_residence: owner?.country_of_residence || '',
      passport_number: owner?.passport_number || '',
      passport_issue_date: owner?.passport_issue_date || '',
      passport_expiry_date: owner?.passport_expiry_date || '',
      passport_document_url: owner?.passport_document_url || '',
      npwp_document_url: owner?.npwp_document_url || '',
      registration_address: owner?.registration_address || '',
      actual_address: owner?.actual_address || '',
      phone_whatsapp: owner?.phone_whatsapp || '',
      phone_telegram: owner?.phone_telegram || '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const result = await updateProfileInfo(formData);
      if (result.success) {
        setSuccessMsg('Profile updated successfully.');
      } else {
        setErrorMsg(result.error || 'Failed to update profile.');
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

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name (as in passport)</Label>
          <Input id="full_name" {...register('full_name')} disabled={isPending} />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="citizenship">Citizenship</Label>
            <Input id="citizenship" {...register('citizenship')} disabled={isPending} placeholder="e.g. USA, IDN" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="country_of_residence">Country of Residence</Label>
            <Input id="country_of_residence" {...register('country_of_residence')} disabled={isPending} />
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <h3 className="text-sm font-medium text-taksu-forest mb-4">Passport Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="passport_number">Passport Number</Label>
              <Input id="passport_number" {...register('passport_number')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passport_document_url">Passport Scan URL</Label>
              <Input id="passport_document_url" {...register('passport_document_url')} disabled={isPending} placeholder="Link to PDF/JPEG" />
              {errors.passport_document_url && <p className="text-xs text-red-500">{errors.passport_document_url.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passport_issue_date">Issue Date</Label>
              <Input id="passport_issue_date" type="date" {...register('passport_issue_date')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passport_expiry_date">Expiry Date</Label>
              <Input id="passport_expiry_date" type="date" {...register('passport_expiry_date')} disabled={isPending} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <h3 className="text-sm font-medium text-taksu-forest mb-4">Contact & Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone_whatsapp">WhatsApp Number</Label>
              <Input id="phone_whatsapp" {...register('phone_whatsapp')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone_telegram">Telegram Username/Number</Label>
              <Input id="phone_telegram" {...register('phone_telegram')} disabled={isPending} />
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <Label htmlFor="registration_address">Registration Address (by passport)</Label>
            <Input id="registration_address" {...register('registration_address')} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="actual_address">Actual Residential Address</Label>
            <Input id="actual_address" {...register('actual_address')} disabled={isPending} />
          </div>
        </div>

        {/* Read-only fields related to tax */}
        <div className="pt-4 border-t border-border mt-4">
          <h3 className="text-sm font-medium text-taksu-forest mb-4">Tax Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-taksu-sage">Tax Residency Country (Read-only)</Label>
              <Input value={owner?.tax_residency_country || ''} disabled className="bg-gray-50" />
              <p className="text-xs text-taksu-sage">Contact admin to change this.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-taksu-sage">NPWP Indonesia (Read-only)</Label>
              <Input value={owner?.npwp_indonesia || ''} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="npwp_document_url">NPWP Document URL</Label>
              <Input id="npwp_document_url" {...register('npwp_document_url')} disabled={isPending} placeholder="Link to PDF/JPEG" />
              {errors.npwp_document_url && <p className="text-xs text-red-500">{errors.npwp_document_url.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
