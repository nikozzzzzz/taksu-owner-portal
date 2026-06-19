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
  passport_number: z.string().optional(),
  passport_country: z.string().optional(),
  date_of_birth: z.string().optional(),
  country_of_residence: z.string().optional(),
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
      passport_number: owner?.passport_number || '',
      passport_country: owner?.passport_country || '',
      date_of_birth: owner?.date_of_birth || '',
      country_of_residence: owner?.country_of_residence || '',
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
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" {...register('full_name')} disabled={isPending} />
          {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="passport_number">Passport Number</Label>
            <Input id="passport_number" {...register('passport_number')} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passport_country">Passport Country</Label>
            <Input id="passport_country" {...register('passport_country')} disabled={isPending} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} disabled={isPending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country_of_residence">Country of Residence</Label>
            <Input id="country_of_residence" {...register('country_of_residence')} disabled={isPending} />
          </div>
        </div>
        
        {/* Read-only fields related to tax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border mt-4">
          <div className="space-y-1.5">
            <Label className="text-taksu-sage">Tax Residency Country (Read-only)</Label>
            <Input value={owner?.tax_residency_country || ''} disabled className="bg-gray-50" />
            <p className="text-xs text-taksu-sage">Contact admin to change this, as it affects withholding tax.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-taksu-sage">NPWP Indonesia (Read-only)</Label>
            <Input value={owner?.npwp_indonesia || ''} disabled className="bg-gray-50" />
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
