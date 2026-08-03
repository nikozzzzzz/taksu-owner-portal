import { createAnthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getVillaBookings, getVillaPrices } from '@/lib/data/calendar';
import { streamText, createDataStreamResponse } from 'ai';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase.from('owners').select('*').eq('auth_user_id', user.id).single();
    const owner = data as any;
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
    const { data: villaData } = await supabase.from('villas').select('*').eq('id', villaId).single();
    const villa = villaData as any;

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
    const modelStr = owner.ai_model || 'claude-3-5-haiku-20241022';
    const model = anthropic(modelStr);

    return createDataStreamResponse({
      execute: dataStream => {
        const result = streamText({
          model,
          messages,
          system: owner.ai_pricing_prompt,
          onFinish: async (event) => {
            try {
              const { usage } = event;
              
              // Annotate the final message with usage stats so the client can display them
              dataStream.writeMessageAnnotation({ 
                usage: { 
                  promptTokens: usage.promptTokens, 
                  completionTokens: usage.completionTokens 
                } 
              });

              const adminSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
              );
              const { data: currentOwner } = await adminSupabase.from('owners').select('ai_calls, ai_input_tokens, ai_output_tokens').eq('id', owner.id).single();
              if (currentOwner) {
                await adminSupabase.from('owners').update({
                  ai_calls: (currentOwner.ai_calls || 0) + 1,
                  ai_input_tokens: (currentOwner.ai_input_tokens || 0) + usage.promptTokens,
                  ai_output_tokens: (currentOwner.ai_output_tokens || 0) + usage.completionTokens,
                }).eq('id', owner.id);
              }
            } catch (e) {
              console.error('Failed to update usage', e);
            }
          }
        });

        result.mergeIntoDataStream(dataStream);
      }
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
