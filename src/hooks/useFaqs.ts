import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Faq } from '../types';

export function useFaqs() {
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
  });
}
