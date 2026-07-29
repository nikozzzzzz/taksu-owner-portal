'use server';

import { logUserActivity } from '@/lib/user-logger';

export async function logPageView(pathname: string) {
  try {
    // Basic sanitization of the pathname
    const cleanPath = pathname.split('?')[0];
    
    // Ignore internal next dev requests or static assets if any leak through
    if (cleanPath.startsWith('/_next') || cleanPath.includes('.')) {
      return { success: true };
    }

    await logUserActivity('page_view', { path: cleanPath });
    return { success: true };
  } catch (err: any) {
    console.error('[user-activity-actions] logPageView error:', err);
    return { success: false, error: err.message };
  }
}
