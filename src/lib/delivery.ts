import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import {
  formatMiles,
  pickupPriceText,
} from '../../supabase/functions/_shared/delivery.ts'
import type {
  DeliveryQuote,
  DeliverySettings,
} from '../../supabase/functions/_shared/delivery.ts'

/**
 * Pricing and copy helpers come straight from the edge functions' shared module
 * (it is pure TS), so the browser and the server can't drift apart. Prices and
 * text are admin-editable; read them with useDeliverySettings().
 */
export {
  DEFAULT_DELIVERY_SETTINGS,
  MILE_ROUNDING_OPTIONS,
  calculateDeliveryFee,
  fillDeliveryTokens,
  formatMiles,
  formatMoney,
  normalizeDeliverySettings,
  pickupPriceText,
} from '../../supabase/functions/_shared/delivery.ts'
export type {
  DeliveryQuote,
  DeliverySettings,
  MileRounding,
} from '../../supabase/functions/_shared/delivery.ts'

export type FulfillmentMethod = 'delivery' | 'pickup'

/** "Delivery within 50 driving miles · Free pickup off I-90 Exit 280A" — footer/contact copy. */
export function serviceAreaText(s: DeliverySettings): string {
  const delivery = `Delivery within ${formatMiles(s.delivery_max_miles)} driving miles`
  const price = pickupPriceText(s)
  const pickup = `${price.charAt(0).toUpperCase()}${price.slice(1)} pickup off ${s.pickup_exit}`
  return [s.delivery_enabled && delivery, s.pickup_enabled && pickup].filter(Boolean).join(' · ')
}

/** Delivery/pickup fee for the current selection — 0 until a delivery quote is usable. */
export function fulfillmentFeeFor(
  method: FulfillmentMethod | null,
  quote: DeliveryQuote | null,
  settings: DeliverySettings,
): number {
  if (method === 'pickup') return settings.pickup_fee
  return method === 'delivery' && quote?.withinServiceArea ? quote.fee : 0
}

/**
 * Driving-distance quote for an address. The origin never reaches the client:
 * production calls the `delivery-quote` edge function; `npm run dev` calls the
 * Vite middleware in vite.config.ts, which runs the same shared module.
 */
export async function fetchDeliveryQuote(address: string): Promise<DeliveryQuote> {
  if (import.meta.env.DEV) {
    const res = await fetch('/__dev/delivery-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'Could not calculate delivery')
    return body as DeliveryQuote
  }

  const { data, error } = await supabase.functions.invoke('delivery-quote', {
    body: { address },
  })
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    throw new Error(body?.error ?? 'Could not calculate delivery')
  }
  if (error) throw error
  return data as DeliveryQuote
}
