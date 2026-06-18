'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ─── Schemas ────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    rememberMe: formData.get('rememberMe') === 'true',
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password format.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
      return { success: false, error: 'Incorrect email or password. Please try again.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Please verify your email address before signing in.' };
    }
    return { success: false, error: error.message };
  }

  // Log audit event
  await logAuthEvent('LOGIN_SUCCESS', parsed.data.email);

  redirect('/dashboard');
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    await logAuthEvent('LOGOUT', user.email);
  }

  await supabase.auth.signOut();
  redirect('/login');
}

// ─── Reset Password Request ──────────────────────────────────────────────────

export async function resetPasswordRequestAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get('email') as string };
  const parsed = resetPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Don't reveal if email exists
  return { success: true };
}

// ─── Update Password (from reset link) ──────────────────────────────────────

export async function updatePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = { password: formData.get('password') as string };
  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuthEvent('PASSWORD_CHANGED');
  redirect('/dashboard');
}

// ─── Verify Re-Auth ──────────────────────────────────────────────────────────

export async function verifyReAuthAction(password: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: 'Not authenticated.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (error) {
    return { success: false, error: 'Incorrect password.' };
  }

  return { success: true };
}

// ─── Setup Account (from invitation) ────────────────────────────────────────

export async function setupAccountAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect('/dashboard');
}

// ─── Audit Helper ────────────────────────────────────────────────────────────

async function logAuthEvent(action: string, email?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get owner ID
    const { data: owner } = await supabase
      .from('owners')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!owner) return;

    await (supabase.from('owner_portal_audit') as any).insert({
      owner_id: (owner as any).id,
      action,
      entity_type: 'auth',
      success: true,
    });

    // Update last_login_at on login
    if (action === 'LOGIN_SUCCESS') {
      await (supabase.from('owners') as any)
        .update({
          last_login_at: new Date().toISOString(),
        })
        .eq('id', (owner as any).id);
    }
  } catch {
    // Don't fail auth flow on audit error
  }
}
