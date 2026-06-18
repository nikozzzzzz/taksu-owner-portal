import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO, format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

interface Dgt1StatusCardProps {
  status: string;
  validUntil: string | null;
  rate: number;
}

export function Dgt1StatusCard({ status, validUntil, rate }: Dgt1StatusCardProps) {
  let daysRemaining = 0;
  let urgency: 'green' | 'yellow' | 'red' = 'red';
  let statusText = 'Missing or Expired';
  let Icon = AlertCircle;

  if (status === 'pending_review') {
    urgency = 'yellow';
    statusText = 'Under Review by Admin';
    Icon = Clock;
  } else if (status === 'valid' && validUntil) {
    daysRemaining = differenceInDays(parseISO(validUntil), new Date());
    if (daysRemaining > 90) {
      urgency = 'green';
      statusText = 'Valid & Active';
      Icon = CheckCircle2;
    } else if (daysRemaining > 0) {
      urgency = 'yellow';
      statusText = 'Expiring Soon';
      Icon = Clock;
    } else {
      urgency = 'red';
      statusText = 'Expired';
      Icon = AlertCircle;
    }
  }

  const urgencyColors = {
    green: 'bg-taksu-jungle/10 text-taksu-jungle border-taksu-jungle/20',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-taksu-terracotta/10 text-taksu-terracotta border-taksu-terracotta/20',
  };

  const currentTaxRate = urgency === 'red' && status !== 'pending_review' ? 0.20 : rate;
  const standardRate = 0.20;
  const taxSavings = standardRate - currentTaxRate;

  return (
    <Card className="overflow-hidden border-border">
      <div className={`p-4 sm:p-6 border-b ${urgencyColors[urgency]} border-b-2`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white/50 backdrop-blur-sm`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold">DGT-1 Form Status</h2>
              <p className="text-sm font-medium opacity-90">{statusText}</p>
            </div>
          </div>
          
          {(urgency === 'red' || urgency === 'yellow') && status !== 'pending_review' && (
            <Button asChild className="shrink-0 bg-taksu-forest hover:bg-taksu-jungle">
              <Link href="/tax-documents/upload-dgt1">
                <Upload className="h-4 w-4 mr-2" />
                Upload Renewal
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-taksu-sage">Valid Until</p>
            <p className="font-semibold text-taksu-forest">
              {validUntil ? format(parseISO(validUntil), 'MMM d, yyyy') : 'N/A'}
            </p>
            {validUntil && daysRemaining > 0 && (
              <p className="text-xs text-taksu-sage">{daysRemaining} days remaining</p>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-taksu-sage">Current Withholding Rate</p>
            <p className="font-semibold text-taksu-forest">
              {(currentTaxRate * 100).toFixed(1)}%
            </p>
            {taxSavings > 0 && (
              <p className="text-xs text-taksu-jungle font-medium">
                You are saving {(taxSavings * 100).toFixed(1)}% per payout
              </p>
            )}
          </div>

          <div className="space-y-1 sm:text-right flex flex-col sm:items-end justify-center">
             <Link href="/tax-documents/guide" className="inline-flex items-center text-sm text-taksu-jungle hover:underline">
               <FileText className="h-4 w-4 mr-1" />
               DGT-1 Explainer Guide
             </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
