'use server';

import { getAuthUser } from '@/lib/auth/middleware';
import { beds24Client } from '@/lib/beds24/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata.role)) {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function connectBeds24(inviteCode: string) {
  await requireAdmin();
  
  if (!inviteCode) {
    throw new Error('Invite code is required');
  }

  try {
    const success = await beds24Client.setupConnection(inviteCode);
    if (!success) {
      throw new Error('Failed to connect to Beds24 API');
    }
    return { success: true };
  } catch (error: any) {
    console.error('Beds24 connection error:', error);
    return { success: false, error: error.message };
  }
}

export async function getBeds24Status() {
  await requireAdmin();
  const supabase = (await createServerSupabaseClient()) as any;
  const { data } = await supabase.from('beds24_credentials').select('updated_at').limit(1).single();
  
  return {
    connected: !!data,
    lastConnected: data?.updated_at || null
  };
}

export async function syncProperties() {
  await requireAdmin();
  
  try {
    const properties = await beds24Client.getProperties();
    // Later we can implement actual DB sync mapping
    // For now we just return them for the UI to display
    return { success: true, data: properties };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
