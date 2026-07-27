import type { Metadata } from 'next';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { requireOwner } from '@/lib/auth/middleware';
import { getVillaBookings } from '@/lib/data/calendar';
import { MonthCalendar } from '@/components/calendar/month-calendar';
import { startOfMonth, endOfMonth } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { VillaSelector } from '@/components/calendar/villa-selector';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'View your villa reservation calendar',
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const owner = await requireOwner();
  const supabase = await createServerSupabaseClient();
  const resolvedSearchParams = await searchParams;
  
  // 1. Fetch available villas based on RBAC
  let query = supabase.from('villas').select('id, display_name, internal_code').in('status', ['active', 'paused', 'pre_launch']);
  if (owner.role !== 'admin' && owner.role !== 'root') {
    query = query.eq('owner_id', owner.id);
  }
  
  const { data: villas } = await query.order('internal_code', { ascending: true });
  const allowedVillas = (villas as any[]) || [];
  
  // 2. Determine selected villa
  let villaId = resolvedSearchParams.villaId as string | undefined;
  
  if (!villaId && allowedVillas.length > 0) {
    villaId = allowedVillas[0].id;
  }
  
  if (villaId && !allowedVillas.find(v => v.id === villaId)) {
    villaId = allowedVillas[0]?.id;
  }

  // 3. Fetch initial bookings
  let initialBookings: any[] = [];
  if (villaId) {
    const today = new Date();
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
      <div className="portal-page-header flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="portal-page-title flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-taksu-bamboo" />
            Booking Calendar
          </h1>
          <p className="portal-page-subtitle">
            View all reservations and manage availability for your property.
          </p>
        </div>
        
        {allowedVillas.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Filter className="h-4 w-4 text-gray-400" />
            <VillaSelector villas={allowedVillas} selectedId={villaId!} />
          </div>
        )}
      </div>

      <div className="mt-6">
        {villaId ? (
          <MonthCalendar 
            villaId={villaId}
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
