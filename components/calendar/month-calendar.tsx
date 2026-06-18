'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarBooking } from '@/lib/data/calendar';
import { BookingEvent } from './booking-event';
import { BookingModal } from './booking-modal';
import { ChannelLegend } from './channel-legend';

interface MonthCalendarProps {
  initialBookings: CalendarBooking[];
  fetchBookings: (start: string, end: string) => Promise<CalendarBooking[]>;
}

export function MonthCalendar({ initialBookings, fetchBookings }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); // Actually in a real app you'd likely default to the current month or the latest statement month. For now, new Date() is fine.
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleNextMonth = async () => {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    await loadBookings(next);
  };

  const handlePrevMonth = async () => {
    const prev = subMonths(currentDate, 1);
    setCurrentDate(prev);
    await loadBookings(prev);
  };

  const loadBookings = async (date: Date) => {
    setLoading(true);
    try {
      const startStr = startOfMonth(date).toISOString().split('T')[0];
      const endStr = endOfMonth(date).toISOString().split('T')[0];
      const data = await fetchBookings(startStr, endStr);
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-semibold text-taksu-forest">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day} className="bg-taksu-cream p-2 text-center text-xs font-semibold text-taksu-sage uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          // Find bookings for this day
          const dayBookings = bookings.filter(b => {
            const start = parseISO(b.check_in_date);
            const end = parseISO(b.check_out_date);
            return isWithinInterval(day, { start, end }) && !isSameDay(day, end); // Check out day is not occupied
          });

          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] bg-white p-1 relative ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-medium p-1.5 rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-taksu-terracotta text-white' : 'text-taksu-forest'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="mt-1 space-y-1 relative h-full">
                {dayBookings.map((booking, idx) => {
                  const start = parseISO(booking.check_in_date);
                  const end = parseISO(booking.check_out_date);
                  const isStart = isSameDay(day, start);
                  // Since we don't render the bar on check out day, the end visual is the day before check out
                  const dayBeforeEnd = new Date(end);
                  dayBeforeEnd.setDate(dayBeforeEnd.getDate() - 1);
                  const isEndVisual = isSameDay(day, dayBeforeEnd);

                  return (
                    <div key={booking.id} className="relative h-6" style={{ top: idx * 28 }}>
                      <BookingEvent 
                        booking={booking} 
                        isStart={isStart} 
                        isEnd={isEndVisual} 
                        onClick={setSelectedBooking} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ChannelLegend />

      <BookingModal 
        booking={selectedBooking} 
        open={!!selectedBooking} 
        onOpenChange={(open) => !open && setSelectedBooking(null)} 
      />
    </div>
  );
}
