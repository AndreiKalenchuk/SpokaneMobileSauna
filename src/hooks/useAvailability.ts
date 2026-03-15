import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Booking, BlockedDate } from '../types';

interface Availability {
  bookings: Pick<Booking, 'rental_date' | 'status'>[];
  blockedDates: BlockedDate[];
}

export function useAvailability(month: string) {
  return useQuery<Availability>({
    queryKey: ['availability', month],
    queryFn: async () => {
      const startDate = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

      const [bookingsRes, blockedRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('rental_date, status')
          .gte('rental_date', startDate)
          .lte('rental_date', endDate)
          .neq('status', 'cancelled'),
        supabase
          .from('blocked_dates')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (blockedRes.error) throw blockedRes.error;

      return {
        bookings: bookingsRes.data,
        blockedDates: blockedRes.data,
      };
    },
    enabled: !!month,
  });
}
