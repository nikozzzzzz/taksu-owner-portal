import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FolderOpen, Download, FileText, Calendar, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Documents | Taksu Owner Portal',
  description: 'View and download your agreements, contracts, and other documents.',
};

export default async function DocumentsPage() {
  const owner = await requireOwner();
  const supabase = await createServerSupabaseClient();

  const { data: documentsData, error } = await supabase
    .from('owner_documents')
    .select('*')
    .eq('owner_id', owner.id)
    .eq('visible_to_owner', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  const documents = (documentsData || []) as any[];

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'management_agreement':
        return 'Management Agreement';
      case 'dgt1':
        return 'DGT-1 Form';
      case 'bukti_potong_pph26':
        return 'Bukti Potong PPh 26';
      case 'monthly_statement':
        return 'Monthly Statement';
      case 'annual_tax_summary':
        return 'Annual Tax Summary';
      case 'property_insurance':
        return 'Property Insurance';
      case 'leasehold_agreement':
        return 'Leasehold Agreement';
      case 'pbg_certificate':
        return 'PBG Certificate';
      case 'slf_certificate':
        return 'SLF Certificate';
      case 'tdup_license':
        return 'TDUP License';
      default:
        return 'Other Document';
    }
  };

  const getDocTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'management_agreement':
      case 'leasehold_agreement':
        return 'bg-taksu-bamboo/10 text-taksu-jungle';
      case 'dgt1':
      case 'bukti_potong_pph26':
      case 'annual_tax_summary':
        return 'bg-blue-100 text-blue-800';
      case 'property_insurance':
        return 'bg-amber-100 text-amber-800';
      case 'pbg_certificate':
      case 'slf_certificate':
      case 'tdup_license':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-taksu-bamboo" />
          My Documents
        </h1>
        <p className="portal-page-subtitle">
          Access your management agreements, signing contracts, and official files.
        </p>
      </div>

      <div className="mt-8 max-w-5xl">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            <span>Failed to load documents. Please try again later or contact support.</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              There are no shared documents available for your account at this time. Signed agreements will appear here once processed.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-gray-500">
                <thead className="bg-gray-50/75 border-b border-border text-xs font-semibold uppercase tracking-wider text-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-4">Document Name</th>
                    <th scope="col" className="px-6 py-4">Type</th>
                    <th scope="col" className="px-6 py-4">Upload Date</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-taksu-sage shrink-0" />
                          <div>
                            <span className="block font-medium text-taksu-forest">{doc.title}</span>
                            {doc.description && (
                              <span className="block text-xs text-gray-400 mt-0.5">{doc.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
                          getDocTypeBadgeClass(doc.document_type)
                        )}>
                          {getDocTypeLabel(doc.document_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-taksu-jungle hover:text-taksu-bamboo transition-colors"
                        >
                          <Download className="h-4 w-4" /> Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
