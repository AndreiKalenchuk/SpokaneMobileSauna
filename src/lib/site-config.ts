/**
 * Central site configuration for SEO, meta tags, and shared content.
 * Update contact info and social links when business details are finalized.
 */
export const SITE_NAME = 'Spokane Mobile Sauna'
export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? 'https://spokanemobilesauna.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`
export const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=2000&q=80'

export const CONTACT = {
  phone: '(555) 123-4567',
  phoneHref: 'tel:+15551234567',
  email: 'hello@spokanemobilesauna.com',
  emailHref: 'mailto:hello@spokanemobilesauna.com',
  hours: 'Mon–Sun: 8AM–8PM',
  serviceArea: 'Spokane and surrounding areas',
} as const

// Placeholder — update when social profiles are ready
export const SOCIAL = {
  facebook: '#',
  instagram: '#',
} as const

/** Build absolute URL for canonical and og:url */
export function fullUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
