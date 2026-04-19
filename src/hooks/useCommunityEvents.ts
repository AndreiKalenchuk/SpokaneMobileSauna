import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CommunityEvent } from '../types'

export function useCommunityEvents() {
  return useQuery<CommunityEvent[]>({
    queryKey: ['community-events'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .gte('event_date', today)
        .eq('is_active', true)
        .order('event_date', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

export function useNextCommunityEvent() {
  return useQuery<CommunityEvent | null>({
    queryKey: ['community-events', 'next'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .gte('event_date', today)
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })
}
