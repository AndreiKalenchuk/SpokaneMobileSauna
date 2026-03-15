import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PricingRule } from '../types';

export function usePricingRules() {
  return useQuery<PricingRule[]>({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
}
