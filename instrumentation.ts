export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Application starting/restarting...');

    // Skip Telegram notification if explicitly disabled (e.g. local dev environment)
    const telegramEnabled = process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false';
    if (!telegramEnabled) {
      console.log('[instrumentation] Telegram notifications disabled via TELEGRAM_NOTIFICATIONS_ENABLED=false');
      return;
    }

    try {
      const { sendTelegramNotification } = await import('@/lib/telegram');
      
      const nodeEnv = process.env.NODE_ENV || 'development';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }); // Bali/Makassar time
      
      await sendTelegramNotification(
        `<b>Application Startup / Restart Event</b>\n` +
        `<b>Environment:</b> <code>${nodeEnv}</code>\n` +
        `<b>Time:</b> <code>${timestamp} WITA</code>\n` +
        `<b>Host:</b> <code>${appUrl}</code>`,
        'startup'
      );
    } catch (err) {
      console.error('[instrumentation] Failed to send Telegram startup notification:', err);
    }
  }
}
