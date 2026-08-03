import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getVillaBookings, getVillaPrices } from '@/lib/data/calendar';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: owner } = await supabase.from('owners').select('*').eq('auth_user_id', user.id).single();
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    const { messages, villaId, dates } = await req.json();

    if (!owner.ai_api_key) {
      return NextResponse.json({ error: 'AI API Key is not configured. Please check your settings.' }, { status: 400 });
    }

    // Sort dates
    const sortedDates = dates.sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    // Fetch contextual data
    const bookings = await getVillaBookings(villaId, startDate, endDate);
    const prices = await getVillaPrices(villaId, startDate, endDate);
    const { data: villa } = await supabase.from('villas').select('*').eq('id', villaId).single();

    // Mask guest name and shorten data
    const anonymizedBookings = bookings.map(b => ({
      ...b,
      guest_full_name: b.guest_full_name ? `${b.guest_full_name.charAt(0)}.` : 'Unknown',
    }));

    const contextMessage = `
You are tasked to help optimize pricing for the following villa:
Villa Name: ${villa?.display_name || 'Unknown'}
Selected Dates: ${startDate} to ${endDate}

Context Data:
Occupancy & Bookings (overlapping these dates):
${JSON.stringify(anonymizedBookings, null, 2)}

Current Nightly Prices:
${JSON.stringify(prices, null, 2)}

Instructions:
${owner.ai_pricing_prompt || 'You are a helpful AI pricing assistant for a luxury villa in Bali. Analyze the occupancy, existing bookings, current prices, and provide thoughtful pricing optimization advice.'}
`;

    // Only inject context once at the start
    if (messages.length === 1) {
      messages[0].content = `${contextMessage}\n\nUser Message: ${messages[0].content}`;
    }

    const anthropic = createAnthropic({ apiKey: owner.ai_api_key });
    const modelStr = owner.ai_model || 'claude-3-5-sonnet-20240620';
    const model = anthropic(modelStr);

    const result = await streamText({
      model,
      messages,
      system: owner.ai_pricing_prompt,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
