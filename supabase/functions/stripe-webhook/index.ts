import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno&no-check'
import { Resend } from 'https://esm.sh/resend@2'

type SupabaseClient = ReturnType<typeof createClient>

function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function handlePrivateSuccess(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select('*, booking_items(*, products(name))')
    .single()

  if (bookingError || !booking) {
    console.error('Failed to update booking:', bookingError)
    return
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@mobilesaunarental.com'
    const resend = new Resend(resendKey!)

    const rentalDateFormatted = formatDate(booking.rental_date)

    const itemsHtml = booking.booking_items
      .map(
        (item: { products: { name: string }; quantity: number; unit_price: number; total_price: number }) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.products.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(item.unit_price).toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(item.total_price).toFixed(2)}</td>
          </tr>`,
      )
      .join('')

    await resend.emails.send({
      from: fromEmail,
      to: booking.customer_email,
      subject: `Your Sauna Booking is Confirmed — ${booking.booking_number}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
          <h1 style="color:#5C3D2E">Booking Confirmed!</h1>
          <p>Hi ${booking.customer_name},</p>
          <p>Your mobile sauna rental has been confirmed. Here are your booking details:</p>

          <div style="background:#f9f6f3;padding:20px;border-radius:8px;margin:20px 0">
            <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
            <p><strong>Date:</strong> ${rentalDateFormatted}</p>
            <p><strong>Delivery Address:</strong> ${booking.delivery_address || 'N/A'}</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>

          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#5C3D2E;color:#fff">
                <th style="padding:10px;text-align:left">Item</th>
                <th style="padding:10px;text-align:center">Qty</th>
                <th style="padding:10px;text-align:right">Unit Price</th>
                <th style="padding:10px;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:8px;text-align:right">Subtotal</td>
                <td style="padding:8px;text-align:right">$${Number(booking.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding:8px;text-align:right">Tax</td>
                <td style="padding:8px;text-align:right">$${Number(booking.tax_amount).toFixed(2)}</td>
              </tr>
              <tr style="font-weight:bold;font-size:1.1em">
                <td colspan="3" style="padding:8px;text-align:right;border-top:2px solid #333">Total</td>
                <td style="padding:8px;text-align:right;border-top:2px solid #333">$${Number(booking.total_amount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <h2 style="color:#5C3D2E;margin-top:30px">What to Prepare</h2>
          <ul>
            <li>Clear a flat, level area of at least 12×12 feet for sauna placement</li>
            <li>Ensure access for our delivery vehicle (standard driveway width)</li>
            <li>Have towels and water ready for your session</li>
            <li>We handle all setup and breakdown — just enjoy!</li>
          </ul>

          <h2 style="color:#5C3D2E">Cancellation Policy</h2>
          <p>Free cancellation up to 48 hours before your rental date. Cancellations within 48 hours are subject to a 50% charge. No-shows are charged the full amount.</p>

          <p style="margin-top:30px;color:#888;font-size:0.9em">
            Questions? Reply to this email or call us at (555) 123-4567.<br>
            Thank you for choosing Mobile Sauna Rental!
          </p>
        </div>
      `,
    })

    const ownerEmail = Deno.env.get('OWNER_EMAIL')
    if (ownerEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: ownerEmail,
        subject: `New Booking! ${booking.booking_number} — $${Number(booking.total_amount).toFixed(2)}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
            <h1 style="color:#5C3D2E">New Booking Received</h1>

            <div style="background:#f9f6f3;padding:20px;border-radius:8px;margin:20px 0">
              <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
              <p><strong>Customer:</strong> ${booking.customer_name}</p>
              <p><strong>Email:</strong> ${booking.customer_email}</p>
              <p><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</p>
              <p><strong>Rental Date:</strong> ${rentalDateFormatted}</p>
              <p><strong>Delivery Address:</strong> ${booking.delivery_address || 'N/A'}</p>
              ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>

            <p style="font-size:1.2em;font-weight:bold;color:#5C3D2E">
              Total: $${Number(booking.total_amount).toFixed(2)}
            </p>
          </div>
        `,
      })
    }
  } catch (emailErr) {
    console.error('Failed to send private confirmation email:', emailErr)
  }
}

async function handleCommunitySuccess(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const { data: booking, error: bookingError } = await supabase
    .from('community_bookings')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select('*')
    .single()

  if (bookingError || !booking) {
    console.error('Failed to update community booking:', bookingError)
    return
  }

  const { data: event } = await supabase
    .from('community_events')
    .select('*')
    .eq('event_date', booking.event_date)
    .maybeSingle()

  const location = event?.location ?? '1921 W 10th Ave, Spokane, WA 99204'
  const eventDateFormatted = formatDate(booking.event_date)
  const slotTimeFormatted = formatTime(booking.slot_time)

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@mobilesaunarental.com'
    const resend = new Resend(resendKey!)

    await resend.emails.send({
      from: fromEmail,
      to: booking.customer_email,
      subject: `Community Sauna Reservation Confirmed — ${booking.booking_number}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
          <h1 style="color:#5C3D2E">Your Community Sauna seat is reserved!</h1>
          <p>Hi ${booking.customer_name},</p>
          <p>Thanks for joining our weekly Community Sauna. We can't wait to see you. Here are your details:</p>

          <div style="background:#f9f6f3;padding:20px;border-radius:8px;margin:20px 0">
            <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
            <p><strong>Date:</strong> ${eventDateFormatted}</p>
            <p><strong>Arrival Time:</strong> ${slotTimeFormatted}</p>
            <p><strong>Guests:</strong> ${booking.quantity}</p>
            <p><strong>Location:</strong> ${location}</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>

          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr>
              <td style="padding:8px;text-align:right">Subtotal</td>
              <td style="padding:8px;text-align:right;width:120px">$${Number(booking.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:8px;text-align:right">Tax</td>
              <td style="padding:8px;text-align:right">$${Number(booking.tax_amount).toFixed(2)}</td>
            </tr>
            <tr style="font-weight:bold;font-size:1.1em">
              <td style="padding:8px;text-align:right;border-top:2px solid #333">Total Paid</td>
              <td style="padding:8px;text-align:right;border-top:2px solid #333">$${Number(booking.total_amount).toFixed(2)}</td>
            </tr>
          </table>

          <h2 style="color:#5C3D2E;margin-top:30px">What to bring</h2>
          <ul>
            <li>Towel and robe</li>
            <li>Change of clothes and sandals</li>
            <li>Water bottle — stay hydrated</li>
            <li>Arrive 10 minutes before your time slot</li>
          </ul>

          <h2 style="color:#5C3D2E">Cancellation Policy</h2>
          <p>Please cancel at least 2 hours before your arrival time so we can free up the seat for someone else.</p>

          <p style="margin-top:30px;color:#888;font-size:0.9em">
            Questions? Reply to this email. See you at the sauna!
          </p>
        </div>
      `,
    })

    const ownerEmail = Deno.env.get('OWNER_EMAIL')
    if (ownerEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: ownerEmail,
        subject: `New Community Booking — ${booking.booking_number} (${booking.quantity}× at ${slotTimeFormatted})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
            <h1 style="color:#5C3D2E">New Community Sauna Reservation</h1>

            <div style="background:#f9f6f3;padding:20px;border-radius:8px;margin:20px 0">
              <p><strong>Booking Number:</strong> ${booking.booking_number}</p>
              <p><strong>Customer:</strong> ${booking.customer_name}</p>
              <p><strong>Email:</strong> ${booking.customer_email}</p>
              <p><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</p>
              <p><strong>Date:</strong> ${eventDateFormatted}</p>
              <p><strong>Arrival:</strong> ${slotTimeFormatted}</p>
              <p><strong>Guests:</strong> ${booking.quantity}</p>
              ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>

            <p style="font-size:1.2em;font-weight:bold;color:#5C3D2E">
              Total: $${Number(booking.total_amount).toFixed(2)}
            </p>
          </div>
        `,
      })
    }
  } catch (emailErr) {
    console.error('Failed to send community confirmation email:', emailErr)
  }
}

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    let event: Stripe.Event
    try {
      const cryptoProvider = Stripe.createSubtleCryptoProvider()
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingType = paymentIntent.metadata?.booking_type

      if (bookingType === 'community') {
        await handleCommunitySuccess(supabase, paymentIntent)
      } else {
        await handlePrivateSuccess(supabase, paymentIntent)
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingType = paymentIntent.metadata?.booking_type
      const table = bookingType === 'community' ? 'community_bookings' : 'bookings'

      const { error } = await supabase
        .from(table)
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (error) {
        console.error(`Failed to cancel ${table}:`, error)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('stripe-webhook error:', err)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
