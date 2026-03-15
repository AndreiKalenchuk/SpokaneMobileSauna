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
   - 24-hour rental period (delivered 10 AM, pickup next day 10 AM)
   - Free delivery within 20 miles
   - Professional setup & teardown
   - Safety orientation walkthrough
   - Cedar bucket, ladle, thermometer
   - Seating for up to 6
   - 1 bundle of firewood (~2–3 hours burn time)
   - Towels and seat covers
   - Fine print: "Flat, accessible surface required. 10ft clearance from structures."

2. **Interactive Calendar** using `react-day-picker`
   - Month grid view with navigation arrows
   - Fetch data using `useAvailability()` and `usePricingRules()`
   - Use `getPriceForDate()` from `src/lib/pricing.ts` to show prices
   - **Date cell visual states:**
     - Available (weekday): clickable, show price "$350" in small text below date number, default styling
     - Available (weekend): clickable, show price "$450", slightly different accent color (amber tint)
     - Holiday: clickable, show price "$550", gold badge/accent
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
   - Mobile Sauna (1 × $450.00) ........ $450.00
3. **Add-Ons section:**
   Fetch add-on products from Supabase. Each as a toggleable card:
   - Checkbox + image thumbnail + name + short description + price for selected date
   - Cold Plunge Tub: "+$150.00" (price varies by date)
   - Extra Firewood Bundle: "+$15.00" with quantity selector (1–5)
   - Aromatherapy Kit: "+$25.00"
   - Add-on prices must also use `getPriceForDate()` for the selected date
4. **Delivery distance** (optional input — address or mile estimate, adds surcharge if >20 miles at $3/mile)
5. **Price summary:**
   - Subtotal
   - Tax (calculate at a configurable rate, e.g., 8%)
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
