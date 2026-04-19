import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface CommunitySlotCount {
  event_date: string
  slot_time: string
  booked_quantity: number
}

export function useCommunityAvailability(eventDate: string | null) {
  return useQuery<CommunitySlotCount[]>({
    queryKey: ['community-availability', eventDate],
    queryFn: async () => {
      if (!eventDate) return []

      const { data, error } = await supabase
        .from('community_bookings')
        .select('event_date, slot_time, quantity, status')
        .eq('event_date', eventDate)
        .neq('status', 'cancelled')

      if (error) throw error

      const map = new Map<string, number>()
      for (const row of data ?? []) {
        const key = `${row.event_date}|${row.slot_time.slice(0, 8)}`
        map.set(key, (map.get(key) ?? 0) + (row.quantity ?? 0))
      }

      return Array.from(map.entries()).map(([key, qty]) => {
        const [event_date, slot_time] = key.split('|')
        return { event_date, slot_time, booked_quantity: qty }
      })
    },
    enabled: !!eventDate,
  })
}
