# Step 5: Booking Calendar + Dynamic Pricing

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind + shadcn/ui. Supabase connected. Data hooks and pricing utility exist. This is the most important page — the booking flow.

## Task

Build the Booking page at `src/pages/BookingPage.tsx` with an interactive calendar and dynamic pricing.

## Layout

### Page Header
- Title: "Book Your Sauna"
- Subtitle: "Select a date, customize your experience, and reserve in minutes."

### Two-column layout (desktop) / stacked (mobile)

**Left column: Calendar + Rental Info**

1. **Rental Description Panel** (collapsible on mobile)
   What's included in every rental:
   - Daily rental period (delivered before 2PM, pickup next day after 10 AM)
   - Free delivery within 20 miles
   - Professional setup & teardown
   - Safety orientation walkthrough
   - Cedar bucket, ladle, thermometer
   - Seating for up to 6
   - Firewood to build a temperature(~1h) and 40 min sauna session.
   - Fine print: "Up to 15% slope, accessible surface required. 4ft clearance from structures."

2. **Interactive Calendar** using `react-day-picker`
   - Month grid view with navigation arrows
   - Fetch data using `useAvailability()` and `usePricingRules()`
   - Use `getPriceForDate()` from `src/lib/pricing.ts` to show prices
   - **Date cell visual states:**
     - Available (weekday): clickable, show price "$229" in small text below date number, default styling
     - Available (weekend): clickable, show price "$289", slightly different accent color (amber tint)
     - Holiday: clickable, show price "$319", gold badge/accent
     - Booked/Unavailable: grayed out, strikethrough, not clickable
     - Blocked: grayed out with a small lock or wrench icon
     - Selected: primary brand color ring/fill
   - Color legend below the calendar
   - Past dates should be disabled
   - Only show current month and future months

**Right column: Pricing Breakdown** (sticky on desktop)

Updates dynamically when a date is selected:

1. **Selected date** displayed prominently: "Saturday, March 21, 2026"
2. **Main product line item:**
   - Mobile Sauna (1 × $319.00) ........ $319.00
3. **Add-Ons section:**
   Fetch add-on products from Supabase. Each as a toggleable card:
   - Checkbox + image thumbnail + name + short description + price for selected date
   - Extra Firewood Bundle: "+5.99" with quantity selector (1–5)
   - Aromatherapy Kit: "+$5.99"
   - Add-on prices must also use `getPriceForDate()` for the selected date
4. **Delivery distance** (address or mile estimate by zip, adds surcharge if >20 miles at $2.99/mile)
5. **Price summary:**
   - Subtotal
   - Tax (calculate at a configurable rate, e.g., 8%) business located in Spokane WA
   - **Total** (bold, large)
6. **"Continue to Checkout" button** — disabled until a date is selected. Links to the checkout step (Step 6).

## State Management

Use the Zustand `bookingStore` to track:
- `selectedDate: Date | null`
- `selectedAddons: { productId: string, quantity: number }[]`
- `deliveryMiles: number`
- Computed: `subtotal`, `tax`, `total`

Update the store when the user selects a date, toggles an add-on, or changes a quantity. The pricing breakdown reads from the store.

## Requirements
- Calendar must work perfectly on mobile (375px). On mobile, the pricing breakdown should appear below the calendar as a collapsible panel or bottom sheet.
- Show loading skeleton while availability data loads
- Smooth animations when add-ons are toggled (Framer Motion)
- Use `react-helmet-async`: title "Book Your Sauna — [Business Name]"
