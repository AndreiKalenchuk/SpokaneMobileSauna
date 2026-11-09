import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno&no-check'
import { Resend } from 'https://esm.sh/resend@2'
import {
  DEFAULT_DELIVERY_SETTINGS,
  fillDeliveryTokens,
  loadDeliverySettings,
} from '../_shared/delivery.ts'

type SupabaseClient = ReturnType<typeof createClient>

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
    // Emails must still go out if settings can't load — fall back to defaults
    const settings = await loadDeliverySettings(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    ).catch((err) => {
      console.error('Failed to load delivery settings:', err)
      return DEFAULT_DELIVERY_SETTINGS
    })
    const isPickup = booking.fulfillment_method === 'pickup'
    const fulfillmentFee = Number(booking.fulfillment_fee ?? 0)
    const fulfillmentHtml = isPickup
      ? `<p><strong>Fulfillment:</strong> Pickup — off ${settings.pickup_exit} (${settings.pickup_street})</p>`
      : `<p><strong>Fulfillment:</strong> Delivery${booking.delivery_distance_miles ? ` (${Number(booking.delivery_distance_miles).toFixed(1)} mi)` : ''}</p>
            <p><strong>Delivery Address:</strong> ${booking.delivery_address || 'N/A'}</p>`
    const prepareHtml = (isPickup ? settings.pickup_instructions : settings.delivery_instructions)
      .map((line) => `<li>${fillDeliveryTokens(line, settings)}</li>`)
      .join('')

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
            ${fulfillmentHtml}
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
              ${fulfillmentFee > 0 ? `<tr>
                <td colspan="3" style="padding:8px;text-align:right">${isPickup ? 'Pickup' : 'Delivery'}</td>
                <td style="padding:8px;text-align:right">$${fulfillmentFee.toFixed(2)}</td>
              </tr>` : ''}
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
            ${prepareHtml}
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
              ${isPickup
                ? `<p><strong>Fulfillment:</strong> PICKUP — customer collects the trailer (fee $${fulfillmentFee.toFixed(2)})</p>`
                : `<p><strong>Fulfillment:</strong> DELIVERY — ${Number(booking.delivery_distance_miles ?? 0).toFixed(1)} mi, fee $${fulfillmentFee.toFixed(2)}</p>
              <p><strong>Delivery Address:</strong> ${booking.delivery_address || 'N/A'}</p>`}
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
      await handlePrivateSuccess(supabase, paymentIntent)
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (error) {
        console.error('Failed to cancel booking:', error)
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
