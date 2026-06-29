'use client';

import { useTransition, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReAuthDialog } from '@/components/auth/reauth-dialog';
import { updateBankingInfo } from '@/lib/actions/settings-actions';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

const bankingSchema = z.object({
  bank_name: z.string().min(2, 'Bank name is required'),
  bank_country: z.string().optional(),
  bank_account_iban: z.string().optional(),
  bank_account_swift: z.string().optional(),
  bank_account_holder: z.string().min(2, 'Account holder name is required'),
  bank_address: z.string().optional(),
  payout_currency: z.string().min(2),
  crypto_wallet_address: z.string().optional(),
  crypto_network: z.string().optional(),
  intermediary_bank_details: z.string().optional(),
  alternative_payment_details: z.string().optional(),
});

type BankingFormValues = z.infer<typeof bankingSchema>;

export function BankingForm({ owner }: { owner: any }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showReauth, setShowReauth] = useState(false);
  const [pendingData, setPendingData] = useState<BankingFormValues | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BankingFormValues>({
    resolver: zodResolver(bankingSchema),
    defaultValues: {
      bank_name: owner?.bank_name || '',
      bank_country: owner?.bank_country || '',
      bank_account_iban: owner?.bank_account_iban || '',
      bank_account_swift: owner?.bank_account_swift || '',
      bank_account_holder: owner?.bank_account_holder || '',
      bank_address: owner?.bank_address || '',
      payout_currency: owner?.payout_currency || 'USD',
      crypto_wallet_address: owner?.crypto_wallet_address || '',
      crypto_network: owner?.crypto_network || '',
      intermediary_bank_details: owner?.intermediary_bank_details ? JSON.stringify(owner.intermediary_bank_details, null, 2) : '',
      alternative_payment_details: owner?.alternative_payment_details ? JSON.stringify(owner.alternative_payment_details, null, 2) : '',
    },
  });

  const watchCurrency = watch('payout_currency');

  // Triggered by the form submit button
  const onRequestSubmit = (data: BankingFormValues) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    
    // Validate JSON fields
    try {
      if (data.intermediary_bank_details) JSON.parse(data.intermediary_bank_details);
      if (data.alternative_payment_details) JSON.parse(data.alternative_payment_details);
    } catch (e) {
      setErrorMsg("Invalid JSON format in Intermediary or Alternative details.");
      return;
    }

    setPendingData(data);
    setShowReauth(true); // Show password confirmation modal
  };

  // Called when ReAuthDialog succeeds
  const onReauthSuccess = () => {
    setShowReauth(false);
    if (!pendingData) return;

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(pendingData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const result = await updateBankingInfo(formData);
      if (result.success) {
        setSuccessMsg('Banking details updated securely.');
      } else {
        setErrorMsg(result.error || 'Failed to update banking details.');
      }
      setPendingData(null);
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onRequestSubmit)} className="space-y-6">
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

        <div className="rounded-md bg-taksu-terracotta/10 p-3 flex gap-3 text-sm text-taksu-terracotta border border-taksu-terracotta/20">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <p>
            Please ensure all details are accurate. Errors may cause payout delays. 
            Modifications will be logged and require password confirmation.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Primary Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input id="bank_name" {...register('bank_name')} disabled={isPending} />
              {errors.bank_name && <p className="text-xs text-red-500">{errors.bank_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_country">Bank Country</Label>
              <Input id="bank_country" {...register('bank_country')} disabled={isPending} placeholder="e.g. USA" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_account_holder">Account Holder Name</Label>
              <Input id="bank_account_holder" {...register('bank_account_holder')} disabled={isPending} />
              {errors.bank_account_holder && <p className="text-xs text-red-500">{errors.bank_account_holder.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout_currency">Payout Currency</Label>
              <Select disabled={isPending} value={watchCurrency} onValueChange={(val) => setValue('payout_currency', val)}>
                <SelectTrigger id="payout_currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="IDR">IDR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_account_iban">Account Number / IBAN</Label>
              <Input id="bank_account_iban" {...register('bank_account_iban')} disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_account_swift">SWIFT / BIC Code</Label>
              <Input id="bank_account_swift" {...register('bank_account_swift')} disabled={isPending} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bank_address">Bank Address</Label>
            <Input id="bank_address" {...register('bank_address')} disabled={isPending} />
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Intermediary & Alternative Details</h3>
          <div className="space-y-1.5">
            <Label htmlFor="intermediary_bank_details">Intermediary Bank Details (JSON format)</Label>
            <Textarea 
              id="intermediary_bank_details" 
              {...register('intermediary_bank_details')} 
              disabled={isPending} 
              className="font-mono text-xs" 
              rows={4} 
              placeholder={'{\n  "bank_name": "Chase",\n  "swift": "CHASUS33"\n}'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alternative_payment_details">Wise / Payoneer Details (JSON format)</Label>
            <Textarea 
              id="alternative_payment_details" 
              {...register('alternative_payment_details')} 
              disabled={isPending} 
              className="font-mono text-xs" 
              rows={4} 
              placeholder={'{\n  "wise_email": "owner@example.com"\n}'}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-4 space-y-4">
          <h3 className="text-sm font-medium text-taksu-forest">Crypto Wallet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="crypto_wallet_address">Wallet Address</Label>
              <Input id="crypto_wallet_address" {...register('crypto_wallet_address')} disabled={isPending} placeholder="0x..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crypto_network">Network (e.g. ERC20, TRC20)</Label>
              <Input id="crypto_network" {...register('crypto_network')} disabled={isPending} />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Banking Details
        </Button>
      </form>

      {showReauth && (
        <ReAuthDialog
          actionLabel="updating your banking information"
          onSuccess={onReauthSuccess}
          onCancel={() => {
            setShowReauth(false);
            setPendingData(null);
          }}
        />
      )}
    </>
  );
}
