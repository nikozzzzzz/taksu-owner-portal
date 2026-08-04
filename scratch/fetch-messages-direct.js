const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  try {
    // 1. Get Beds24 token from Supabase
    const credsRes = await fetch(`${url}/rest/v1/beds24_credentials?select=*&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const creds = await credsRes.json();
    if (!creds || creds.length === 0) {
      console.error('No Beds24 credentials found in database.');
      return;
    }
    let token = creds[0].token;
    const refreshToken = creds[0].refresh_token;
    console.log('Got Beds24 token.');

    // Helper to fetch with auto-refresh
    const fetchB24 = async (url, options) => {
      let res = await fetch(url, { ...options, headers: { ...options.headers, 'token': token } });
      if (res.status === 401 || res.status === 500) {
        console.log('Token invalid, attempting refresh...');
        const rRes = await fetch('https://api.beds24.com/v2/authentication/token', {
          headers: { 'refreshToken': refreshToken }
        });
        const rData = await rRes.json();
        console.log('Refresh response:', rData);
        token = rData.token;
        console.log('Token refreshed.');
        // Save to DB
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/beds24_credentials?id=eq.${creds[0].id}`, {
          method: 'PATCH',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, refresh_token: refreshToken })
        });
        res = await fetch(url, { ...options, headers: { ...options.headers, 'token': token } });
      }
      return res;
    };

    // 2. Fetch Beds24 bookings
    console.log('Fetching bookings from Beds24...');
    const bRes = await fetchB24(`https://api.beds24.com/v2/bookings?includeInactive=true&dateFrom=2026-07-01`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await bRes.json();
    console.log(data);
    const bookings = Array.isArray(data) ? data : (data.data || []);
    console.log(`Found ${bookings.length} bookings.`);
    
    let msgCount = 0;
    for (const b of bookings) {
      if (!b.id) continue;
      const mRes = await fetchB24(`https://api.beds24.com/v2/bookings/messages?bookingId=${b.id}`, {
        headers: {}
      });
      if (!mRes.ok) continue;
      const mData = await mRes.json();
      const msgs = mData.data || mData;
      if (msgs && msgs.length > 0) {
        console.log(`\nBooking ${b.id} (${b.firstName} ${b.lastName}): ${msgs.length} msgs`);
        
        // 1. Get local booking id
        const locRes = await fetch(`${url}/rest/v1/bookings?beds24_booking_id=eq.${b.id}&select=id`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const locData = await locRes.json();
        if (!locData || locData.length === 0) continue;
        const localBookingId = locData[0].id;

        for (const m of msgs) {
          const senderRole = String(m.sender || m.from || '').toLowerCase().includes('guest') ? 'guest' : 'host';
          const text = m.message || m.text || '';
          const timestamp = m.time || m.date || m.timestamp || new Date().toISOString();
          const b24MsgId = m.id || m.messageId || null;

          let queryUrl = `${url}/rest/v1/guest_messages?booking_id=eq.${localBookingId}&message=eq.${encodeURIComponent(text)}&select=id`;
          if (b24MsgId) {
            queryUrl = `${url}/rest/v1/guest_messages?booking_id=eq.${localBookingId}&beds24_message_id=eq.${b24MsgId}&select=id`;
          }

          const exRes = await fetch(queryUrl, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
          const exData = await exRes.json();
          if (exData && exData.length > 0) continue;

          const insRes = await fetch(`${url}/rest/v1/guest_messages`, {
            method: 'POST',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              booking_id: localBookingId,
              beds24_message_id: b24MsgId ? String(b24MsgId) : null,
              sender_role: senderRole,
              message: text,
              created_at: timestamp
            })
          });

          if (insRes.ok) {
            msgCount++;
          } else {
            const err = await insRes.text();
            console.error('Insert failed:', err);
          }
        }
      }
    }
    console.log(`\nTotal bookings with msgs: ${msgCount}`);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
