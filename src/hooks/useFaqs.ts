import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fillDeliveryTokens } from '../lib/delivery';
import { useDeliverySettings } from './useDeliverySettings';
import type { Faq } from '../types';

/** Answers may contain delivery {tokens}; they're filled from the live settings. */
export function useFaqs() {
  const deliverySettings = useDeliverySettings();

  return useQuery<Faq[]>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    select: (faqs) =>
      faqs.map((f) => ({ ...f, answer: fillDeliveryTokens(f.answer, deliverySettings) })),
  });
}
