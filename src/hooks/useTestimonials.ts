import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Testimonial } from '../types';

export function useTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
}
