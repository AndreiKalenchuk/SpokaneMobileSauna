import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import {
  DeliveryQuoteError,
  loadDeliverySettings,
  parseOrigin,
  quoteDelivery,
} from '../_shared/delivery.ts'
import { couponDiscount, normalizeCouponCode } from '../_shared/coupons.ts'
import type { CouponCheck } from '../_shared/coupons.ts'

const TAX_RATE = 0.089
// Stripe's minimum charge in USD
const MIN_CHARGE_CENTS = 50
// An unpaid intent the customer walked away from; anything later is paid or paying
const ABANDONABLE_INTENT_STATUSES = ['requires_payment_method', 'requires_confirmation', 'requires_action']

type FulfillmentMethod = 'delivery' | 'pickup'

interface RequestBody {
  rental_date: string
  fulfillment_method?: FulfillmentMethod
  items: { product_id: string; quantity: number }[]
  coupon_code?: string
  // The customer's own unpaid booking from an earlier attempt (they went back
  // from the payment step); it is released so it doesn't block the date
  replace_booking_id?: string
  customer: {
    name: string
    email: string
    phone: string
    delivery_address?: string
    notes?: string
  }
}

function generateBookingNumber(date: string): string {
  const dateCompact = date.replace(/-/g, '')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SAU-${dateCompact}-${suffix}`
}

function getPriceForDate(
  product: { id: string; base_price: number },
  dateStr: string,
  pricingRules: {
    product_id: string
    is_active: boolean
    specific_dates: string[] | null
    day_of_week: number[] | null
    price: number
    priority: number
  }[],
): number {
  const productRules = pricingRules.filter(
    (r) => r.product_id === product.id && r.is_active,
  )

  const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay()

  let bestRule: (typeof productRules)[number] | null = null

  for (const rule of productRules) {
    let matches = false
    if (rule.specific_dates?.includes(dateStr)) {
      matches = true
    } else if (rule.day_of_week?.includes(dayOfWeek)) {
      matches = true
    }
    if (matches && (bestRule === null || rule.priority > bestRule.priority)) {
      bestRule = rule
    }
  }

  return bestRule ? bestRule.price : product.base_price
}

/**
 * Cancel an earlier unpaid attempt from the same checkout so it stops holding
 * the date and its coupon use. Its hold may already have expired (cancelled by
 * the cron job), but its PaymentIntent is still payable — cancel that too.
 * Only an id the client was given can be passed (anon can't read booking ids),
 * and a paid or paying booking is never touched.
 */
async function releaseUnpaidBooking(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  bookingId: string,
): Promise<void> {
  try {
    const { data: previous } = await supabase
      .from('bookings')
      .select('id, stripe_payment_intent_id')
      .eq('id', bookingId)
      .in('status', ['pending', 'cancelled'])
      .maybeSingle()
    if (!previous?.stripe_payment_intent_id) return

    const intent = await stripe.paymentIntents.retrieve(previous.stripe_payment_intent_id)
    if (!ABANDONABLE_INTENT_STATUSES.includes(intent.status)) return

    await stripe.paymentIntents.cancel(intent.id)
    await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', previous.id)
      .eq('status', 'pending')
  } catch (err) {
    // Not fatal: the availability check below reports the date as taken
    console.error('Failed to release earlier booking:', err)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { rental_date, items, customer } = body
    // Older clients predate the pickup option and always meant delivery
    const fulfillmentMethod = body.fulfillment_method ?? 'delivery'
    const deliveryAddress = customer?.delivery_address?.trim() ?? ''

    if (!rental_date || !items?.length || !customer?.name || !customer?.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (fulfillmentMethod !== 'delivery' && fulfillmentMethod !== 'pickup') {
      return new Response(
        JSON.stringify({ error: 'Invalid fulfillment method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (fulfillmentMethod === 'delivery' && !deliveryAddress) {
      return new Response(
        JSON.stringify({ error: 'Delivery address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    if (body.replace_booking_id) {
      await releaseUnpaidBooking(supabase, stripe, body.replace_booking_id)
    }

    // Release expired holds now rather than on the next cron tick (migration 024)
    const { error: expireError } = await supabase.rpc('expire_unpaid_bookings')
    if (expireError) console.error('Failed to expire unpaid bookings:', expireError)

    // --- Validate availability ---

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('rental_date', rental_date)
      .not('status', 'eq', 'cancelled')
      .maybeSingle()

    if (existingBooking) {
      return new Response(
        JSON.stringify({ error: 'Date not available' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('date', rental_date)
      .maybeSingle()

    if (blockedDate) {
      return new Response(
        JSON.stringify({ error: 'Date not available' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Fetch products and pricing rules ---

    const productIds = items.map((i) => i.product_id)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, base_price, is_active')
      .in('id', productIds)

    if (productsError || !products?.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid products' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: pricingRules } = await supabase
      .from('pricing_rules')
      .select('product_id, is_active, specific_dates, day_of_week, price, priority')
      .in('product_id', productIds)
      .eq('is_active', true)

    // --- Recalculate price server-side ---

    let subtotal = 0
    const lineItems: { product_id: string; quantity: number; unit_price: number; total_price: number }[] = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id)
      if (!product || !product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product ${item.product_id} not found or inactive` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const unitPrice = getPriceForDate(product, rental_date, pricingRules ?? [])
      const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100
      subtotal += totalPrice

      lineItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      })
    }

    // --- Fulfillment fee from admin settings + real driving distance (never from the client) ---

    const settings = await loadDeliverySettings(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )

    const methodEnabled =
      fulfillmentMethod === 'delivery' ? settings.delivery_enabled : settings.pickup_enabled
    if (!methodEnabled) {
      return new Response(
        JSON.stringify({ error: `${fulfillmentMethod === 'delivery' ? 'Delivery' : 'Pickup'} is currently unavailable` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let fulfillmentFee = settings.pickup_fee
    let deliveryMiles: number | null = null

    if (fulfillmentMethod === 'delivery') {
      try {
        const quote = await quoteDelivery(
          deliveryAddress,
          parseOrigin(Deno.env.get('DELIVERY_ORIGIN')),
          settings,
        )
        if (!quote.withinServiceArea) {
          return new Response(
            JSON.stringify({ error: 'Address is outside our delivery area' }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        fulfillmentFee = quote.fee
        deliveryMiles = quote.miles
      } catch (err) {
        if (err instanceof DeliveryQuoteError) {
          return new Response(
            JSON.stringify({ error: err.message }),
            { status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }
        throw err
      }
    }

    subtotal = Math.round((subtotal + fulfillmentFee) * 100) / 100

    // --- Coupon: redeemability is checked in the database, the amount here ---

    let couponId: string | null = null
    let discountAmount = 0
    const couponCode = normalizeCouponCode(body.coupon_code ?? '')

    if (couponCode) {
      const { data: check, error: checkError } = await supabase.rpc('check_coupon', {
        p_code: couponCode,
      })
      if (checkError) throw checkError
      const coupon = check as CouponCheck
      if (!coupon.valid) {
        return new Response(
          JSON.stringify({ error: 'This coupon code is no longer valid', reason: coupon.reason }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: row, error: rowError } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', coupon.code)
        .single()
      if (rowError) throw rowError

      couponId = row.id
      discountAmount = couponDiscount(subtotal, coupon)
    }

    const taxableAmount = Math.round((subtotal - discountAmount) * 100) / 100
    const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100
    const totalInCents = Math.round(totalAmount * 100)

    if (totalInCents < MIN_CHARGE_CENTS) {
      return new Response(
        JSON.stringify({ error: 'This coupon covers the whole order — please contact us to book' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Generate booking number ---

    const bookingNumber = generateBookingNumber(rental_date)

    // --- Create Stripe PaymentIntent ---

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: 'usd',
      metadata: {
        booking_number: bookingNumber,
        rental_date,
        customer_email: customer.email,
        fulfillment_method: fulfillmentMethod,
      },
    })

    // --- Insert booking ---

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        rental_date,
        status: 'pending',
        subtotal,
        coupon_id: couponId,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        stripe_payment_intent_id: paymentIntent.id,
        fulfillment_method: fulfillmentMethod,
        delivery_address:
          fulfillmentMethod === 'delivery' ? deliveryAddress : null,
        delivery_distance_miles: deliveryMiles,
        fulfillment_fee: fulfillmentFee,
        notes: customer.notes || null,
      })
      .select('id, hold_expires_at')
      .single()

    if (bookingError) {
      // Never leave a chargeable intent behind without a booking
      await stripe.paymentIntents.cancel(paymentIntent.id).catch((err) =>
        console.error('Failed to cancel orphaned PaymentIntent:', err),
      )
      // Raised by the coupon trigger, e.g. another checkout just took the last use
      const couponRefusal = bookingError.message?.match(/coupon_unavailable: (\w+)/)
      if (couponRefusal) {
        return new Response(
          JSON.stringify({ error: 'This coupon code is no longer valid', reason: couponRefusal[1] }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Insert booking items ---

    const bookingItems = lineItems.map((li) => ({
      booking_id: booking.id,
      product_id: li.product_id,
      quantity: li.quantity,
      unit_price: li.unit_price,
      total_price: li.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('booking_items')
      .insert(bookingItems)

    if (itemsError) {
      console.error('Failed to insert booking items:', itemsError)
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        bookingId: booking.id,
        bookingNumber,
        // What Stripe will charge — the checkout shows this, not its own estimate
        totalAmount,
        // Seconds until the cron job releases this booking; relative, so the
        // countdown doesn't depend on the customer's clock
        holdSeconds: Math.max(0, Math.floor((Date.parse(booking.hold_expires_at) - Date.now()) / 1000)),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('create-payment-intent error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
