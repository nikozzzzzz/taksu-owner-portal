import { getBeds24Bookings, getBeds24Messages } from '../lib/beds24/client';

async function main() {
  try {
    console.log('Fetching recent bookings from Beds24...');
    const bookings = await getBeds24Bookings({ dateFrom: '2026-07-01' });
    console.log(`Found ${bookings.length} bookings.`);

    let messagesCount = 0;
    for (const booking of bookings) {
      if (!booking.id) continue;
      
      const messages = await getBeds24Messages(booking.id);
      if (messages && messages.length > 0) {
        console.log(`\nBooking ${booking.id} (${booking.firstName} ${booking.lastName}): ${messages.length} messages`);
        console.log(JSON.stringify(messages, null, 2));
        messagesCount++;
      }
    }
    console.log(`\nFound messages for ${messagesCount} bookings.`);
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

main();
