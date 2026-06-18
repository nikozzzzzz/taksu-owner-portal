import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { getTaxDocuments, getDgt1Status } from '@/lib/data/tax-data';
import { FileArchive, Info } from 'lucide-react';
import { Dgt1StatusCard } from '@/components/tax/dgt1-status-card';
import { BuktiPotongTable } from '@/components/tax/bukti-potong-table';
import { AnnualSummary } from '@/components/tax/annual-summary';

export const metadata: Metadata = {
  title: 'Tax Documents',
  description: 'Manage your DGT-1 form and download Bukti Potong PPh 26 slips',
};

export default async function TaxDocumentsPage() {
  const owner = await requireOwner();
  
  // Parallel fetch
  const [dgt1Status, documents] = await Promise.all([
    getDgt1Status(owner.id),
    getTaxDocuments(owner.id),
  ]);

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <FileArchive className="h-6 w-6 text-taksu-bamboo" />
          Tax Compliance
        </h1>
        <p className="portal-page-subtitle">
          Manage your DGT-1 form to reduce tax withholding and access your historical Bukti Potong slips.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left Column: DGT-1 Status & Annual Summary */}
        <div className="space-y-6 lg:col-span-1">
          <Dgt1StatusCard 
            status={dgt1Status.status} 
            validUntil={dgt1Status.validUntil} 
            rate={dgt1Status.rate} 
          />
          
          <AnnualSummary documents={documents} />

          <div className="rounded-xl border border-border bg-white p-5">
            <h3 className="font-semibold text-taksu-forest flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-taksu-bamboo" />
              What is a Bukti Potong?
            </h3>
            <p className="text-sm text-taksu-sage mb-3">
              Bukti Potong PPh 26 is the official Indonesian tax withholding slip. It proves that PT Taksu Living Management has withheld and paid taxes on your behalf.
            </p>
            <p className="text-sm text-taksu-sage">
              You can use these documents to claim tax credits in your country of tax residence, preventing double taxation.
            </p>
          </div>
        </div>

        {/* Right Column: Documents Table */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="font-serif text-xl font-semibold text-taksu-forest">Historical Tax Slips</h2>
            <p className="text-sm text-taksu-sage">Your official Bukti Potong documents, available monthly after processing.</p>
          </div>
          
          <BuktiPotongTable documents={documents} />
        </div>
      </div>
    </div>
  );
}
