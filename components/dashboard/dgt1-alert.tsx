import { AlertTriangle, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/utils/currency';
import { formatDateShort } from '@/lib/utils/dates';

interface Dgt1AlertProps {
  data: {
    status: 'valid' | 'expired' | 'pending_review' | 'none';
    valid_until: string | null;
    days_to_expire: number | null;
    current_rate: number;
    savings_if_renewed: number;
  };
}

export function Dgt1Alert({ data }: Dgt1AlertProps) {
  const { status, valid_until, days_to_expire, current_rate, savings_if_renewed } = data;

  // Don't show if DGT-1 is valid and not expiring soon
  if (status === 'valid' && (days_to_expire === null || days_to_expire > 90)) {
    return null;
  }

  const isExpiringSoon = status === 'valid' && days_to_expire !== null && days_to_expire <= 90;
  const isExpired = status === 'expired';
  const isNone = status === 'none';
  const isPendingReview = status === 'pending_review';

  let borderColor = 'border-amber-200';
  let bgColor = 'bg-amber-50';
  let Icon = AlertTriangle;
  let iconColor = 'text-amber-600';
  let title = '';
  let description = '';

  if (isExpired || isNone) {
    borderColor = 'border-red-200';
    bgColor = 'bg-red-50';
    Icon = XCircle;
    iconColor = 'text-red-500';
    title = isExpired ? 'DGT-1 Form Has Expired' : 'DGT-1 Form Not Uploaded';
    description = `You are currently paying ${formatPercent(current_rate)} PPh 26 withholding tax.`;
  } else if (isExpiringSoon) {
    title = `DGT-1 Expiring in ${days_to_expire} Days`;
    description = `Valid until ${valid_until ? formatDateShort(valid_until) : '—'}.`;
  } else if (isPendingReview) {
    borderColor = 'border-sky-200';
    bgColor = 'bg-sky-50';
    Icon = Clock;
    iconColor = 'text-sky-500';
    title = 'DGT-1 Under Review';
    description = 'Your uploaded form is being reviewed by our team. We\'ll notify you once processed.';
  }

  return (
    <Card className={`border ${borderColor} ${bgColor} col-span-full`}>
      <CardContent className="flex items-start gap-4 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-taksu-forest">{title}</p>
          <p className="mt-0.5 text-sm text-taksu-sage">{description}</p>

          {(isExpired || isNone || isExpiringSoon) && savings_if_renewed > 0 && (
            <p className="mt-1 text-sm font-medium text-taksu-jungle">
              💰 Upload DGT-1 to save ~{formatCurrency(savings_if_renewed)}/month
            </p>
          )}
        </div>

        {!isPendingReview && (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/tax-documents/upload-dgt1">
              {isExpiringSoon ? 'Renew' : 'Upload'}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
