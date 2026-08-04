'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarBooking, CalendarPrice } from '@/lib/data/calendar';
import { BookingEvent } from './booking-event';
import { BookingModal } from './booking-modal';
import { PriceModal } from './price-modal';
import { ChannelLegend } from './channel-legend';
import { AiChatSidebar } from './ai-chat-sidebar';

interface MonthCalendarProps {
  villaId: string;
  initialBookings: CalendarBooking[];
  fetchBookings: (start: string, end: string) => Promise<CalendarBooking[]>;
  initialPrices: CalendarPrice[];
  fetchPrices: (start: string, end: string) => Promise<CalendarPrice[]>;
  lastSyncedAt?: string;
  nextSyncAt?: string;
}

export function MonthCalendar({ villaId, initialBookings, fetchBookings, initialPrices, fetchPrices, lastSyncedAt, nextSyncAt }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [prices, setPrices] = useState<CalendarPrice[]>(initialPrices);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['airbnb', 'booking', 'agoda', 'direct', 'other']);
  
  // Multi-select & Context Menu states
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter bookings by selected channels
  const filteredBookings = bookings.filter(b => {
    const channelKey = ['airbnb', 'booking', 'agoda', 'direct'].includes(b.channel.toLowerCase()) 
      ? b.channel.toLowerCase() 
      : 'other';
    return selectedChannels.includes(channelKey);
  });

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
      const [data, priceData] = await Promise.all([
        fetchBookings(startStr, endStr),
        fetchPrices(startStr, endStr)
      ]);
      setBookings(data);
      setPrices(priceData);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (day: Date, e: React.MouseEvent) => {
    if (contextMenu) setContextMenu(null);
    
    if (e.shiftKey && selectedDates.length > 0) {
      // Select range from last selected to current
      const lastSelected = selectedDates[selectedDates.length - 1];
      const rangeStart = lastSelected < day ? lastSelected : day;
      const rangeEnd = lastSelected < day ? day : lastSelected;
      const range = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      
      const newSelection = [...selectedDates];
      range.forEach(d => {
        if (!newSelection.some(sd => isSameDay(sd, d))) {
          newSelection.push(d);
        }
      });
      setSelectedDates(newSelection);
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle single date
      const exists = selectedDates.some(sd => isSameDay(sd, day));
      if (exists) {
        setSelectedDates(selectedDates.filter(sd => !isSameDay(sd, day)));
      } else {
        setSelectedDates([...selectedDates, day]);
      }
    } else {
      // Single select
      setSelectedDates([day]);
    }
  };

  const handleContextMenu = (day: Date, e: React.MouseEvent) => {
    e.preventDefault();
    
    // If clicking on an unselected date, select it first
    let currentSelection = selectedDates;
    if (!selectedDates.some(sd => isSameDay(sd, day))) {
      currentSelection = [day];
      setSelectedDates([day]);
    }

    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSyncBeds24 = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/beds24/sync-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villaId })
      });
      if (!res.ok) throw new Error('Sync failed');
      
      const startStr = startOfMonth(currentDate).toISOString().split('T')[0];
      const endStr = endOfMonth(currentDate).toISOString().split('T')[0];
      const newPrices = await fetchPrices(startStr, endStr);
      setPrices(newPrices);
      
      // Force page reload to update server timestamps
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      // We ignore errors if beds24 doesn't support the sync for this account
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-in fade-in">
      <div className="flex-1 min-w-0 w-full bg-white rounded-xl shadow-sm border border-border p-4 sm:p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-semibold text-taksu-forest">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          {lastSyncedAt && (
            <div className="hidden sm:flex flex-col text-[10px] text-gray-400 mr-2 text-right">
              <span>Prices Last Sync: {format(new Date(lastSyncedAt), 'MMM d, HH:mm')}</span>
              {nextSyncAt && <span>Next Auto Sync: {format(new Date(nextSyncAt), 'MMM d, HH:mm')}</span>}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleSyncBeds24} disabled={loading} className="text-xs mr-2">
            Sync Prices
          </Button>
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
          const isSelected = selectedDates.some(sd => isSameDay(sd, day));
          
          // Find bookings for this day
          const dayBookings = filteredBookings.filter(b => {
            const start = parseISO(b.check_in_date);
            const end = parseISO(b.check_out_date);
            return isWithinInterval(day, { start, end }) && !isSameDay(day, end);
          });

          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[100px] p-1 relative group cursor-pointer transition-colors ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : 'bg-white'} ${isSelected ? 'ring-2 ring-inset ring-taksu-terracotta/50 bg-taksu-bamboo/20' : ''}`}
              onClick={(e) => handleDateClick(day, e)}
              onContextMenu={(e) => handleContextMenu(day, e)}
            >
              {/* Visual hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-taksu-bamboo z-0 pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <span className={`text-sm font-medium p-1.5 rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-taksu-terracotta text-white' : 'text-taksu-forest'}`}>
                  {format(day, 'd')}
                </span>
                
                {(() => {
                  const dayPrice = prices.find(p => p.date === format(day, 'yyyy-MM-dd'));
                  if (dayPrice) {
                    if (dayPrice.price_usd != null) {
                      return <span className="text-xs font-semibold text-gray-500 mt-1 mr-1">${dayPrice.price_usd}</span>;
                    }
                    if (dayPrice.price_idr != null) {
                      return <span className="text-xs font-semibold text-gray-500 mt-1 mr-1">Rp{(dayPrice.price_idr / 1000).toFixed(0)}k</span>;
                    }
                  }
                  return null;
                })()}
              </div>
              
              <div className="mt-1 space-y-1 relative h-full">
                {dayBookings.map((booking, idx) => {
                  const start = parseISO(booking.check_in_date);
                  const end = parseISO(booking.check_out_date);
                  const isStart = isSameDay(day, start);
                  const dayBeforeEnd = new Date(end);
                  dayBeforeEnd.setDate(dayBeforeEnd.getDate() - 1);
                  const isEndVisual = isSameDay(day, dayBeforeEnd);

                  return (
                    <div key={booking.id} className="relative h-6 z-20">
                      <BookingEvent 
                        booking={booking} 
                        isStart={isStart} 
                        isEnd={isEndVisual} 
                        onClick={(b) => {
                           setSelectedBooking(b);
                           setBookingModalOpen(true);
                        }} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ChannelLegend 
        selectedChannels={selectedChannels}
        onChange={setSelectedChannels}
      />

      {/* Context Menu Modal */}
      {contextMenu && (
        <div className="fixed inset-0 z-50 overflow-hidden" onContextMenu={e => e.preventDefault()}>
          <div 
            className="absolute bg-white border border-border shadow-lg rounded-md min-w-[160px] py-1 text-sm font-medium z-50 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 100 : contextMenu.y), 
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 180 : contextMenu.x) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="w-full text-left px-3 py-2 hover:bg-taksu-cream transition-colors text-taksu-forest"
              onClick={() => {
                setBookingModalOpen(true);
                setContextMenu(null);
              }}
            >
              Create Booking/Block
            </button>
            <button 
              className="w-full text-left px-3 py-2 hover:bg-taksu-cream transition-colors text-taksu-forest"
              onClick={() => {
                setPriceModalOpen(true);
                setContextMenu(null);
              }}
            >
              Set Nightly Price
            </button>
            <button 
              className="w-full text-left px-3 py-2 hover:bg-taksu-cream transition-colors text-taksu-terracotta flex items-center justify-between"
              onClick={() => {
                setContextMenu(null);
                document.getElementById('ai-chat-input')?.focus();
              }}
            >
              Optimise with AI <span>✨</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookingModal 
        villaId={villaId}
        booking={selectedBooking} 
        selectedRange={selectedDates.length > 0 && !selectedBooking ? {
          start: selectedDates[0],
          end: addDays(selectedDates[selectedDates.length - 1], 1)
        } : null}
        open={bookingModalOpen} 
        onOpenChange={(open) => {
          setBookingModalOpen(open);
          if (!open) {
            setSelectedBooking(null);
            setSelectedDates([]);
          }
        }}
        onSave={() => loadBookings(currentDate)}
      />

      <PriceModal
        villaId={villaId}
        selectedDates={selectedDates}
        open={priceModalOpen}
        onOpenChange={(open) => {
          setPriceModalOpen(open);
          if (!open) {
            setSelectedDates([]);
            loadBookings(currentDate); // Reload prices after modal closes
          }
        }}
      />
      </div>

      <AiChatSidebar
        villaId={villaId}
        selectedDates={selectedDates}
      />
    </div>
  );
}
