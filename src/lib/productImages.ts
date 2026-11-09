import { supabase } from './supabase'

/** Public Storage bucket for product photos (migration 021). */
const BUCKET = 'product-images'
// Keep in sync with the bucket limits in migration 021
const MAX_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Upload a product photo; returns its storage path and public URL. */
export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Use a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Images must be 5 MB or smaller.')
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${productId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

/** Storage path for a photo in our bucket; null for static or external URLs. */
export function productImagePath(url: string | null): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url?.indexOf(marker) ?? -1
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null
}

/** Best-effort cleanup — a leftover file is harmless, so failures are only logged. */
export async function deleteProductImages(paths: string[]): Promise<void> {
  if (!paths.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.error('Failed to delete product images:', error)
}
