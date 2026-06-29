'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTaxInfo } from '@/lib/actions/settings-actions';
import { Loader2, CheckCircle2 } from 'lucide-react';

const taxSchema = z.object({
  tin_number: z.string().optional(),
  tin_document_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  p3b_treaty_number: z.string().optional(),
  p3b_document_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  dgt1_issue_date: z.string().optional(),
  dgt1_valid_until: z.string().optional(),
});

type TaxFormValues = z.infer<typeof taxSchema>;

export function TaxForm({ owner }: { owner: any }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      tin_number: owner?.tin_number || '',
      tin_document_url: owner?.tin_document_url || '',
      p3b_treaty_number: owner?.p3b_treaty_number || '',
      p3b_document_url: owner?.p3b_document_url || '',
      dgt1_issue_date: owner?.dgt1_issue_date || '',
      dgt1_valid_until: owner?.dgt1_valid_until || '',
    },
  });

  const onSubmit = (data: TaxFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const result = await updateTaxInfo(formData);
      if (result.success) {
        setSuccessMsg('Tax profile updated successfully.');
      } else {
        setErrorMsg(result.error || 'Failed to update tax profile.');
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
        
        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <Label className="text-taksu-sage">DGT-1 Status (Read-only)</Label>
            <Input value={owner?.dgt1_status || 'none'} disabled className="bg-gray-50 capitalize" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-taksu-sage">Effective PPh 26 Rate (Read-only)</Label>
            <Input value={owner?.pph26_effective_rate ? `${(owner.pph26_effective_rate * 100).toFixed(0)}%` : '20%'} disabled className="bg-gray-50" />
          </div>
        </div>

        <div className="pt-2 space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Tax Identification Number (TIN)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tin_number">TIN Number</Label>
              <Input id="tin_number" {...register('tin_number')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tin_document_url">TIN Document URL</Label>
              <Input id="tin_document_url" {...register('tin_document_url')} disabled={isPending} placeholder="Link to PDF/JPEG" />
              {errors.tin_document_url && <p className="text-xs text-red-500">{errors.tin_document_url.message}</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">DGT-1 Certificate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dgt1_issue_date">DGT-1 Issue Date</Label>
              <Input id="dgt1_issue_date" type="date" {...register('dgt1_issue_date')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dgt1_valid_until">DGT-1 Expiry Date</Label>
              <Input id="dgt1_valid_until" type="date" {...register('dgt1_valid_until')} disabled={isPending} />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Tax Treaty (P3B)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p3b_treaty_number">P3B Treaty Number</Label>
              <Input id="p3b_treaty_number" {...register('p3b_treaty_number')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p3b_document_url">P3B Document URL</Label>
              <Input id="p3b_document_url" {...register('p3b_document_url')} disabled={isPending} placeholder="Link to PDF/JPEG" />
              {errors.p3b_document_url && <p className="text-xs text-red-500">{errors.p3b_document_url.message}</p>}
            </div>
          </div>
        </div>

      </div>

      <Button type="submit" disabled={isPending} className="w-full md:w-auto mt-6">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Tax Profile
      </Button>
    </form>
  );
}
