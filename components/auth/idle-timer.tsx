'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabaseClient } from '@/lib/supabase/client';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_MS = 5 * 60 * 1000; // warn 5 min before logout
const CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds

const EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

export function IdleTimer() {
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkIdle = useCallback(async () => {
    const idleTime = Date.now() - lastActivityRef.current;

    if (idleTime >= IDLE_TIMEOUT_MS) {
      // Sign out
      const supabase = createClientSupabaseClient();
      await supabase.auth.signOut();
      router.push('/login?reason=idle_timeout');
    }
  }, [router]);

  useEffect(() => {
    // Register activity listeners
    EVENTS.forEach((event) => window.addEventListener(event, resetActivity, { passive: true }));

    // Start periodic check
    timerRef.current = setInterval(checkIdle, CHECK_INTERVAL_MS);

    return () => {
      EVENTS.forEach((event) => window.removeEventListener(event, resetActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetActivity, checkIdle]);

  // No UI — this is a background timer
  return null;
}
