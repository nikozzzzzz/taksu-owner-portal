'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const uploadSchema = z.object({
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

export async function uploadDgt1(formData: FormData) {
  try {
    const owner = await requireOwner();
    const supabase = await createServerSupabaseClient();
    
    // Validate file
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { error: 'No file uploaded' };
    }
    
    if (file.type !== 'application/pdf') {
      return { error: 'Only PDF files are allowed' };
    }
    
    // Validate max size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'File size must be less than 5MB' };
    }

    // Validate form inputs
    const validatedFields = uploadSchema.safeParse({
      expiryDate: formData.get('expiryDate'),
    });

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { expiryDate } = validatedFields.data;

    // 1. Upload to Storage
    const timestamp = Date.now();
    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `dgt1/${owner.id}/${timestamp}_${safeName}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('owner_documents') // Assuming bucket is owner_documents
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: 'Failed to upload document to storage' };
    }
    
    // Get public URL (or signed URL depending on bucket privacy. Assuming public or accessible via portal for MVP)
    const { data: { publicUrl } } = supabase.storage
      .from('owner_documents')
      .getPublicUrl(filePath);

    // 2. Update Owner Record
    const { error: updateError } = await supabase
      .from('owners')
      // @ts-ignore
      .update({
        dgt1_document_url: publicUrl,
        dgt1_valid_until: expiryDate,
        dgt1_status: 'pending_review',
        dgt1_uploaded_at: new Date().toISOString()
      })
      .eq('id', owner.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return { error: 'Failed to update owner record' };
    }
    
    // 3. Log Audit
    await supabase.from('owner_portal_audit').insert({
      owner_id: owner.id,
      action: 'uploaded_dgt1',
      entity_type: 'owners',
      entity_id: owner.id,
      changes: { new_expiry: expiryDate, status: 'pending_review' },
      success: true
    });

    revalidatePath('/tax-documents');
    return { success: true };

  } catch (err) {
    console.error('Error in uploadDgt1 action:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
