# Step 6: Checkout + Stripe Payment UI

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind + shadcn/ui. The booking calendar (Step 5) stores the selected date, add-ons, and totals in a Zustand store. Now build the checkout flow where users enter their info and pay.

## Task

Build the checkout step. This can be:
- A second step on the BookingPage (show/hide with a step indicator), OR
- A slide-in panel, OR
- A separate route `/book/checkout`

Choose whichever provides the best UX. The key is: the user should not lose their calendar selections when entering checkout.

## Checkout Layout

### Order Summary (sticky sidebar on desktop, collapsible on mobile)
- Selected date
- All line items (sauna + add-ons with quantities)
- Subtotal, tax, total
- "Edit" link to go back to the calendar

### Customer Info Form
Use React Hook Form + Zod validation:
- Full Name (required)
- Email (required, valid email format)
- Phone Number (required)
- Delivery Address (required, textarea)
- Special Requests / Notes (optional textarea)

### Payment Section
- Use Stripe's `<Elements>` provider and `<PaymentElement>` component
- For now, the PaymentElement needs a `clientSecret` to render. Since the Edge Function doesn't exist yet, **mock the flow**:
  - Create a placeholder function `createPaymentIntent(bookingData)` in `src/lib/stripe.ts` that returns a fake `clientSecret` for development
  - Wire up the real flow: when the user clicks "Continue to Payment", call `supabase.functions.invoke('create-payment-intent', { body: { rental_date, items, customer } })` which will return `{ clientSecret, bookingId }`
  - If the Edge Function isn't deployed yet, show the payment form in a disabled state with a message "Payment processing will be connected in the next step"
- Show the Stripe Payment Element (handles cards, Apple Pay, Google Pay)
- "Pay $XXX.XX" button that calls `stripe.confirmPayment()`
- Terms checkbox: "I agree to the Rental Terms & Conditions" with link to `/terms`

### On Successful Payment
- Redirect to `/booking/confirmation/:bookingId`

### Booking Confirmation Page (`src/pages/BookingConfirmationPage.tsx`)
- Fetch booking details from Supabase by the `:id` param
- Show:
  - Green checkmark animation (Framer Motion)
  - "Your Sauna is Booked!" heading
  - Booking number
  - Summary: date, delivery address, items, total paid
  - "A confirmation email has been sent to [email]"
  - What to expect: "We'll contact you 24h before", "Ensure area is clear"
  - Buttons: "Return to Home", "Add to Calendar" (generate .ics file download)

## Error Handling
- Form validation errors shown inline
- Payment errors shown as an alert/toast above the payment form
- If the selected date becomes unavailable between calendar selection and payment, show a clear error: "This date is no longer available. Please select another date." and redirect back to calendar.

## Requirements
- Fully responsive
- Clear step indicator showing progress (1. Select Date → 2. Your Info → 3. Payment)
- Disabled "Pay" button with spinner while processing
- Use `react-helmet-async`: title "Checkout — [Business Name]"
