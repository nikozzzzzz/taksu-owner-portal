import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logApiCall } from '@/lib/beds24/client';

const WEBHOOK_SECRET = process.env.BEDS24_WEBHOOK_SECRET;

const MessageWebhookSchema = z.object({
  bookingId: z.number(),
  message: z.string(),
  sender: z.enum(['guest', 'host']),
  messageId: z.string().optional(),
  timestamp: z.string().optional()
});

export async function POST(req: NextRequest) {
  // 1. Early Authentication
  let authFailed = false;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook/beds24-messages] BEDS24_WEBHOOK_SECRET is not set.');
    authFailed = true;
  } else {
    const incomingSecret =
      req.headers.get('x-beds24-secret') || req.headers.get('authorization');
    if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) {
      console.warn('[Webhook/beds24-messages] Rejected request: invalid secret.');
      authFailed = true;
    }
  }

  if (authFailed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse payload safely
  let rawPayload: unknown = null;
  try {
    rawPayload = await req.json();
  } catch {
    console.error('[Webhook/beds24-messages] Failed to parse JSON body.');
    await logApiCall('inbound', '/api/webhooks/beds24-messages', null, 400, { error: 'Invalid JSON' }, 'Failed to parse JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle arrays or single objects
  const payloads = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
  const supabase = (await createServerSupabaseClient()) as any;
  const results = [];

  for (const item of payloads) {
    const parsed = MessageWebhookSchema.safeParse(item);
    if (!parsed.success) {
      console.warn('[Webhook/beds24-messages] Invalid message payload:', parsed.error);
      results.push({ outcome: 'skipped', reason: 'Schema validation failed' });
      continue;
    }

    const data = parsed.data;

    // Look up local booking by beds24_booking_id
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('beds24_booking_id', data.bookingId)
      .maybeSingle();

    if (!booking) {
      console.warn(`[Webhook/beds24-messages] No local booking found for Beds24 ID ${data.bookingId}`);
      results.push({ outcome: 'skipped', reason: 'Booking not found' });
      continue;
    }

    // Insert message
    const { error } = await supabase
      .from('guest_messages')
      .insert({
        booking_id: booking.id,
        beds24_message_id: data.messageId || null,
        sender_role: data.sender,
        message: data.message,
        created_at: data.timestamp || new Date().toISOString()
      });

    if (error) {
      console.error('[Webhook/beds24-messages] Failed to insert message:', error);
      results.push({ outcome: 'error', reason: error.message });
    } else {
      results.push({ outcome: 'success', bookingId: data.bookingId });
    }
  }

  await logApiCall('inbound', '/api/webhooks/beds24-messages', rawPayload, 200, { results }, null);
  
  return NextResponse.json({ success: true, processed: results.length, results });
}
