/**
 * Delivery/pickup settings, pricing and road-distance lookup.
 *
 * Pure TypeScript with no Deno-specific APIs: the edge functions
 * (`delivery-quote`, `create-payment-intent`, `stripe-webhook`) import it, the
 * Vite dev middleware loads it, and src/lib/delivery.ts re-exports the pure
 * parts for the browser — so pricing logic exists exactly once.
 *
 * Prices and copy are admin-editable in the `delivery_settings` table
 * (migration 019). The pickup/delivery origin is NOT a setting: it is the
 * `DELIVERY_ORIGIN` secret and never reaches the browser.
 */

export type MileRounding = 'up' | 'nearest' | 'down' | 'exact'

export interface DeliverySettings {
  delivery_enabled: boolean
  delivery_base_fee: number
  delivery_included_miles: number
  delivery_rate_per_extra_mile: number
  delivery_mile_rounding: MileRounding
  delivery_max_miles: number
  delivery_note: string
  delivery_points: string[]
  delivery_instructions: string[]
  pickup_enabled: boolean
  pickup_fee: number
  pickup_exit: string
  pickup_street: string
  pickup_area: string
  pickup_note: string
  pickup_points: string[]
  pickup_instructions: string[]
}

/** Fallback until migration 019 runs. Keep in sync with its seed row. */
export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  delivery_enabled: true,
  delivery_base_fee: 89,
  delivery_included_miles: 20,
  delivery_rate_per_extra_mile: 1,
  delivery_mile_rounding: 'up',
  delivery_max_miles: 50,
  delivery_note: 'Includes setup, a safety walkthrough & next-day pickup.',
  delivery_points: [
    'Exact road-distance quote when you book',
    'Professional setup & safety walkthrough',
    'We collect it the next day',
  ],
  delivery_instructions: [
    "We'll contact you 24 hours before your rental to confirm delivery details.",
    'Please ensure the delivery area is clear — level surface with 4 ft clearance from structures.',
    'The sauna will be delivered before 2 PM and picked up the next day after 10 AM.',
  ],
  pickup_enabled: true,
  pickup_fee: 0,
  pickup_exit: 'I-90 Exit 280A',
  pickup_street: 'Maple St',
  pickup_area: 'Spokane, WA',
  pickup_note:
    "About a minute off the interstate — easy in, easy out. We'll send the exact pickup details after you book.",
  pickup_points: [
    'About one minute off the interstate',
    'Quick hitch-up and walkthrough at pickup',
    'Exact pickup details sent after booking',
  ],
  pickup_instructions: [
    "We'll text you the exact pickup spot and time — it's right off {pickup_exit} ({pickup_street}).",
    "Bring a vehicle that can tow the sauna trailer, plus your driver's license.",
    'Have a level spot ready that meets the site requirements in our Rental Terms (Section 4). We walk you through setup and fire safety at pickup.',
  ],
}

export const MILE_ROUNDING_OPTIONS: { value: MileRounding; label: string }[] = [
  { value: 'up', label: 'Round up — every started mile' },
  { value: 'nearest', label: 'Round to the nearest mile' },
  { value: 'down', label: 'Round down — full miles only' },
  { value: 'exact', label: 'Exact — charge partial miles' },
]

/** Coerce a DB row (numerics may arrive as strings) onto the settings shape. */
export function normalizeDeliverySettings(
  row: Record<string, unknown> | null | undefined,
): DeliverySettings {
  const d = DEFAULT_DELIVERY_SETTINGS
  if (!row) return d

  const num = (v: unknown, fallback: number) =>
    v != null && Number.isFinite(Number(v)) ? Number(v) : fallback
  const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
  const list = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : fallback
  const rounding = MILE_ROUNDING_OPTIONS.some((o) => o.value === row.delivery_mile_rounding)
    ? (row.delivery_mile_rounding as MileRounding)
    : d.delivery_mile_rounding

  return {
    delivery_enabled: bool(row.delivery_enabled, d.delivery_enabled),
    delivery_base_fee: num(row.delivery_base_fee, d.delivery_base_fee),
    delivery_included_miles: num(row.delivery_included_miles, d.delivery_included_miles),
    delivery_rate_per_extra_mile: num(row.delivery_rate_per_extra_mile, d.delivery_rate_per_extra_mile),
    delivery_mile_rounding: rounding,
    delivery_max_miles: num(row.delivery_max_miles, d.delivery_max_miles),
    delivery_note: str(row.delivery_note, d.delivery_note),
    delivery_points: list(row.delivery_points, d.delivery_points),
    delivery_instructions: list(row.delivery_instructions, d.delivery_instructions),
    pickup_enabled: bool(row.pickup_enabled, d.pickup_enabled),
    pickup_fee: num(row.pickup_fee, d.pickup_fee),
    pickup_exit: str(row.pickup_exit, d.pickup_exit),
    pickup_street: str(row.pickup_street, d.pickup_street),
    pickup_area: str(row.pickup_area, d.pickup_area),
    pickup_note: str(row.pickup_note, d.pickup_note),
    pickup_points: list(row.pickup_points, d.pickup_points),
    pickup_instructions: list(row.pickup_instructions, d.pickup_instructions),
  }
}

/** Read the settings row through PostgREST (works in Deno, Node and the browser). */
export async function loadDeliverySettings(
  supabaseUrl: string | undefined,
  apiKey: string | undefined,
): Promise<DeliverySettings> {
  if (!supabaseUrl || !apiKey) {
    throw new Error('Supabase URL and key are required to load delivery settings')
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/delivery_settings?id=eq.1&select=*`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  // Table not created yet (migration 019 pending) — fall back to the seed values
  if (res.status === 404) {
    console.warn('delivery_settings table not found; using defaults')
    return DEFAULT_DELIVERY_SETTINGS
  }
  if (!res.ok) throw new Error(`Failed to load delivery settings (${res.status})`)

  const [row] = await res.json()
  return normalizeDeliverySettings(row)
}

// --- Formatting & copy tokens ---

export function formatMoney(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`
}

export function formatMiles(miles: number): string {
  return Number.isInteger(miles) ? String(miles) : miles.toFixed(1)
}

/** "free" or "$10" — reads naturally after "pick it up …" */
export function pickupPriceText(s: DeliverySettings): string {
  return s.pickup_fee > 0 ? formatMoney(s.pickup_fee) : 'free'
}

/** Placeholders admins can use in any pickup/delivery text and in FAQ answers. */
export function deliveryTokens(s: DeliverySettings): Record<string, string> {
  return {
    delivery_fee: formatMoney(s.delivery_base_fee),
    included_miles: formatMiles(s.delivery_included_miles),
    extra_mile_rate: formatMoney(s.delivery_rate_per_extra_mile),
    max_miles: formatMiles(s.delivery_max_miles),
    pickup_price: pickupPriceText(s),
    pickup_exit: s.pickup_exit,
    pickup_street: s.pickup_street,
    pickup_area: s.pickup_area,
  }
}

/** Replace `{token}` placeholders; unknown tokens are left as-is. */
export function fillDeliveryTokens(text: string, s: DeliverySettings): string {
  const tokens = deliveryTokens(s)
  return text.replace(/\{(\w+)\}/g, (match, key: string) => tokens[key] ?? match)
}

// --- Pricing ---

/** Base fee covers the included miles; extra miles are rounded per the setting. */
export function calculateDeliveryFee(
  miles: number,
  s: DeliverySettings,
): { fee: number; extraMiles: number } {
  // Distances are quoted to 0.1 mi; round first so float noise can't add a mile
  const over = Math.max(0, Math.round((miles - s.delivery_included_miles) * 10) / 10)
  const extraMiles =
    s.delivery_mile_rounding === 'up'
      ? Math.ceil(over)
      : s.delivery_mile_rounding === 'nearest'
        ? Math.round(over)
        : s.delivery_mile_rounding === 'down'
          ? Math.floor(over)
          : over

  const fee = s.delivery_base_fee + extraMiles * s.delivery_rate_per_extra_mile
  return { fee: Math.round(fee * 100) / 100, extraMiles }
}

// --- Road distance ---

const METERS_PER_MILE = 1609.344
const REQUEST_TIMEOUT_MS = 8000
// Nominatim and OSRM usage policies require an identifying User-Agent
const USER_AGENT = 'SpokaneMobileSauna/1.0 (delivery quotes)'
// Nominatim fallback is limited to the greater Spokane region (lon/lat box)
const NOMINATIM_VIEWBOX = '-118.6,48.4,-116.2,46.9'

export interface LatLng {
  lat: number
  lng: number
}

export interface DeliveryQuote {
  miles: number
  durationMinutes: number
  extraMiles: number
  fee: number
  withinServiceArea: boolean
  matchedAddress: string
  // Pricing the fee was computed with, so the UI explains exactly what was charged
  baseFee: number
  includedMiles: number
  ratePerExtraMile: number
  maxMiles: number
}

export class DeliveryQuoteError extends Error {
  status: number

  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}

/** Parse the `DELIVERY_ORIGIN` secret ("lat,lng"). */
export function parseOrigin(value: string | undefined): LatLng {
  const [lat, lng] = (value ?? '').split(',').map((v) => Number(v.trim()))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('DELIVERY_ORIGIN must be set as "lat,lng"')
  }
  return { lat, lng }
}

async function fetchJson(url: URL | string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
  return res.json()
}

/** US Census Geocoder — public domain, no key, US street addresses only. */
async function geocodeCensus(
  address: string,
): Promise<{ point: LatLng; label: string } | null> {
  const url = new URL(
    'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress',
  )
  url.searchParams.set('address', address)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')

  try {
    const json = await fetchJson(url)
    const match = json?.result?.addressMatches?.[0]
    if (!match) return null
    return {
      point: { lat: match.coordinates.y, lng: match.coordinates.x },
      label: match.matchedAddress,
    }
  } catch (err) {
    console.error('Census geocoder failed:', err)
    return null
  }
}

/** Nominatim (OpenStreetMap) — fallback for addresses Census can't match. */
async function geocodeNominatim(
  address: string,
): Promise<{ point: LatLng; label: string } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', address)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'us')
  url.searchParams.set('viewbox', NOMINATIM_VIEWBOX)
  url.searchParams.set('bounded', '1')
  url.searchParams.set('limit', '1')

  try {
    const [hit] = await fetchJson(url, { 'User-Agent': USER_AGENT })
    if (!hit) return null
    const a = hit.address ?? {}
    const street = [a.house_number, a.road].filter(Boolean).join(' ')
    const city = a.city ?? a.town ?? a.village ?? a.hamlet
    const label =
      [street, city, [a.state, a.postcode].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ') || hit.display_name
    return { point: { lat: Number(hit.lat), lng: Number(hit.lon) }, label }
  } catch (err) {
    console.error('Nominatim geocoder failed:', err)
    return null
  }
}

/** OSRM driving route over the OpenStreetMap road network. */
async function drivingRoute(
  from: LatLng,
  to: LatLng,
): Promise<{ meters: number; seconds: number }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`

  let json
  try {
    json = await fetchJson(url, { 'User-Agent': USER_AGENT })
  } catch (err) {
    console.error('OSRM routing failed:', err)
    throw new DeliveryQuoteError(
      'Our distance service is temporarily unavailable. Please try again in a minute.',
      503,
    )
  }

  const route = json?.routes?.[0]
  if (json?.code !== 'Ok' || !route) {
    throw new DeliveryQuoteError("We couldn't find a driving route to that address.")
  }
  return { meters: route.distance, seconds: route.duration }
}

export async function quoteDelivery(
  address: string,
  origin: LatLng,
  settings: DeliverySettings,
): Promise<DeliveryQuote> {
  if (!settings.delivery_enabled) {
    throw new DeliveryQuoteError('Delivery is currently unavailable.', 409)
  }

  const query = address.trim()
  if (query.length < 5) {
    throw new DeliveryQuoteError('Please enter a full street address.', 400)
  }

  const geo = (await geocodeCensus(query)) ?? (await geocodeNominatim(query))
  if (!geo) {
    throw new DeliveryQuoteError(
      "We couldn't find that address. Please include the street, city, and ZIP code.",
    )
  }

  const { meters, seconds } = await drivingRoute(origin, geo.point)
  const miles = Math.round((meters / METERS_PER_MILE) * 10) / 10
  const { fee, extraMiles } = calculateDeliveryFee(miles, settings)

  return {
    miles,
    durationMinutes: Math.round(seconds / 60),
    extraMiles,
    fee,
    withinServiceArea: miles <= settings.delivery_max_miles,
    matchedAddress: geo.label,
    baseFee: settings.delivery_base_fee,
    includedMiles: settings.delivery_included_miles,
    ratePerExtraMile: settings.delivery_rate_per_extra_mile,
    maxMiles: settings.delivery_max_miles,
  }
}
