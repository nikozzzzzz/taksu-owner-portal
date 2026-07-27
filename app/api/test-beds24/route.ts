import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('roomId') || '710985'; 
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: creds } = await supabase.from('beds24_credentials').select('token').single();
    if (!creds) throw new Error('No credentials');

    const res = await fetch(`https://api.beds24.com/v2/inventory/rooms/offers?roomId=${roomId}&startDate=2026-07-01&endDate=2026-07-10`, {
      headers: { 'token': creds.token }
    });
    
    const offers = await res.json();
    return NextResponse.json({ offers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
