'use client';

import { useState } from 'react';
import { Download, FileText, Table, FileArchive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReAuthDialog } from '@/components/auth/reauth-dialog';

interface StatementDownloadButtonsProps {
  statementId: string;
  monthName: string;
  hasBuktiPotong: boolean;
}

export function StatementDownloadButtons({ statementId, monthName, hasBuktiPotong }: StatementDownloadButtonsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showReAuth, setShowReAuth] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<string | null>(null);

  const handleDownload = async (type: string) => {
    // For MVP we just use direct links, but in real app we'd fetch via API
    setDownloading(type);
    
    try {
      if (type === 'pdf') {
        window.open(`/api/statements/${statementId}/pdf`, '_blank');
      } else if (type === 'excel') {
        window.open(`/api/statements/${statementId}/excel`, '_blank');
      } else if (type === 'bukti-potong') {
        window.open(`/api/tax/bukti-potong/${statementId}/pdf`, '_blank');
      }
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const initiateDownload = (type: string) => {
    // In a real app, we might require re-auth for bulk or specific downloads
    // For this MVP we just download directly
    handleDownload(type);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={() => initiateDownload('pdf')}
          disabled={downloading !== null}
          className="flex-1 sm:flex-none"
        >
          {downloading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Statement PDF
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => initiateDownload('excel')}
          disabled={downloading !== null}
          className="flex-1 sm:flex-none"
        >
          {downloading === 'excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Table className="mr-2 h-4 w-4" />}
          Export Excel
        </Button>
        
        {hasBuktiPotong && (
          <Button 
            variant="outline" 
            onClick={() => initiateDownload('bukti-potong')}
            disabled={downloading !== null}
            className="flex-1 sm:flex-none"
          >
            {downloading === 'bukti-potong' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileArchive className="mr-2 h-4 w-4" />}
            Bukti Potong PPh 26
          </Button>
        )}
      </div>

      {showReAuth && (
        <ReAuthDialog
          actionLabel={`downloading ${pendingDownload} document`}
          onSuccess={() => {
            setShowReAuth(false);
            if (pendingDownload) handleDownload(pendingDownload);
            setPendingDownload(null);
          }}
          onCancel={() => {
            setShowReAuth(false);
            setPendingDownload(null);
          }}
        />
      )}
    </>
  );
}
