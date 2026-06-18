'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadDgt1 } from '@/lib/actions/dgt1-actions';

export function Dgt1UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setError('Please upload a PDF document.');
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError('File must be smaller than 5MB.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      if (selected.type !== 'application/pdf') {
        setError('Please upload a PDF document.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }
    if (!expiryDate) {
      setError('Please select an expiry date.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryDate', expiryDate);

    try {
      const result = await uploadDgt1(formData);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(true);
        // Redirect after short delay
        setTimeout(() => {
          router.push('/tax-documents');
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in">
        <div className="p-3 bg-taksu-jungle/10 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-taksu-jungle" />
        </div>
        <h3 className="font-serif text-2xl text-taksu-forest">Upload Successful</h3>
        <p className="text-taksu-sage">
          Your DGT-1 document has been submitted for review. Returning to dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-md bg-taksu-terracotta/10 border border-taksu-terracotta/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-taksu-terracotta shrink-0 mt-0.5" />
          <p className="text-sm text-taksu-terracotta">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-taksu-forest">1. Upload PDF Document</Label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${file ? 'border-taksu-jungle bg-taksu-jungle/5' : 'border-border hover:border-taksu-sage/50 hover:bg-taksu-cream/50'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileChange}
          />
          
          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <FileType className="h-10 w-10 text-taksu-jungle" />
              <p className="text-sm font-medium text-taksu-forest">{file.name}</p>
              <p className="text-xs text-taksu-sage">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <Button type="button" variant="link" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <UploadCloud className="h-10 w-10 text-taksu-sage" />
              <p className="text-sm font-medium text-taksu-forest">Click to upload or drag and drop</p>
              <p className="text-xs text-taksu-sage">PDF up to 5MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate" className="text-taksu-forest">2. Set Expiry Date</Label>
        <p className="text-xs text-taksu-sage pb-1">
          Enter the validity end date printed on your DGT-1 form.
        </p>
        <Input 
          type="date" 
          id="expiryDate"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
          className="w-full sm:max-w-xs focus-visible:ring-taksu-jungle"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full sm:w-auto bg-taksu-forest hover:bg-taksu-jungle" 
        disabled={!file || !expiryDate || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Submit Document'}
      </Button>
    </form>
  );
}
