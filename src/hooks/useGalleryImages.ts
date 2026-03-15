import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { GalleryImage } from '../types';

export function useGalleryImages() {
  return useQuery<GalleryImage[]>({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });
}
