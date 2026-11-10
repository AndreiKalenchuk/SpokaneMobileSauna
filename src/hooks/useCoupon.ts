import { queryOptions, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { normalizeCouponCode } from '../lib/coupons';
import type { CouponCheck } from '../lib/coupons';

/**
 * Checks one code through check_coupon() (migration 023) — anon can't read the
 * coupons table, so codes, ids and usage counts are never listable. Uses left
 * change as other customers book, so results are never served stale.
 */
export function couponQueryOptions(code: string) {
  const normalized = normalizeCouponCode(code);
  return queryOptions({
    queryKey: ['coupon', normalized],
    queryFn: async (): Promise<CouponCheck> => {
      const { data, error } = await supabase.rpc('check_coupon', { p_code: normalized });
      if (error) throw error;
      return data as CouponCheck;
    },
    enabled: !!normalized,
    staleTime: 0,
  });
}

export function useCoupon(code: string) {
  return useQuery(couponQueryOptions(code));
}
