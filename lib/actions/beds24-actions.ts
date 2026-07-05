'use server';

import { getAuthUser } from '@/lib/auth/middleware';
import {
  setupBeds24Connection,
  getBeds24Properties,
  getBeds24Rooms,
} from '@/lib/beds24/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata?.role)) {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function connectBeds24(inviteCode: string) {
  await requireAdmin();

  const trimmedCode = (inviteCode || '').trim();
  if (!trimmedCode) {
    return { success: false, error: 'Invite code is required' };
  }

  try {
    await setupBeds24Connection(trimmedCode);
    return { success: true };
  } catch (error: any) {
    console.error('[beds24-actions] connectBeds24 error:', error);
    return { success: false, error: error.message };
  }
}

export async function getBeds24Status() {
  await requireAdmin();
  const supabase = (await createServerSupabaseClient()) as any;
  const { data } = await supabase
    .from('beds24_credentials')
    .select('updated_at, last_sync_at')
    .limit(1)
    .single();

  return {
    connected: !!data,
    lastConnected: data?.last_sync_at || data?.updated_at || null,
  };
}

/**
 * Fetch all Beds24 properties and persist mappings back to villas table.
 * Admins can use the returned list to assign property/room IDs to villas via the UI.
 */
export async function syncBeds24Properties() {
  await requireAdmin();

  try {
    const properties = await getBeds24Properties();
    return { success: true, data: properties };
  } catch (error: any) {
    console.error('[beds24-actions] syncBeds24Properties error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch rooms for a specific Beds24 property.
 */
export async function syncBeds24Rooms(propertyId: number) {
  await requireAdmin();

  try {
    const rooms = await getBeds24Rooms(propertyId);
    return { success: true, data: rooms };
  } catch (error: any) {
    console.error('[beds24-actions] syncBeds24Rooms error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map a Taksu villa to a Beds24 property and room.
 * This is the key step that enables two-way sync for that villa.
 */
export async function mapVillaToBeds24(
  villaId: string,
  beds24PropertyId: number,
  beds24RoomId: number
) {
  await requireAdmin();

  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase
    .from('villas')
    .update({ beds24_property_id: beds24PropertyId, beds24_room_id: beds24RoomId })
    .eq('id', villaId);

  if (error) {
    console.error('[beds24-actions] mapVillaToBeds24 error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Remove the Beds24 mapping for a villa (disconnect sync for that villa).
 */
export async function unmapVillaFromBeds24(villaId: string) {
  await requireAdmin();

  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase
    .from('villas')
    .update({ beds24_property_id: null, beds24_room_id: null })
    .eq('id', villaId);

  if (error) {
    console.error('[beds24-actions] unmapVillaFromBeds24 error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
