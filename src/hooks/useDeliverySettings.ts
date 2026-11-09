import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_DELIVERY_SETTINGS,
  normalizeDeliverySettings,
} from '../lib/delivery';
import type { DeliverySettings } from '../lib/delivery';

export const DELIVERY_SETTINGS_QUERY_KEY = ['delivery-settings'];

/** PostgREST codes for "table does not exist" (migration 019 not applied yet). */
export function isMissingTableError(error: { code?: string } | null): boolean {
  return !!error?.code && ['PGRST205', '42P01'].includes(error.code);
}

/**
 * Admin-editable delivery/pickup pricing and copy. Returns the settings directly
 * (seed defaults until loaded) because nearly every consumer just renders text.
 */
export function useDeliverySettings(): DeliverySettings {
  const { data } = useQuery<DeliverySettings>({
    queryKey: DELIVERY_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) return DEFAULT_DELIVERY_SETTINGS;
        throw error;
      }
      return normalizeDeliverySettings(data);
    },
    staleTime: 5 * 60 * 1000,
  });

  return data ?? DEFAULT_DELIVERY_SETTINGS;
}
