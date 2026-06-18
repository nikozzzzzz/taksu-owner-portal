'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const requestSchema = z.object({
  category: z.enum(['personal_stay', 'maintenance_request', 'general_inquiry', 'financial_inquiry']),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject is too long'),
  description: z.string().min(10, 'Please provide more details in the description'),
});

export async function submitRequest(formData: FormData) {
  try {
    const owner = await requireOwner();
    const supabase = await createServerSupabaseClient();

    // Find the owner's primary villa to associate the request with
    const { data: villas } = await supabase
      .from('villas')
      .select('id')
      .eq('owner_id', owner.id)
      .limit(1);

    const villaId = (villas as any[])?.[0]?.id;
    if (!villaId) {
      return { error: 'No associated property found to submit request for.' };
    }

    // Validate inputs
    const validatedFields = requestSchema.safeParse({
      category: formData.get('category'),
      subject: formData.get('subject'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { category, subject, description } = validatedFields.data;

    const { error: insertError } = await (supabase.from('owner_requests') as any)
      .insert({
        owner_id: owner.id,
        villa_id: villaId,
        category,
        subject,
        description,
        status: 'pending',
        priority: category === 'maintenance_request' ? 'high' : 'normal'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { error: 'Failed to submit request. Please try again later.' };
    }

    // Revalidate the requests page
    revalidatePath('/requests');
    return { success: true };

  } catch (err) {
    console.error('Error in submitRequest action:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
