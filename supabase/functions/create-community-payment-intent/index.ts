import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

const TAX_RATE = 0.089
const CUTOFF_MINUTES = 30

interface RequestBody {
  event_date: string
  slot_time: string
  quantity: number
  customer: {
    name: string
    email: string
    phone: string
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
  return `SAU-C-${dateCompact}-${suffix}`
}

function normalizeTime(t: string): string {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function getSpokaneTime(): { dateStr: string; minutes: number } {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  return { dateStr, minutes }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { event_date, slot_time, quantity, customer } = body

    if (
      !event_date ||
      !slot_time ||
      !quantity ||
      quantity < 1 ||
      !customer?.name ||
      !customer?.email
    ) {
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

    const normalizedSlot = normalizeTime(slot_time)

    // --- Validate event ---
    const { data: event } = await supabase
      .from('community_events')
      .select('*')
      .eq('event_date', event_date)
      .eq('is_active', true)
      .maybeSingle()

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'No active Community Sauna on this date' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Validate slot falls inside event window ---
    const [sh, sm] = event.start_time.slice(0, 5).split(':').map(Number)
    const [eh, em] = event.end_time.slice(0, 5).split(':').map(Number)
    const [slh, slm] = normalizedSlot.slice(0, 5).split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    const slotMin = slh * 60 + slm

    if (slotMin < startMin || slotMin + event.slot_minutes > endMin) {
      return new Response(
        JSON.stringify({ error: 'Invalid arrival time for this event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if ((slotMin - startMin) % event.slot_minutes !== 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid arrival time for this event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Same-day 30-min cutoff ---
    const spokane = getSpokaneTime()
    if (event_date < spokane.dateStr) {
      return new Response(
        JSON.stringify({ error: 'This event has already passed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (event_date === spokane.dateStr && slotMin + CUTOFF_MINUTES < spokane.minutes) {
      return new Response(
        JSON.stringify({ error: 'Booking window for this slot has closed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Capacity check ---
    const { data: existing } = await supabase
      .from('community_bookings')
      .select('quantity')
      .eq('event_date', event_date)
      .eq('slot_time', normalizedSlot)
      .neq('status', 'cancelled')

    const currentCount = (existing ?? []).reduce(
      (sum: number, row: { quantity: number }) => sum + (row.quantity ?? 0),
      0,
    )

    if (currentCount + quantity > event.capacity_per_slot) {
      return new Response(
        JSON.stringify({
          error: `Only ${Math.max(
            0,
            event.capacity_per_slot - currentCount,
          )} seat(s) remaining in this time slot`,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Price from product row ---
    const { data: product } = await supabase
      .from('products')
      .select('id, base_price, is_active')
      .eq('slug', 'community-sauna')
      .maybeSingle()

    if (!product || !product.is_active) {
      return new Response(
        JSON.stringify({ error: 'Community Sauna product is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const unitPrice = Number(product.base_price)
    const subtotal = Math.round(unitPrice * quantity * 100) / 100
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100
    const totalInCents = Math.round(totalAmount * 100)

    const bookingNumber = generateBookingNumber(event_date)

    // --- Stripe PaymentIntent ---
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInCents,
      currency: 'usd',
      metadata: {
        booking_type: 'community',
        booking_number: bookingNumber,
        event_date,
        slot_time: normalizedSlot,
        quantity: String(quantity),
        customer_email: customer.email,
      },
    })

    // --- Insert community booking ---
    const { data: booking, error: bookingError } = await supabase
      .from('community_bookings')
      .insert({
        booking_number: bookingNumber,
        event_date,
        slot_time: normalizedSlot,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        quantity,
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        stripe_payment_intent_id: paymentIntent.id,
        notes: customer.notes || null,
      })
      .select('id')
      .single()

    if (bookingError) {
      console.error('Insert community_booking failed:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
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
    console.error('create-community-payment-intent error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
