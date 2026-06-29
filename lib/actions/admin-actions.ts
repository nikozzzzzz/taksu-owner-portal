'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireOwner, getAuthUser } from '@/lib/auth/middleware';
import { revalidatePath } from 'next/cache';

// Admin permission check helper
async function requireAdmin() {
  const user = await getAuthUser();
  const role = user?.app_metadata?.role || 'guest';
  if (!['admin', 'root'].includes(role)) {
    throw new Error('Unauthorized');
  }
  return { user, role };
}

// ─── User Actions ────────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: string) {
  const { role } = await requireAdmin();
  const supabase = await createServerSupabaseClient();
  
  // Protect root users from being modified by normal admins
  if (role === 'admin') {
    const { data: targetUser }: { data: any } = await supabase
      .from('owners')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (targetUser?.role === 'root') {
      throw new Error('Admins cannot modify root users.');
    }
  }
  
  const { error } = await (supabase as any)
    .from('owners')
    .update({ role: newRole as any })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserStatus(userId: string, newStatus: string) {
  const { role } = await requireAdmin();
  const supabase = await createServerSupabaseClient();
  
  // Protect root users
  if (role === 'admin') {
    const { data: targetUser }: { data: any } = await supabase
      .from('owners')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (targetUser?.role === 'root') {
      throw new Error('Admins cannot modify root users.');
    }
  }

  const { error } = await (supabase as any)
    .from('owners')
    .update({ status: newStatus as any })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

// ─── Villa Actions ───────────────────────────────────────────────────────────

import { villaSchema } from '@/lib/validations/villa';
import { agreementSchema } from '@/lib/validations/agreements';

export async function upsertVilla(payload: any) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // Extract agreement data and clean up payload
  const {
    agreement_id,
    hak_sewa_number,
    hak_sewa_start_date,
    hak_sewa_end_date,
    annual_rent_amount,
    management_agreement_number,
    ma_signed_date,
    ma_term_months,
    pbb_tax_amount,
    ...villaData
  } = payload;

  // Validate Villa Data
  const parsedVilla = villaSchema.safeParse(villaData);
  if (!parsedVilla.success) {
    throw new Error('Invalid villa data: ' + parsedVilla.error.errors.map(e => e.message).join(', '));
  }

  // 1. Upsert Villa
  const { data: savedVilla, error: villaError } = await (supabase as any)
    .from('villas')
    .upsert({ id: villaData.id, ...parsedVilla.data })
    .select('id')
    .single();

  if (villaError) throw new Error(villaError.message);

  // 2. Upsert Agreement (if owner is assigned and agreement data is provided)
  // We check if at least one key agreement field is provided to trigger agreement creation
  if (parsedVilla.data.owner_id && (hak_sewa_number || management_agreement_number || hak_sewa_start_date)) {
    const agreementPayload = {
      villa_id: savedVilla.id,
      owner_id: parsedVilla.data.owner_id,
      hak_sewa_number: hak_sewa_number || null,
      hak_sewa_start_date: hak_sewa_start_date || null,
      hak_sewa_end_date: hak_sewa_end_date || null,
      annual_rent_amount: annual_rent_amount ? Number(annual_rent_amount) : null,
      management_agreement_number: management_agreement_number || null,
      ma_signed_date: ma_signed_date || null,
      ma_term_months: ma_term_months ? Number(ma_term_months) : null,
      pbb_tax_amount: pbb_tax_amount ? Number(pbb_tax_amount) : null,
    };

    const parsedAgreement = agreementSchema.safeParse(agreementPayload);
    if (!parsedAgreement.success) {
      throw new Error('Invalid agreement data: ' + parsedAgreement.error.errors.map(e => e.message).join(', '));
    }

    const { error: agreementError } = await (supabase as any)
      .from('villa_agreements')
      .upsert({
        ...(agreement_id ? { id: agreement_id } : {}),
        ...parsedAgreement.data
      });

    if (agreementError) throw new Error(agreementError.message);
  }

  revalidatePath('/admin/villas');
  return { success: true };
}

// ─── Request Actions ─────────────────────────────────────────────────────────

export async function updateRequestStatus(requestId: string, newStatus: string) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await (supabase as any)
    .from('owner_requests')
    .update({ status: newStatus as any })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  revalidatePath('/requests');
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}
