'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getOwnerProfile() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: owner } = await supabase
    .from('owners')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  return owner;
}

export async function updateProfileInfo(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const payload = {
    full_name: formData.get('full_name') as string,
    date_of_birth: formData.get('date_of_birth') as string || null,
    citizenship: formData.get('citizenship') as string || null,
    country_of_residence: formData.get('country_of_residence') as string || null,
    passport_number: formData.get('passport_number') as string || null,
    passport_issue_date: formData.get('passport_issue_date') as string || null,
    passport_expiry_date: formData.get('passport_expiry_date') as string || null,
    registration_address: formData.get('registration_address') as string || null,
    actual_address: formData.get('actual_address') as string || null,
    phone_whatsapp: formData.get('phone_whatsapp') as string || null,
    phone_telegram: formData.get('phone_telegram') as string || null,
  };

  const { data: owner } = await supabase.from('owners').select('id').eq('auth_user_id', user.id).single();
  if (!owner) return { success: false, error: 'Owner not found' };

  const { error } = await (supabase.from('owners') as any).update(payload).eq('id', (owner as any).id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateTaxInfo(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const payload = {
    tin_number: formData.get('tin_number') as string || null,
    p3b_treaty_number: formData.get('p3b_treaty_number') as string || null,
  };

  const { data: owner } = await supabase.from('owners').select('id').eq('auth_user_id', user.id).single();
  if (!owner) return { success: false, error: 'Owner not found' };

  const { error } = await (supabase.from('owners') as any).update(payload).eq('id', (owner as any).id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const payload = {
    preferred_language: (formData.get('preferred_language') as string) || 'en',
    statement_language: (formData.get('statement_language') as string) || 'en',
    statement_email: formData.get('statement_email') as string || null,
    report_frequency: (formData.get('report_frequency') as string) || 'monthly',
    booking_notifications_enabled: formData.get('booking_notifications_enabled') === 'true',
    dgt1_notifications_enabled: formData.get('dgt1_notifications_enabled') === 'true',
  };

  const { data: owner } = await supabase.from('owners').select('id').eq('auth_user_id', user.id).single();
  if (!owner) return { success: false, error: 'Owner not found' };

  const { error } = await (supabase.from('owners') as any).update(payload).eq('id', (owner as any).id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function updateBankingInfo(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  let intermediary_bank_details = null;
  let alternative_payment_details = null;

  try {
    const inter = formData.get('intermediary_bank_details') as string;
    if (inter) intermediary_bank_details = JSON.parse(inter);
  } catch(e) {}
  
  try {
    const alt = formData.get('alternative_payment_details') as string;
    if (alt) alternative_payment_details = JSON.parse(alt);
  } catch(e) {}

  const payload = {
    bank_name: formData.get('bank_name') as string || null,
    bank_account_iban: formData.get('bank_account_iban') as string || null,
    bank_account_swift: formData.get('bank_account_swift') as string || null,
    bank_account_holder: formData.get('bank_account_holder') as string || null,
    bank_country: formData.get('bank_country') as string || null,
    bank_address: formData.get('bank_address') as string || null,
    payout_currency: formData.get('payout_currency') as string || 'USD',
    crypto_wallet_address: formData.get('crypto_wallet_address') as string || null,
    crypto_network: formData.get('crypto_network') as string || null,
    intermediary_bank_details,
    alternative_payment_details,
    banking_last_changed_at: new Date().toISOString(),
    banking_last_changed_by_id: user.id,
  };

  const { data: owner } = await supabase.from('owners').select('id').eq('auth_user_id', user.id).single();
  if (!owner) return { success: false, error: 'Owner not found' };

  const { error } = await (supabase.from('owners') as any).update(payload).eq('id', (owner as any).id);

  if (error) return { success: false, error: error.message };

  await (supabase.from('owner_portal_audit') as any).insert({
    owner_id: (owner as any).id,
    action: 'BANKING_INFO_UPDATED',
    entity_type: 'owner',
    entity_id: (owner as any).id,
    success: true,
  });

  revalidatePath('/settings');
  return { success: true };
}
