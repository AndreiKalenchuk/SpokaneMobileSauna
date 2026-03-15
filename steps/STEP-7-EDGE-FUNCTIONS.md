# Step 7: Supabase Edge Functions (Payment + Webhook + Contact)

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. The frontend (React + Vite) and database (Supabase) are built. The checkout UI from Step 6 calls `supabase.functions.invoke('create-payment-intent')`. Now write the 3 Supabase Edge Functions that handle server-side logic.

Supabase Edge Functions use **Deno** (not Node.js). Import from `https://esm.sh/` for npm packages. Access secrets via `Deno.env.get('KEY')`.

## Edge Function 1: `supabase/functions/create-payment-intent/index.ts`

**Triggered by:** `supabase.functions.invoke('create-payment-intent', { body })` from the React app

**Input body:**
```json
{
  "rental_date": "2026-03-21",
  "items": [
    { "product_id": "uuid", "quantity": 1 },
    { "product_id": "uuid", "quantity": 2 }
  ],
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-0123",
    "address": "123 Main St, City, ST 12345",
    "notes": "Optional special requests"
  }
}
```

**Logic:**
1. Initialize Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (for write access)
2. Initialize Stripe with `STRIPE_SECRET_KEY`
3. **Validate availability:** query `bookings` table — if `rental_date` has a booking with status not 'cancelled', return 409 error "Date not available". Also check `blocked_dates`.
4. **Fetch products and pricing rules** from DB
5. **Recalculate price server-side** using the same logic as the frontend `getPriceForDate()` — never trust client prices. Sum up all items.
6. Calculate tax (8% configurable)
7. **Create Stripe PaymentIntent:**
   ```
   stripe.paymentIntents.create({
     amount: totalInCents,
     currency: 'usd',
     metadata: { booking_number, rental_date, customer_email }
   })
   ```
8. **Generate booking_number:** format `SAU-YYYYMMDD-XXXX` where XXXX is random alphanumeric
9. **Insert booking** into `bookings` table with status `pending`, `stripe_payment_intent_id`
10. **Insert booking_items** for each product
11. **Return:** `{ clientSecret: paymentIntent.client_secret, bookingId: booking.id, bookingNumber }`

**Error responses:** 400 for validation errors, 409 for date conflict, 500 for server errors. Always return JSON with `{ error: "message" }`.

## Edge Function 2: `supabase/functions/stripe-webhook/index.ts`

**Triggered by:** Stripe sends POST to this function's public URL

**IMPORTANT:** This function must be configured to **skip JWT verification** since Stripe sends unsigned requests. Add to the function config or handle in code.

**Logic:**
1. Read the raw request body
2. Get `stripe-signature` header
3. Verify with `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
4. Handle event types:
   - `payment_intent.succeeded`:
     - Find booking by `stripe_payment_intent_id`
     - Update booking status to `confirmed`
     - Update `updated_at`
     - Send confirmation email via Resend:
       - To: customer_email
       - Subject: "Your Sauna Booking is Confirmed — {booking_number}"
       - HTML body: booking details, date, items, total, delivery address, what to prepare, cancellation policy
   - `payment_intent.payment_failed`:
     - Find booking by `stripe_payment_intent_id`
     - Update status to `cancelled`
5. Return 200 OK (Stripe expects this)

**Resend email:** Use `https://esm.sh/resend` with `RESEND_API_KEY`. Send from `FROM_EMAIL`.

## Edge Function 3: `supabase/functions/contact-form/index.ts`

**Triggered by:** `supabase.functions.invoke('contact-form', { body })` from the contact page

**Input body:** `{ name, email, phone, subject, message }`

**Logic:**
1. Validate: name and email required
2. Send email via Resend:
   - To: the business email (from `FROM_EMAIL` or a separate `CONTACT_EMAIL` env var)
   - Reply-To: the customer's email
   - Subject: "Contact Form: {subject} — from {name}"
   - Body: formatted message with all fields
3. Return `{ success: true }`

## Also update the frontend

Update `src/pages/ContactPage.tsx` to actually call the `contact-form` Edge Function on submit (remove the placeholder from Step 4).

Update `src/lib/stripe.ts` and the checkout flow to use the real `create-payment-intent` function instead of the mock.

## Expected result

After deploying these functions (see Step 7B for manual deploy steps), the full booking + payment flow should work end-to-end in Stripe test mode.
