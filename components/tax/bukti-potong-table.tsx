'use client';

import { format, parseISO } from 'date-fns';
import { Download, FileArchive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import type { TaxDocumentRow } from '@/lib/data/tax-data';

interface BuktiPotongTableProps {
  documents: TaxDocumentRow[];
}

export function BuktiPotongTable({ documents }: BuktiPotongTableProps) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-taksu-parchment">
            <FileArchive className="h-6 w-6 text-taksu-sage" />
          </div>
          <h3 className="font-medium text-taksu-forest">No Tax Documents Found</h3>
          <p className="mt-1 text-sm text-taksu-sage">
            Bukti Potong PPh 26 slips will appear here once statements are processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-taksu-cream text-taksu-sage">
              <tr>
                <th className="px-4 py-3 font-medium">Tax Period</th>
                <th className="px-4 py-3 font-medium">Gross Revenue</th>
                <th className="px-4 py-3 font-medium">Gross Payout</th>
                <th className="px-4 py-3 font-medium">Tax Withheld (PPh 26)</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => {
                const date = parseISO(doc.billing_month);
                const period = format(date, 'MMMM yyyy');
                const hasPdf = !!doc.bukti_potong_pdf_url; // Assuming this flag indicates generation readiness

                return (
                  <tr key={doc.id} className="transition-colors hover:bg-taksu-cream/50">
                    <td className="px-4 py-3 font-medium text-taksu-forest">{period}</td>
                    <td className="px-4 py-3 tabular-nums text-taksu-sage">
                      {formatCurrency(doc.gross_revenue_usd)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-taksu-sage">
                      {formatCurrency(doc.owner_gross_payout_usd)}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-taksu-terracotta">
                      {formatCurrency(doc.pph26_amount_usd)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* For MVP, we route directly to the PDF API endpoint created in Phase 4 */}
                      <a
                        href={`/api/tax/bukti-potong/${doc.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-taksu-jungle hover:underline"
                        title="Download Bukti Potong PDF"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
