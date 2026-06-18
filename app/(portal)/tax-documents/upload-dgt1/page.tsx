import type { Metadata } from 'next';
import { Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Dgt1UploadForm } from '@/components/tax/dgt1-upload-form';

export const metadata: Metadata = {
  title: 'Upload DGT-1',
  description: 'Upload your renewed DGT-1 tax form',
};

export default function Dgt1UploadPage() {
  return (
    <div className="portal-page animate-in max-w-3xl mx-auto">
      <Link href="/tax-documents" className="inline-flex items-center text-sm text-taksu-sage hover:text-taksu-forest mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Tax Documents
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="p-3 bg-taksu-jungle/10 rounded-full">
            <Upload className="h-6 w-6 text-taksu-jungle" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-taksu-forest">Upload Renewal DGT-1</h1>
            <p className="text-taksu-sage mt-1">
              Ensure you have the latest stamped form from your local tax authority.
            </p>
          </div>
        </div>

        <Dgt1UploadForm />
        
        <div className="mt-8 pt-6 border-t border-border/50 text-sm text-taksu-sage">
          <p>
            <strong>Note:</strong> After uploading, your document will be manually reviewed by our finance team to ensure it meets DGT requirements. Your withholding rate will be updated once the document is verified.
          </p>
        </div>
      </div>
    </div>
  );
}
