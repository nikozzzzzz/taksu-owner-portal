import { promises as fs } from 'fs';
import path from 'path';
import { getAuthUser } from '@/lib/auth/middleware';
import { sendTelegramNotification } from '@/lib/telegram';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'user_activity.jsonl');

interface LogEntry {
  timestamp: string;
  user_email: string;
  user_role: string;
  action: string;
  details: Record<string, any>;
}

export async function logUserActivity(
  action: string,
  details: Record<string, any> = {}
) {
  try {
    // 1. Get current authenticated user
    let email = 'anonymous';
    let role = 'guest';
    try {
      const user = await getAuthUser();
      if (user) {
        email = user.email || 'unknown';
        role = user.app_metadata?.role || 'guest';
      }
    } catch {
      // Not authenticated / anonymous request
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      user_email: email,
      user_role: role,
      action,
      details,
    };

    // 2. Ensure log directory exists
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
    } catch {}

    // 3. Write to local file (append JSON line)
    await fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n');

    // 4. Send to Telegram
    const formattedDetails = Object.entries(details)
      .map(([key, val]) => `<b>${key}:</b> <code>${JSON.stringify(val)}</code>`)
      .join('\n');

    const htmlMessage = `👤 <b>User:</b> <code>${email}</code> (${role})
🎬 <b>Action:</b> <code>${action}</code>
${formattedDetails ? `📝 <b>Details:</b>\n${formattedDetails}` : ''}`;

    // Send asynchronously so we don't block the request lifecycle
    sendTelegramNotification(htmlMessage, 'startup').catch((err) => {
      console.error('[UserLogger] Telegram notification failed:', err);
    });
  } catch (err) {
    console.error('[UserLogger] Failed to log user activity:', err);
  }
}
