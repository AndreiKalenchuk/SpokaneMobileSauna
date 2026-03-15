import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Coupon } from '../types';

export function useCoupon(code: string) {
  return useQuery<Coupon | null>({
    queryKey: ['coupon', code],
    queryFn: async () => {
      if (!code.trim()) return null;

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim())
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    },
    enabled: !!code.trim(),
  });
}
