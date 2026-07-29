'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { logPageView } from '@/lib/actions/user-activity-actions';

export function UserActivityTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname;
      logPageView(pathname).catch((err) => {
        console.error('[UserActivityTracker] Failed to log page view:', err);
      });
    }
  }, [pathname]);

  return null;
}
