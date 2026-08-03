import { createAdminSupabaseClient } from '@/lib/supabase/admin';

let cachedSettings: any = null;
let lastFetched: number = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export function clearTelegramCache() {
  cachedSettings = null;
  lastFetched = 0;
}

export function escapeHtml(text: string): string {
  if (typeof text !== 'string') return String(text || '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function getTelegramSettings() {
  const now = Date.now();
  if (cachedSettings && now - lastFetched < CACHE_TTL_MS) {
    return cachedSettings;
  }
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from('telegram_bot_settings').select('*').limit(1).maybeSingle();
    cachedSettings = data || null;
    lastFetched = now;
    return cachedSettings;
  } catch (err) {
    console.error('[Telegram] Failed to fetch settings:', err);
    return null;
  }
}

/**
 * Sends a raw text message to Telegram using the configured bot token and chat ID.
 * Supports multiple chat IDs separated by commas.
 * Returns true if all successful, false otherwise.
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  htmlText: string
): Promise<boolean> {
  if (!token || !chatId) return false;

  // Truncate to Telegram's 4096 character limit
  let finalHtml = htmlText;
  if (finalHtml.length > 4000) {
    finalHtml = finalHtml.substring(0, 4000) + '\n\n<i>... (truncated due to length)</i>';
  }

  const targetChats = chatId.split(',').map((c) => c.trim()).filter(Boolean);
  if (targetChats.length === 0) return false;

  let allSuccess = true;
  for (const chat of targetChats) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat,
          text: finalHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Telegram] API error for chat ${chat}:`, errText);
        allSuccess = false;
      }
    } catch (err) {
      console.error(`[Telegram] Failed to send message to chat ${chat}:`, err);
      allSuccess = false;
    }
  }

  return allSuccess;
}

/**
 * Sends a notification if Telegram Logging is enabled.
 */
export async function sendTelegramNotification(
  htmlText: string,
  type: 'api' | 'error' | 'startup' | 'system'
): Promise<boolean> {
  const settings = await getTelegramSettings();
  if (!settings || !settings.is_enabled || !settings.bot_token || !settings.chat_id) {
    return false;
  }

  // Prepend emoji indicator based on message type
  let emoji = 'ℹ️';
  if (type === 'api') emoji = '🔌';
  if (type === 'error') emoji = '🚨';
  if (type === 'startup') emoji = '🚀';
  if (type === 'system') emoji = '⚙️';

  const fullText = `${emoji} <b>[Taksu Portal - ${type.toUpperCase()}]</b>\n\n${htmlText}`;
  return sendTelegramMessage(settings.bot_token, settings.chat_id, fullText);
}

/**
 * Validates bot token with Telegram's /getMe API and sends a test message to verify chat ID(s).
 */
export async function checkBotHealth(
  token: string,
  chatId: string
): Promise<{ success: boolean; botName?: string; error?: string }> {
  try {
    // 1. Get bot info
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!getMeRes.ok) {
      return { success: false, error: `Invalid Bot Token (HTTP ${getMeRes.status})` };
    }
    const meData = await getMeRes.json();
    if (!meData.ok || !meData.result) {
      return { success: false, error: 'Telegram did not return bot details' };
    }
    const botName = meData.result.first_name || meData.result.username;

    // 2. Send test messages to verify Chat IDs
    const targetChats = chatId.split(',').map((c) => c.trim()).filter(Boolean);
    if (targetChats.length === 0) {
      return { success: false, botName, error: 'No valid Chat IDs provided' };
    }

    const failedChats: string[] = [];
    for (const chat of targetChats) {
      const testMsg = `🏥 <b>Telegram Logging Bot Setup</b>\nHealth check successful for bot: <b>${escapeHtml(
        botName
      )}</b>`;
      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: testMsg,
          parse_mode: 'HTML',
        }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        failedChats.push(`${chat} (${errText})`);
      }
    }

    if (failedChats.length > 0) {
      return {
        success: false,
        botName,
        error: `Failed to send to chats: ${failedChats.join(', ')}`,
      };
    }

    return { success: true, botName };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Helper to log an error with context and stack trace to Telegram logging bot.
 */
export async function logErrorToTelegram(error: any, context?: string): Promise<boolean> {
  try {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && error.stack ? error.stack : '';
    
    let htmlText = `<b>Error:</b> <code>${escapeHtml(errorMsg)}</code>\n`;
    if (context) {
      htmlText += `<b>Context:</b> <code>${escapeHtml(context)}</code>\n`;
    }
    if (errorStack) {
      // Limit trace to 1500 chars to avoid hitting Telegram's limits
      htmlText += `<b>Stack Trace:</b>\n<pre><code>${escapeHtml(errorStack.substring(0, 1500))}</code></pre>`;
    }
    
    return sendTelegramNotification(htmlText, 'error');
  } catch (err) {
    console.error('[Telegram] Failed to log error to Telegram:', err);
    return false;
  }
}
