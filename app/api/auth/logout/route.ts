import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return NextResponse.redirect(new URL('/login', baseUrl), {
    status: 302,
  });
}
