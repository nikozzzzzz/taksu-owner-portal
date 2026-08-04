import { getBeds24Bookings, getBeds24Messages } from '@/lib/beds24/client';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

async function main() {
  const supabase = createAdminSupabaseClient() as any;

  console.log('Fetching recent bookings from Beds24 (last 2 years)...');
  
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setFullYear(today.getFullYear() - 2);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const bookings = await getBeds24Bookings({ dateFrom: fmt(dateFrom) });
  console.log(`Found ${bookings.length} total bookings.`);

  let msgCount = 0;
  for (const b of bookings) {
    if (!b.id) continue;
    
    // Check if we have this booking mapped locally
    const { data: localBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('beds24_booking_id', b.id)
      .maybeSingle();

    if (!localBooking) continue; // Only pull messages for bookings we know about

    const messages = await getBeds24Messages(b.id);
    if (!messages || messages.length === 0) continue;

    for (const m of messages) {
      // Beds24 returns message, from, to, date, etc.
      // E.g., m.message, m.time, m.sender (can be "host" or "guest" or similar)
      const senderRole = String(m.sender || m.from || '').toLowerCase().includes('guest') ? 'guest' : 'host';
      const text = m.message || m.text || '';
      const timestamp = m.time || m.date || m.timestamp || new Date().toISOString();
      const b24MsgId = m.id || m.messageId || null;

      // Check if message already exists
      let query = supabase.from('guest_messages').select('id').eq('booking_id', localBooking.id).eq('message', text);
      if (b24MsgId) query = query.eq('beds24_message_id', String(b24MsgId));
      
      const { data: existing } = await query.maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from('guest_messages').insert({
        booking_id: localBooking.id,
        beds24_message_id: b24MsgId ? String(b24MsgId) : null,
        sender_role: senderRole,
        message: text,
        created_at: timestamp
      });

      if (!error) {
        msgCount++;
      } else {
        console.error(`Error inserting message for booking ${b.id}:`, error.message);
      }
    }
  }

  console.log(`\nSuccessfully backfilled ${msgCount} missing messages!`);
}

main().catch(console.error);
