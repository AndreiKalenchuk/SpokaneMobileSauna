# Step 7B: Deploy Edge Functions + Configure Stripe Webhook (YOU do this)

After the AI writes the Edge Functions in Step 7, deploy them and wire up Stripe.

---

## 1. Set Supabase Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_51TB204GuFwIacsDYCK1ZtduGWVmGlOMShbzJfG26g7E3v6jOZHAu4vWGl575aiRfHJn3qNl6diQZrXM3TBh5skht00u3VXzED5
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER
supabase secrets set RESEND_API_KEY=re_3BZn6zK4_62DGtpetT7zDQNxkk1BdvSET
supabase secrets set FROM_EMAIL=velez.housing.llc@gmail.com
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncW1lYW54bW1venZwa2R4Y2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyNzYyMCwiZXhwIjoyMDg5MTAzNjIwfQ.ZSMgEcfMHIicOLiVwnRYQCzXnSJKUpE9b1zBHSo0Fe8
```

Note: `STRIPE_WEBHOOK_SECRET` is a placeholder — you'll get the real one in step 3 below.

## 2. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy contact-form
```

The `--no-verify-jwt` flag on `stripe-webhook` is critical — Stripe sends requests without a Supabase JWT.

After deploying, note the function URLs. They look like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

## 3. Configure Stripe Webhook

- [ ] Go to **Stripe Dashboard → Developers → Webhooks**
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- [ ] Events to listen to: select `payment_intent.succeeded` and `payment_intent.payment_failed`
- [ ] Click "Add endpoint"
- [ ] **Copy the "Signing secret"** (starts with `whsec_...`)
- [ ] Update the Supabase secret with the real value:
  ```bash
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_DtFBZreF4tLTLZS0YbOyShzGXCZbtHiO
  ```

## 4. Test the Full Flow

- [ ] Go to your local site (`npm run dev`) → Book page → select a date → add items → checkout
- [ ] Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Verify:
  - [ ] Payment succeeds in Stripe Dashboard → Payments
  - [ ] Booking appears in Supabase → bookings table with status `confirmed`
  - [ ] Confirmation page displays correctly
  - [ ] Email is sent (check Resend dashboard → Emails)

## 5. Test the Contact Form

- [ ] Go to `/contact`, fill in the form, submit
- [ ] Check Resend dashboard — email should appear
- [ ] Success toast should show on the page

---

## Troubleshooting

**Edge Function errors:** Check logs with:
```bash
supabase functions logs create-payment-intent
supabase functions logs stripe-webhook
```

**Stripe webhook failing:** Check Stripe Dashboard → Developers → Webhooks → click your endpoint → see "Recent deliveries" for error details.

**CORS errors:** Supabase Edge Functions handle CORS automatically for calls via `supabase.functions.invoke()`. If you're calling directly, you may need to add CORS headers.

---

*Delete this file after the full payment flow works end-to-end.*
