import { createAnthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { streamText, StreamData } from 'ai';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase.from('owners').select('*').eq('auth_user_id', user.id).single();
    const owner = data as any;
    if (!owner || !owner.ai_api_key) {
      return NextResponse.json({ error: 'AI API Key is not configured in settings.' }, { status: 400 });
    }

    const { messages, contextData } = await req.json();

    const systemPrompt = `You are a helpful and hospitable villa manager in Bali. Your goal is to help answer the guest's question in the most friendly and professional manner possible. Here is some context about the guest and booking:\n${JSON.stringify(contextData, null, 2)}\n\nPlease craft a response that the host can send directly to the guest.`;

    const anthropic = createAnthropic({ apiKey: owner.ai_api_key });
    const modelStr = owner.ai_model || 'claude-3-5-haiku-20241022';
    const model = anthropic(modelStr);

    const streamData = new StreamData();
    const result = await streamText({
      model,
      messages,
      system: systemPrompt,
      onFinish: async (event) => {
        try {
          const { usage } = event;
          
          streamData.append({ 
            usage: { 
              promptTokens: usage.promptTokens, 
              completionTokens: usage.completionTokens 
            } 
          });
          streamData.close();

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
          streamData.close();
        }
      }
    });

    return result.toDataStreamResponse({ data: streamData });
  } catch (error: any) {
    console.error('Guest Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
