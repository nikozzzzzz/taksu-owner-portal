export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Application starting/restarting...');
    try {
      const { sendTelegramNotification } = await import('@/lib/telegram');
      
      const nodeEnv = process.env.NODE_ENV || 'development';
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }); // Bali/Makassar time
      
      await sendTelegramNotification(
        `<b>Application Startup / Restart Event</b>\n` +
        `<b>Environment:</b> <code>${nodeEnv}</code>\n` +
        `<b>Time:</b> <code>${timestamp} WITA</code>\n` +
        `<b>Host:</b> <code>portal.taksuliving.com</code>`,
        'startup'
      );
    } catch (err) {
      console.error('[instrumentation] Failed to send Telegram startup notification:', err);
    }
  }
}
