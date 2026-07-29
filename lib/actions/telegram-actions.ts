'use server';

import { getAuthUser } from '@/lib/auth/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkBotHealth, clearTelegramCache } from '@/lib/telegram';

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || !['admin', 'root'].includes(user.app_metadata?.role)) {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function getTelegramSettings() {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;
    
    const { data, error } = await supabase
      .from('telegram_bot_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { success: true, settings: data || null };
  } catch (err: any) {
    console.error('[telegram-actions] getTelegramSettings error:', err);
    return { success: false, error: err.message };
  }
}

export async function saveTelegramSettings(formData: {
  bot_token: string;
  bot_name: string;
  chat_id: string;
  acl: string; // Comma-separated user IDs
  is_enabled: boolean;
}) {
  try {
    await requireAdmin();
    const supabase = (await createServerSupabaseClient()) as any;

    // Parse ACL string to array of numbers
    const aclArray = formData.acl
      .split(',')
      .map((item) => parseInt(item.trim(), 10))
      .filter((num) => !isNaN(num));

    const payload = {
      bot_token: formData.bot_token.trim(),
      bot_name: formData.bot_name.trim(),
      chat_id: formData.chat_id.trim(),
      acl: aclArray,
      is_enabled: formData.is_enabled,
      updated_at: new Date().toISOString(),
    };

    // Check if a row already exists
    const { data: existing } = await supabase
      .from('telegram_bot_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from('telegram_bot_settings')
        .update(payload)
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('telegram_bot_settings')
        .insert([payload]);
    }

    if (result.error) throw result.error;

    // Clear memory cache so settings take effect immediately
    clearTelegramCache();

    return { success: true };
  } catch (err: any) {
    console.error('[telegram-actions] saveTelegramSettings error:', err);
    return { success: false, error: err.message };
  }
}

export async function testTelegramSettings(formData: {
  bot_token: string;
  chat_id: string;
}) {
  try {
    await requireAdmin();

    const health = await checkBotHealth(formData.bot_token.trim(), formData.chat_id.trim());
    
    // Save the health status to DB if settings exist
    const supabase = (await createServerSupabaseClient()) as any;
    const { data: existing } = await supabase
      .from('telegram_bot_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('telegram_bot_settings')
        .update({
          health_status: health.success ? 'healthy' : 'unhealthy',
          bot_name: health.botName || undefined,
          last_health_check: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      clearTelegramCache();
    }

    return {
      success: health.success,
      botName: health.botName,
      error: health.error,
    };
  } catch (err: any) {
    console.error('[telegram-actions] testTelegramSettings error:', err);
    return { success: false, error: err.message };
  }
}
