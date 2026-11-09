# Refactor Plan — Single-Service Site + Delivery/Pickup

Status legend: [ ] todo · [x] done · [!] needs owner decision / action

## Findings that shaped the plan

- The live Supabase project has **no** `community_*` tables (PostgREST returns 404) and no `community-sauna` product, so migrations 012–016 were never applied. Removal is code-only; the SQL lives on in `docs/COMMUNITY_SAUNA_IMPLEMENTATION.md`.
- The client already charges `$2.99/mi` over 20 miles, but `create-payment-intent` never adds a delivery fee, so the total on the checkout page and the amount Stripe charges already differ. The new fee replaces both sides.
- [!] **Security (pre-existing):** RLS policy `"Anon read availability: bookings"` is `USING (true)`. The public anon key can `select customer_email, customer_phone, delivery_address` on every booking. A HEAD request confirmed column access (no rows were fetched). This is out of scope here and is tracked as a follow-up, because the confirmation page also reads bookings anonymously.
- [!] Rental Terms §4 says the sauna "must not be moved, towed, or relocated". A customer-pickup option contradicts that. §4 gets a pickup clause that **needs owner/legal review**.

## Phase 1 — Remove Community Sauna

- [x] Document the feature for later: `docs/COMMUNITY_SAUNA_IMPLEMENTATION.md` (data model, logic, edge functions, admin, UI/CSS, runbook)
- [x] Delete pages `/community`, `/community/checkout`, `/community/confirmation/:id`
- [x] Delete `BookingOptionsSection`, admin `CommunityEventsTab` / `CommunityBookingsView`, hooks, `lib/community.ts`, the community store, and their tests
- [x] Delete edge functions `create-community-payment-intent`, `expand-community-series`, plus the webhook's community branch
- [x] Delete migrations 012–016 (never applied) and `COMMUNITY_SAUNA_ADMIN_GUIDE.md`
- [x] Unwire: routes, header/mobile nav, admin Bookings tabs, admin Settings tab, dashboard stat, `stripe.ts`, types, README, CLAUDE.md
- [!] Remote: `supabase functions delete create-community-payment-intent` / `expand-community-series` if they were deployed

## Phase 2 — Delivery or Pickup

Pricing (server is authoritative, client duplicates for display):

| | Price |
|---|---|
| Pickup (I-90 Exit 280A, Maple St) | Free |
| Delivery ≤ 20 road miles | $89 flat |
| Delivery > 20 road miles | $89 + $1 per extra mile (rounded **up** to whole miles) |
| Delivery > 50 road miles | Not offered online (contact us / choose pickup) |

Delivery fee is part of the taxable subtotal (8.9%), same as the old surcharge.

Distance = **driving route**, not straight line:

1. Geocode the customer address with the **US Census Geocoder**: public domain, no key, built for US street addresses. If it finds nothing, fall back to **Nominatim** (OSM).
2. Route the origin to that point with **OSRM** (`driving` profile, OSM road network). Use the primary (fastest) route, the same one Google Maps proposes by default.
3. The origin coordinates live only in the `DELIVERY_ORIGIN` secret (`"lat,lng"`), never in the client bundle or the repo.

Work items:

- [x] `supabase/functions/_shared/delivery.ts`: pure geocode → route → fee logic, shared by both functions
- [x] New edge function `delivery-quote` (`POST { address }` → `{ miles, fee, extraMiles, matchedAddress, withinServiceArea }`)
- [x] `create-payment-intent`: accept `fulfillment_method`, re-quote the delivery server-side, add the fee, persist it, add it to Stripe metadata
- [x] Migration 017: `bookings.fulfillment_method`, `delivery_distance_miles`, `fulfillment_fee`
- [x] Migration 018: fix the outdated delivery FAQ (it still says "free within 25 miles, $2.50/mi") and add a pickup FAQ
- [x] `stripe-webhook` emails: fulfillment method, delivery fee, pickup instructions
- [x] Client: `src/lib/delivery.ts` (constants, fee calc, quote call), booking store, one shared order-totals helper
- [x] Booking page: after a date is picked, choose Delivery or Pickup. Pickup shows the Exit 280A blurb. Delivery shows an address field, the quote, and the fee.
- [x] Checkout, confirmation, and the admin bookings view show the method and fee
- [x] Dev-only Vite middleware so the quote works on `localhost` without Docker/Deno (runs the same shared module)
- [x] Unit tests for fee calculation and order totals

## Phase 3 — UI Redesign

Home (simplified): Hero → **How It Works, a 4-step flow** (Pick your date → Delivery or pickup → We set it up / you fire it up → Sweat, plunge, recover) → Delivery vs Pickup cards → Why Sauna → Testimonials → Gallery preview → FAQ preview → CTA.

Removed from home: "Choose your experience" (community), "Perfect For Any Occasion" (filler), "Enhance Your Experience" (add-ons are already on Booking + Products). Also removes the dead code `FeaturedProductSection`.

Pages:

| Page | Decision | Why |
|---|---|---|
| About | **Remove** (`/about` redirects to `/`) | Generic copy; "Our Sauna" specs duplicate Products; values are filler |
| Products | Keep | Specs + add-ons + Product JSON-LD (SEO) |
| Gallery, FAQ, Contact, Terms, Privacy | Keep | Real photos, objection handling, legal |
| Booking | Drop the duplicated How-It-Works banner | Calendar sits above the fold |

Nav: Home · Products · Gallery · FAQ · Contact + a **Book Now** button (was 8 links).

## Phase 4 — Verify

- [x] `npm run test:unit` (51 pass), `npm run lint` (no new findings; 16 pre-existing vs 18 at HEAD), `npm run build`
- [x] Dev server + browser run-through with screenshots (home, booking/pickup, booking/delivery quote, checkout, mobile)
- [!] Don't submit checkout against the live DB. A pending booking blocks that date for real customers (unique index on `rental_date`).

## Also fixed along the way (pre-existing)

- Every page's `<title>` rendered empty under React 19 (`<title>Text — {SITE_NAME}</title>` has mixed children). Fixed site-wide.
- Booking calendar prev/next arrows were positioned on the "What's Included" card (DayPicker root lacked `relative`)
- Nested `<button>` inside add-on cards (Radix Checkbox inside a button)

## Open follow-ups

- [x] RLS: anon limited to `bookings(rental_date, status)`; confirmation page reads via `get_booking_confirmation(uuid)` (migration 020) — also fixes line items never showing to customers
- [x] Broken product `image_url`s cleared; admin photo upload/remove via the `product-images` bucket (migration 021)
- [!] `coupons` is anon-readable in full (`USING (true)`): anyone can list discount codes
- [!] Copy inconsistencies to settle: cancellation window (FAQ 72h vs email 48h), clearance (booking page 4 ft vs Terms 10 ft)
- [!] Hero/testimonial claims: the old "4.9 Rating / 500+ Rentals" badges were replaced with factual ones; seeded testimonials should be real before launch

## Phase 5 — Admin-editable delivery & pickup

- [x] `delivery_settings` single-row table (migration 019): toggles, prices, free radius, rounding, range, pickup fee, labels, copy
- [x] Admin → Settings → Delivery & Pickup tab with validation and live fee preview
- [x] Edge functions read settings for every quote/checkout/email; site reads them via `useDeliverySettings`
- [x] `{token}` placeholders in settings text and FAQ answers
- [x] Community functions: verified never deployed (`supabase functions list`) — nothing to delete

## Deploy order (owner)

1. Secret: Dashboard → Edge Functions → Secrets → add `DELIVERY_ORIGIN` (value from `.env`), or `NO_PROXY="*" supabase secrets set DELIVERY_ORIGIN=<lat,lng>`
2. Migrations: `NO_PROXY="*" supabase db push` (017–021), or paste each file into Dashboard → SQL Editor in order
3. `NO_PROXY="*" supabase functions deploy delivery-quote create-payment-intent stripe-webhook`
4. Push the frontend (Netlify). The confirmation page works before and after migration 020.
