import { CalendarBooking } from '@/lib/data/calendar';
import { CHANNEL_COLORS } from './channel-legend';

interface BookingEventProps {
  booking: CalendarBooking;
  isStart: boolean;
  isEnd: boolean;
  onClick: (booking: CalendarBooking) => void;
}

export function BookingEvent({ booking, isStart, isEnd, onClick }: BookingEventProps) {
  const colors = CHANNEL_COLORS[booking.channel.toLowerCase()] || CHANNEL_COLORS.other;
  
  // Create rounded corners on start/end days
  const roundedClass = [
    isStart ? 'rounded-l-md ml-1' : '-ml-1',
    isEnd ? 'rounded-r-md mr-1' : '-mr-1'
  ].join(' ');

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking);
      }}
      className={`absolute inset-y-1 left-0 right-0 z-10 cursor-pointer overflow-hidden text-xs flex items-center px-2 transition-transform hover:scale-105 ${colors.bg} ${colors.text} border-y ${colors.border} ${roundedClass} ${isStart ? 'border-l' : ''} ${isEnd ? 'border-r' : ''}`}
      title={`${booking.guest_initials} (${booking.channel})`}
    >
      {isStart && (
        <span className="font-medium truncate block w-full">
          {booking.guest_initials}
        </span>
      )}
    </div>
  );
}
