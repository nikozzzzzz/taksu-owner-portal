'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner } from '@/lib/auth/middleware';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ── Schemas ──────────────────────────────────────────────────────────────────

const REQUEST_CATEGORIES = [
  'personal_stay',
  'maintenance_request',
  'amenity_addition',
  'pricing_inquiry',
  'payout_inquiry',
  'document_request',
  'contract_inquiry',
  'general',
] as const;

const submitSchema = z.object({
  category: z.enum(REQUEST_CATEGORIES),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject is too long'),
  description: z
    .string()
    .min(10, 'Please provide more details in the description'),
  preferred_dates_start: z.string().optional().nullable(),
  preferred_dates_end: z.string().optional().nullable(),
});

const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment is too long'),
});

// ── Auto-priority helper ──────────────────────────────────────────────────────

function autoPriority(category: (typeof REQUEST_CATEGORIES)[number]) {
  if (category === 'maintenance_request') return 'high';
  if (category === 'payout_inquiry') return 'high';
  return 'normal';
}

// ── submitRequest ─────────────────────────────────────────────────────────────

export async function submitRequest(formData: FormData) {
  try {
    const owner = await requireOwner();
    const supabase = await createServerSupabaseClient();

    const validatedFields = submitSchema.safeParse({
      category: formData.get('category'),
      subject: formData.get('subject'),
      description: formData.get('description'),
      preferred_dates_start: formData.get('preferred_dates_start') || null,
      preferred_dates_end: formData.get('preferred_dates_end') || null,
    });

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { category, subject, description, preferred_dates_start, preferred_dates_end } =
      validatedFields.data;

    // Villa is optional — only look it up for property-specific categories
    let villaId: string | null = null;
    const propertyCategories = ['maintenance_request', 'amenity_addition', 'personal_stay'];
    if (propertyCategories.includes(category)) {
      const { data: villas } = await supabase
        .from('villas')
        .select('id')
        .eq('owner_id', owner.id)
        .limit(1);
      villaId = (villas as { id: string }[] | null)?.[0]?.id ?? null;
    }

    const { data: inserted, error: insertError } = await (
      supabase.from('owner_requests') as any
    ).insert({
      owner_id: owner.id,
      villa_id: villaId,
      category,
      subject,
      description,
      preferred_dates_start: preferred_dates_start || null,
      preferred_dates_end: preferred_dates_end || null,
      status: 'pending',
      priority: autoPriority(category),
      attachments: [],
    }).select('id').single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return { error: 'Failed to submit request. Please try again later.' };
    }

    revalidatePath('/requests');
    return { success: true, id: inserted?.id as string | undefined };
  } catch (err) {
    console.error('Error in submitRequest action:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// ── cancelRequest ─────────────────────────────────────────────────────────────

export async function cancelRequest(requestId: string) {
  try {
    const owner = await requireOwner();
    const supabase = await createServerSupabaseClient();

    // Verify ownership and current status before update
    const { data: existing, error: fetchError } = await supabase
      .from('owner_requests')
      .select('id, status, owner_id')
      .eq('id', requestId)
      .eq('owner_id', owner.id)
      .single();

    if (fetchError || !existing) {
      return { error: 'Request not found.' };
    }

    if ((existing as any).status !== 'pending') {
      return { error: 'Only pending requests can be cancelled.' };
    }

    const { error: updateError } = await (supabase.from('owner_requests') as any)
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('owner_id', owner.id);

    if (updateError) {
      console.error('Cancel error:', updateError);
      return { error: 'Failed to cancel request. Please try again.' };
    }

    revalidatePath('/requests');
    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (err) {
    console.error('Error in cancelRequest action:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

// ── addComment ────────────────────────────────────────────────────────────────

export async function addComment(requestId: string, formData: FormData) {
  try {
    const owner = await requireOwner();
    const supabase = await createServerSupabaseClient();

    const validatedFields = commentSchema.safeParse({
      content: formData.get('content'),
    });

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    // Ensure the request belongs to this owner and is not closed
    const { data: request, error: fetchError } = await supabase
      .from('owner_requests')
      .select('id, status, owner_id')
      .eq('id', requestId)
      .eq('owner_id', owner.id)
      .single();

    if (fetchError || !request) {
      return { error: 'Request not found.' };
    }

    const closedStatuses = ['completed', 'rejected', 'cancelled'];
    if (closedStatuses.includes((request as any).status)) {
      return { error: 'Cannot comment on a closed request.' };
    }

    const { error: insertError } = await (supabase.from('request_comments') as any).insert({
      request_id: requestId,
      author_type: 'owner',
      author_id: owner.id,
      content: validatedFields.data.content,
      attachments: [],
    });

    if (insertError) {
      console.error('Comment insert error:', insertError);
      return { error: 'Failed to post comment. Please try again.' };
    }

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (err) {
    console.error('Error in addComment action:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
