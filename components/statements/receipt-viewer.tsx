'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptViewerProps {
  receiptUrl: string;
  vendorName?: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptViewer({ receiptUrl, vendorName, description, open, onOpenChange }: ReceiptViewerProps) {
  const [loading, setLoading] = useState(true);
  const isPdf = receiptUrl.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-taksu-cream border-border">
        <DialogTitle className="sr-only">Receipt Viewer</DialogTitle>
        <div className="flex flex-col h-[80vh] max-h-[800px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-taksu-parchment">
                <FileText className="h-5 w-5 text-taksu-sage" />
              </div>
              <div>
                <p className="font-semibold text-taksu-forest">{vendorName || 'Receipt'}</p>
                <p className="text-sm text-taksu-sage">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5 text-taksu-sage" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto bg-black/5 p-4 flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${receiptUrl}#view=FitH`}
                className="w-full h-full rounded-md shadow-sm border border-border"
                title="Receipt PDF"
                onLoad={() => setLoading(false)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiptUrl}
                alt={`Receipt for ${description}`}
                className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                onLoad={() => setLoading(false)}
              />
            )}
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taksu-jungle"></div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
