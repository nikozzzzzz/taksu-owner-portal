import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint — DISABLED for security hardening.
 * This endpoint previously exposed Beds24 credentials without authentication.
 * Use the admin UI Beds24 integration panel instead.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: 'This test endpoint has been disabled for security. Use Admin > Integrations.' },
    { status: 403 }
  );
}
