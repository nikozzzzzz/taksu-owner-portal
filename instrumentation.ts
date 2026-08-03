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

      // Start the hourly background system report
      setInterval(async () => {
        try {
          const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
          const supabase = createAdminSupabaseClient();
          const { data } = await supabase
            .from('telegram_bot_settings')
            .select('report_system_usage_hourly, is_enabled')
            .maybeSingle();
            
          const settings = data as any;

          if (settings?.is_enabled && settings?.report_system_usage_hourly) {
            const os = await import('os');
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
            
            const cpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;
            cpus.forEach((cpu) => {
              for (const type in cpu.times) {
                totalTick += cpu.times[type as keyof typeof cpu.times];
              }
              totalIdle += cpu.times.idle;
            });
            const cpuUsagePercent = (100 - (totalIdle / totalTick) * 100).toFixed(1);
            const ramUsedMB = (usedMemory / 1024 / 1024).toFixed(0);
            const ramTotalMB = (totalMemory / 1024 / 1024).toFixed(0);
            
            const msg = `📊 <b>Hourly System Report</b>\n\n<b>CPU Usage:</b> <code>${cpuUsagePercent}%</code>\n<b>RAM Usage:</b> <code>${memoryUsagePercent}%</code> (${ramUsedMB}MB / ${ramTotalMB}MB)`;
            
            await sendTelegramNotification(msg, 'system');
          }
        } catch (e) {
          console.error('[instrumentation] Hourly system report failed:', e);
        }
      }, 60 * 60 * 1000); // 1 hour

    } catch (err) {
      console.error('[instrumentation] Failed to send Telegram startup notification:', err);
    }
  }
}
