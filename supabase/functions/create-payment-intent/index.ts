import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const TAX_RATE = 0.089

interface RequestBody {
  rental_date: string
  items: { product_id: string; quantity: number }[]
  customer: {
    name: string
    email: string
    phone: string
    delivery_address: string
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { rental_date, items, customer } = body

    if (!rental_date || !items?.length || !customer?.name || !customer?.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    subtotal = Math.round(subtotal * 100) / 100
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100
    const totalInCents = Math.round(totalAmount * 100)

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
        tax_amount: taxAmount,
        total_amount: totalAmount,
        stripe_payment_intent_id: paymentIntent.id,
        delivery_address: customer.delivery_address || null,
        notes: customer.notes || null,
      })
      .select('id')
      .single()

    if (bookingError) {
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
