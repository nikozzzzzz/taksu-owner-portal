'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { ReceiptViewer } from './receipt-viewer';
import type { Database } from '@/lib/supabase/types';

type ExpenseRow = Database['public']['Tables']['operating_expenses']['Row'];

interface ExpenseCategoryProps {
  title: string;
  amount: number;
  expenses: ExpenseRow[];
}

export function ExpenseCategory({ title, amount, expenses }: ExpenseCategoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ExpenseRow | null>(null);

  if (expenses.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-taksu-cream/50 px-2 rounded-md"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-taksu-sage" />
          ) : (
            <ChevronRight className="h-4 w-4 text-taksu-sage" />
          )}
          <span className="font-medium text-taksu-forest capitalize">{title.replace(/_/g, ' ')}</span>
          <span className="rounded-full bg-taksu-parchment px-2 py-0.5 text-[10px] font-medium text-taksu-sage">
            {expenses.length} item{expenses.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="font-semibold text-taksu-forest">{formatCurrency(amount)}</span>
      </button>

      {expanded && (
        <div className="pb-3 pl-8 pr-2 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-start justify-between py-1.5 group">
              <div className="space-y-0.5">
                <p className="text-sm text-taksu-forest">{expense.description}</p>
                {expense.vendor_name && (
                  <p className="text-xs text-taksu-sage">Vendor: {expense.vendor_name}</p>
                )}
                
                {expense.receipt_urls && expense.receipt_urls.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReceipt(expense);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-taksu-jungle hover:underline mt-1"
                  >
                    <FileText className="h-3 w-3" />
                    View Receipt
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-taksu-forest tabular-nums">
                  {formatCurrency(expense.amount_usd)}
                </p>
                {expense.amount_idr && expense.fx_rate && (
                  <p className="text-[10px] text-taksu-sage tabular-nums" title={`FX Rate: ${expense.fx_rate}`}>
                    IDR {(expense.amount_idr).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeReceipt && activeReceipt.receipt_urls && activeReceipt.receipt_urls[0] && (
        <ReceiptViewer
          open={!!activeReceipt}
          onOpenChange={(open) => !open && setActiveReceipt(null)}
          receiptUrl={activeReceipt.receipt_urls[0]}
          vendorName={activeReceipt.vendor_name || 'Receipt'}
          description={activeReceipt.description}
        />
      )}
    </div>
  );
}
