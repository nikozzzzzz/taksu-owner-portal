import type { Metadata } from 'next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { requireOwner } from '@/lib/auth/middleware';
import { getVillaBookings } from '@/lib/data/calendar';
import { MonthCalendar } from '@/components/calendar/month-calendar';
import { startOfMonth, endOfMonth } from 'date-fns';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'View your villa reservation calendar',
};

export default async function CalendarPage() {
  const owner = await requireOwner();
  
  // Usually we'd want a default villa if they have multiple, for MVP we use their primary one (fetch first)
  // But wait, requireOwner doesn't give us villaId. We need to fetch the owner's villa.
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();
  
  const { data: villas } = await supabase
    .from('villas')
    .select('id')
    .eq('owner_id', owner.id)
    .limit(1);
    
  const villaId = (villas as any[])?.[0]?.id;

  let initialBookings: any[] = [];
  if (villaId) {
    const today = new Date();
    // Fetch current month + some buffer
    const startStr = startOfMonth(today).toISOString().split('T')[0];
    const endStr = endOfMonth(today).toISOString().split('T')[0];
    initialBookings = await getVillaBookings(villaId, startStr, endStr);
  }

  // Server action to fetch bookings dynamically for client component
  async function fetchBookingsForMonth(start: string, end: string) {
    'use server';
    if (!villaId) return [];
    return getVillaBookings(villaId, start, end);
  }

  return (
    <div className="portal-page animate-in">
      <div className="portal-page-header">
        <h1 className="portal-page-title flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-taksu-bamboo" />
          Booking Calendar
        </h1>
        <p className="portal-page-subtitle">
          View all reservations for your property. Guest details are anonymized.
        </p>
      </div>

      <div className="mt-6">
        {villaId ? (
          <MonthCalendar 
            initialBookings={initialBookings} 
            fetchBookings={fetchBookingsForMonth} 
          />
        ) : (
          <div className="p-12 text-center text-taksu-sage bg-white rounded-xl border border-border">
            No active property assigned to your account yet.
          </div>
        )}
      </div>
    </div>
  );
}
