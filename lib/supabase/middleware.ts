import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write code between createServerClient and auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieNames = request.cookies.getAll().map((c) => c.name);
  console.log(`[middleware] path=${request.nextUrl.pathname} user=${user?.email ?? 'null'} cookies=[${cookieNames.join(',')}]`);

  const { pathname } = request.nextUrl;

  // Auth routes — redirect to dashboard if already logged in
  const authRoutes = ['/login', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protected routes — redirect to login if not authenticated
  const publicRoutes = ['/login', '/reset-password', '/setup-account', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ─── Role-Based Restrictions ───────────────────────────────────────────────
  
  const role = user?.app_metadata?.role || 'guest';
  
  if (user && role === 'guest' && !isPublicRoute) {
    // Guests are only allowed to view dashboard (which will show pending state), requests, and settings
    const allowedGuestPrefixes = ['/dashboard', '/requests', '/settings'];
    const isAllowedForGuest = allowedGuestPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
    
    if (!isAllowedForGuest) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Admin route restrictions
  if (user && pathname.startsWith('/admin') && !['admin', 'root'].includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
