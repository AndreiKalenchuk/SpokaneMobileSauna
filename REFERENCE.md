# AI Prompt: Build a Mobile Sauna Rental Website

> **How to use this document:** Copy-paste this entire prompt (or sections of it) into an AI coding agent to generate the full website. Each section is self-contained enough to be used independently if you want to build incrementally.

---

## Project Overview

Build a modern, responsive, production-ready **mobile sauna rental website** using React. The business delivers a wood-fired mobile sauna to customers' locations for 24-hour rental periods. Customers can book a date, choose add-on products (cold plunge tub, firewood bundles, etc.), and pay online with a credit/debit card. The website must feel premium, outdoorsy, and wellness-oriented — think warm wood tones, soft earth colors, and high-quality lifestyle photography.

---

## Tech Stack

> **Design principle:** This is a small local business (~1 booking/day, <100 visitors/day). The stack is chosen to run entirely on free tiers ($0/month), allow commercial use, and keep things simple. The frontend is a React SPA (single-page app). Server-side logic is minimal — only what's required for payment security — and lives in Supabase Edge Functions alongside the database.

### Frontend
- **React 18+ with Vite** — fast build tooling, familiar React patterns, no framework-specific abstractions
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4+
- **UI Components:** shadcn/ui (built on Radix UI primitives) for accessible, customizable components
- **Routing:** React Router v7 (file-based or config-based routing)
- **Calendar/Date Picker:** `react-day-picker` (lightweight, accessible, highly customizable)
- **Forms:** React Hook Form + Zod for validation
- **Payment UI:** `@stripe/react-stripe-js` + `@stripe/stripe-js` for the Stripe Payment Element
- **Data Fetching & Caching:** `@tanstack/react-query` for server state (caches Supabase queries, handles loading/error states)
- **Supabase Client:** `@supabase/supabase-js` for direct database reads (products, FAQs, gallery, availability) from the browser with Row-Level Security
- **Animations:** Framer Motion for page transitions and micro-interactions
- **Image Gallery:** `yet-another-react-lightbox` or `react-image-gallery`
- **Icons:** Lucide React
- **State Management:** Zustand for booking cart state (selected date, add-ons, totals)
- **SEO:** `react-helmet-async` for per-page meta tags + Netlify prerendering for search engine crawlers

### Backend (Supabase — all in one)
- **Database:** PostgreSQL via Supabase (free tier) — all data lives here, queried directly from the browser via `@supabase/supabase-js` with Row-Level Security
- **Edge Functions:** Supabase Edge Functions (Deno/TypeScript) for the few operations that need server-side secrets:
  1. `create-payment-intent` — validates availability, recalculates price server-side, creates Stripe PaymentIntent
  2. `stripe-webhook` — handles Stripe payment confirmation, updates booking status, sends confirmation email
  3. `contact-form` — sends email via Resend
- **Auth (Admin):** Supabase Auth — email/password login for the admin dashboard
- **File Storage:** Supabase Storage — for gallery images and product photos (1 GB free, 2 GB bandwidth/month free)
- **Payment Processing:** Stripe `stripe` SDK called from Edge Functions. Stripe charges 2.9% + $0.30 per transaction only — no monthly fee.
- **Email Notifications:** Resend (free tier: 3,000 emails/month — more than enough for ~30 bookings/month), called from Edge Functions

### Hosting & Deployment
- **Netlify (free tier)** — hosts the React SPA. Commercial use allowed on the free plan. 100 GB bandwidth/month, automatic HTTPS, deploy previews, GitHub integration.
- **Supabase (free tier)** — 500 MB database, 1 GB file storage, 2 GB bandwidth, 50,000 monthly active users, unlimited API requests, 500K Edge Function invocations/month.
- **GitHub (free)** — source code. Push to `main` triggers Netlify auto-deploy for frontend. Supabase Edge Functions deployed via `supabase functions deploy` CLI.

### Monthly Cost Breakdown

| Service | Free Tier Includes | When You'd Upgrade | Upgrade Cost |
|---------|-------------------|-------------------|--------------|
| **Netlify** | 100 GB bandwidth, HTTPS, deploy previews, commercial use | >100 GB bandwidth/month (unlikely at <100 visitors/day) | $9–20/month |
| **Supabase** | 500 MB DB, 1 GB storage, 500K Edge Function invocations | If you exceed storage (many gallery images) or DB size | $25/month Pro |
| **Stripe** | No monthly fee | Never — pay-per-transaction only | 2.9% + $0.30/txn |
| **Resend** | 3,000 emails/month | >3,000 emails (unlikely at ~1 booking/day) | $20/month |
| **GitHub** | Unlimited private repos | Never for this use case | Free |
| **Domain** | N/A — you need to buy one | — | ~$12/year |
| **Total** | **$0–$1/month** (just the domain amortized) | | $25–65/month if everything upgrades at once |

**Realistic cost for your volume: $0/month** (plus ~$1/month amortized domain cost). You'd only hit paid tiers if you stored hundreds of high-res images or got thousands of daily visitors — good problems to have.

### Optional / Future (add only when needed)
- **SMS Notifications:** Twilio (free trial gives $15 credit, then pay-per-SMS at ~$0.0079 each)
- **Analytics:** Google Analytics 4 (free) or Plausible ($9/month)
- **CMS for Blog/FAQ:** Markdown files in the repo (free, no extra service)
- **Admin Dashboard:** Custom-built with shadcn/ui as a protected route in the React app

---

## Database Schema (Supabase PostgreSQL)

> Create these tables via Supabase SQL Editor or migration files in `supabase/migrations/`. Enable Row-Level Security on all tables.

```
products
  id              UUID PK
  name            VARCHAR           -- "Mobile Sauna", "Cold Plunge Tub", "Firewood Bundle"
  slug            VARCHAR UNIQUE
  description     TEXT
  type            ENUM('primary','addon','standalone')
  base_price      DECIMAL(10,2)     -- default price (weekday)
  image_url       VARCHAR
  is_active       BOOLEAN DEFAULT true
  sort_order      INT
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

pricing_rules
  id              UUID PK
  product_id      UUID FK -> products
  rule_type       ENUM('weekday','weekend','holiday','custom')
  price           DECIMAL(10,2)
  day_of_week     INT[]             -- 0=Sun..6=Sat, NULL for holidays/custom
  specific_dates  DATE[]            -- for holidays or special dates
  label           VARCHAR           -- "Weekend Rate", "July 4th Rate"
  priority        INT               -- higher priority wins on conflict
  is_active       BOOLEAN DEFAULT true

bookings
  id              UUID PK
  booking_number  VARCHAR UNIQUE    -- human-readable, e.g. "SAU-20260314-A1B2"
  customer_name   VARCHAR
  customer_email  VARCHAR
  customer_phone  VARCHAR
  rental_date     DATE              -- the 24-hour rental date
  status          ENUM('pending','confirmed','cancelled','completed')
  subtotal        DECIMAL(10,2)
  tax_amount      DECIMAL(10,2)
  total_amount    DECIMAL(10,2)
  stripe_payment_intent_id  VARCHAR
  notes           TEXT              -- customer special requests
  delivery_address TEXT
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

booking_items
  id              UUID PK
  booking_id      UUID FK -> bookings
  product_id      UUID FK -> products
  quantity        INT DEFAULT 1
  unit_price      DECIMAL(10,2)     -- price at time of booking
  total_price     DECIMAL(10,2)

blocked_dates
  id              UUID PK
  date            DATE UNIQUE
  reason          VARCHAR           -- "Maintenance", "Owner block"

gallery_images
  id              UUID PK
  url             VARCHAR
  alt_text        VARCHAR
  caption         VARCHAR
  sort_order      INT
  is_active       BOOLEAN DEFAULT true

testimonials
  id              UUID PK
  customer_name   VARCHAR
  rating          INT               -- 1-5
  text            TEXT
  date            DATE
  is_featured     BOOLEAN DEFAULT false
  is_active       BOOLEAN DEFAULT true

faqs
  id              UUID PK
  question        TEXT
  answer          TEXT
  category        VARCHAR           -- "Booking", "Delivery", "Sauna Use", "Payment"
  sort_order      INT
  is_active       BOOLEAN DEFAULT true
```

---

## Data Access Architecture

> Most data reads happen **directly from the browser** using `@supabase/supabase-js` with Row-Level Security. Server-side logic is limited to 3 Supabase Edge Functions that handle secrets (Stripe keys, Resend API key).

### Browser → Supabase (direct reads, no server needed)

These queries run in the React app using the Supabase anon key, protected by RLS policies:

```
supabase.from('products').select('*').eq('is_active', true)
supabase.from('pricing_rules').select('*').eq('is_active', true)
supabase.from('faqs').select('*').eq('is_active', true).order('sort_order')
supabase.from('gallery_images').select('*').eq('is_active', true)
supabase.from('testimonials').select('*').eq('is_active', true)
supabase.from('bookings').select('*').in('status', ['confirmed','completed']).select('rental_date')  -- only dates, for availability calendar
supabase.from('blocked_dates').select('*')
```

### Supabase Edge Functions (server-side, 3 functions total)

These run on Supabase's infrastructure, have access to secret keys, and are invoked via `supabase.functions.invoke()` from the browser or via direct HTTP URL (for webhooks):

```
# supabase/functions/create-payment-intent
POST  -- receives: { rental_date, product_ids, quantities, customer info }
       -- validates availability, recalculates price server-side, creates Stripe PaymentIntent
       -- inserts booking record with status 'pending'
       -- returns: { clientSecret, bookingId }

# supabase/functions/stripe-webhook
POST  -- called directly by Stripe (public URL, no auth — verified by Stripe signature)
       -- on payment_intent.succeeded: updates booking status to 'confirmed', sends email via Resend
       -- on payment_intent.payment_failed: updates booking status

# supabase/functions/contact-form
POST  -- receives: { name, email, phone, subject, message }
       -- sends email via Resend
       -- returns: { success: true }
```

### Admin operations (browser → Supabase, protected by Supabase Auth)

Admin users log in via Supabase Auth. RLS policies restrict write access to authenticated admin users:

```
supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
supabase.from('blocked_dates').insert({ date, reason })
supabase.from('blocked_dates').delete().eq('id', blockedDateId)
supabase.from('products').upsert(productData)
supabase.from('pricing_rules').upsert(pricingData)
```

---

## Pages & UI/UX Specifications

### 1. HOME PAGE (`/`)

**Purpose:** First impression — convey the premium, relaxing sauna experience and drive visitors to book immediately.

**Layout (top to bottom):**

1. **Hero Section (full viewport height)**
   - Full-bleed background: high-quality photo or short looping video of the sauna by a lake/forest at golden hour, steam rising
   - Overlay with semi-transparent dark gradient from bottom
   - Headline (large, serif font): *"Bring the Sauna to You"*
   - Subheadline: *"Premium wood-fired mobile sauna delivered to your door for a 24-hour escape"*
   - Primary CTA button: **"Book Your Sauna"** (scrolls to quick-book or navigates to `/book`)
   - Secondary CTA: **"See How It Works"** (scrolls to section below)
   - Trust badges row: "★ 4.9 Rating", "500+ Rentals", "Free Setup & Teardown"

2. **How It Works Section**
   - 3-step horizontal cards with icons and subtle animation on scroll:
     1. **Choose Your Date** — "Pick an available date on our calendar. Weekday or weekend — we're flexible."
     2. **We Deliver & Set Up** — "Our team delivers the sauna to your location, sets it up, and gives you a safety walkthrough."
     3. **Enjoy & We Pick Up** — "Relax for a full 24 hours. When you're done, we handle teardown and removal."

3. **Featured Product Card**
   - Large image of the sauna (interior + exterior split or carousel)
   - Name: "The [Sauna Name]"
   - Quick specs: seats 6, wood-fired, cedar interior, includes bucket & ladle, towels, thermometer
   - Starting price: "From $XXX / day"
   - CTA: **"Book Now"** and **"Learn More"**

4. **Benefits Section**
   - Section title: *"Why Sauna?"*
   - Grid of 4–6 benefit cards with icons:
     - **Stress Relief** — "Heat therapy lowers cortisol and triggers deep relaxation."
     - **Muscle Recovery** — "Accelerate recovery after workouts. Used by athletes worldwide."
     - **Better Sleep** — "A sauna session before bed improves sleep quality significantly."
     - **Detoxification** — "Sweat out toxins and impurities through deep perspiration."
     - **Immune Boost** — "Regular sauna use stimulates white blood cell production."
     - **Social Connection** — "The perfect centerpiece for gatherings, parties, or quiet evenings."

5. **Add-Ons Preview Section**
   - Section title: *"Enhance Your Experience"*
   - Horizontal scrollable cards:
     - **Cold Plunge Tub** — photo, short description, "+$XXX"
     - **Extra Firewood Bundle** — photo, short description, "+$XX"
     - (Future: aromatherapy kit, guided breathwork session, etc.)

6. **Testimonials Carousel**
   - Auto-rotating cards with customer name, star rating, and quote
   - Background: subtle warm texture or blurred sauna imagery

7. **Gallery Preview**
   - Masonry or grid of 6–8 photos from the gallery
   - CTA: **"View Full Gallery"** → `/gallery`

8. **FAQ Preview**
   - Show top 4–5 most common questions in accordion format
   - CTA: **"See All FAQs"** → `/faq`

9. **Footer**
   - Logo, tagline
   - Navigation links: Home, Book Now, Gallery, FAQ, About, Contact, Terms, Privacy
   - Social media icons (Instagram, Facebook, TikTok)
   - Contact info: phone, email
   - Service area note: "Proudly serving [City/Region] and surrounding areas within XX miles"
   - © 2026 [Business Name]

---

### 2. BOOKING / CALENDAR PAGE (`/book`)

**Purpose:** The core conversion page — let users pick a date, see pricing, select add-ons, and proceed to checkout.

**Layout:**

1. **Page Header**
   - Title: *"Book Your Sauna"*
   - Subtitle: *"Select a date, customize your experience, and reserve in minutes."*

2. **Rental Description Panel (sidebar on desktop, collapsible on mobile)**
   - What's included in every rental:
     - 24-hour rental period (e.g., delivered at 10 AM, picked up next day at 10 AM)
     - Free delivery within XX miles (additional $X.XX/mile beyond)
     - Professional setup & teardown
     - Safety orientation walkthrough
     - Cedar bucket, ladle, and thermometer
     - Seating for up to 6
     - 1 bundle of firewood (approx. 2–3 hours of burn time)
     - Towels and seat covers
   - Small print: "Flat, accessible surface required. Minimum clearance of 10ft from structures."

3. **Interactive Calendar**
   - Month-grid calendar using `react-day-picker` or similar
   - Visual states for each date cell:
     - **Available** — clickable, shows the base price inside or below the date number (e.g., "$350")
     - **Weekend / Premium** — available but highlighted with a different accent color and higher price (e.g., "$450")
     - **Holiday** — special color badge, highest price (e.g., "$550")
     - **Booked / Unavailable** — grayed out, strikethrough, not clickable
     - **Blocked (maintenance)** — grayed out with a small icon
     - **Selected** — highlighted ring / fill with primary brand color
   - Navigation: month arrows, optional "Jump to month" dropdown
   - Legend below the calendar explaining the color codes
   - On date select: the right panel / section below updates with pricing details

4. **Pricing Breakdown (updates dynamically on date select)**
   - Selected date displayed prominently: "Saturday, March 21, 2026"
   - Line items:
     - Mobile Sauna (1 × $450.00) .............. $450.00
   - **Add-Ons Section:**
     - Each add-on as a card with checkbox/toggle, image thumbnail, name, short description, and price:
       - ☐ Cold Plunge Tub — "Ice-cold contrast therapy after your sauna session" — +$150.00
       - ☐ Extra Firewood Bundle — "Additional 2–3 hours of burn time" — +$15.00 (quantity selector: 1–5)
       - ☐ Aromatherapy Kit — "Essential oils: eucalyptus, birch, lavender" — +$25.00
     - Add-on prices also change based on the selected date's pricing rules
   - Subtotal, Tax, **Total** — updates in real time
   - Delivery distance input (address or mile estimate) that adds delivery surcharge if beyond free radius
   - CTA: **"Continue to Checkout"** (disabled until date is selected)

5. **Checkout Step (same page, step 2, or slide-in panel)**
   - Customer info form:
     - Full Name (required)
     - Email (required)
     - Phone Number (required)
     - Delivery Address (required, with Google Places autocomplete if possible)
     - Special Requests / Notes (optional textarea)
   - Order Summary (sticky sidebar on desktop):
     - All line items, date, total
   - **Payment Section:**
     - Stripe Payment Element (handles credit/debit cards, Apple Pay, Google Pay automatically)
     - "Pay $XXX.XX" button
   - Terms checkbox: "I agree to the [Rental Terms & Conditions](/terms)"
   - On success: redirect to `/booking/confirmation/:bookingNumber`

---

### 3. BOOKING CONFIRMATION PAGE (`/booking/confirmation/:bookingNumber`)

**Purpose:** Reassure the customer that their booking is confirmed and provide all relevant details.

**Layout:**
- Success icon (green checkmark with animation)
- "Your Sauna is Booked!" heading
- Booking number prominently displayed
- Summary card:
  - Rental Date & Time (e.g., "March 21, 2026 — Delivery at 10:00 AM")
  - Delivery Address
  - Items booked (sauna + add-ons)
  - Total paid
- "A confirmation email has been sent to [email]"
- What to expect next:
  - "We'll contact you 24 hours before delivery to confirm timing"
  - "Ensure the delivery area is clear and accessible"
  - Link to preparation checklist
- Buttons: **"Return to Home"**, **"Add to Calendar"** (generates .ics file)

---

### 4. GALLERY PAGE (`/gallery`)

**Purpose:** Showcase the sauna experience with beautiful imagery to build desire and trust.

**Layout:**
- Page title: *"Gallery"*
- Subtitle: *"See the sauna in action — from backyard retreats to lakeside escapes."*
- Filter tabs: "All", "Exterior", "Interior", "Events", "Scenery", "Cold Plunge"
- Masonry grid of images (lazy-loaded, with blur-up placeholder)
- Click to open full-screen lightbox with swipe navigation
- Optional: embed 1–2 short video clips or Instagram reels
- CTA at bottom: **"Ready to book your own experience? → Book Now"**

---

### 5. FAQ PAGE (`/faq`)

**Purpose:** Answer common questions to reduce booking friction and support inquiries.

**Layout:**
- Page title: *"Frequently Asked Questions"*
- Category tabs or sidebar: "Booking & Pricing", "Delivery & Setup", "Using the Sauna", "Payment & Cancellation"
- Accordion-style Q&A items, grouped by category
- Search bar at top: filter questions as user types

**Sample FAQs to pre-populate:**

*Booking & Pricing:*
- "How far in advance should I book?" → "We recommend booking at least 1 week ahead, especially for weekends. Same-week availability may exist on weekdays."
- "What is your cancellation policy?" → "Free cancellation up to 72 hours before delivery. 50% refund for cancellations within 72–24 hours. No refund within 24 hours."
- "Why are weekend/holiday prices different?" → "Demand is higher on weekends and holidays. Weekday rentals offer the best value."
- "Do you offer multi-day discounts?" → "Yes! Contact us for custom multi-day pricing."
- "Is there a delivery fee?" → "Delivery is free within XX miles of [City]. Beyond that, a fee of $X.XX per additional mile applies."

*Delivery & Setup:*
- "What do I need to prepare at my location?" → "A flat, level surface (grass, gravel, or driveway) at least 8×12 ft, with 10 ft clearance from buildings and overhead obstructions. Access for our trailer to back in."
- "How long does setup take?" → "About 30–45 minutes. We handle everything."
- "Can you deliver to any location?" → "We deliver to private residences, Airbnb properties, event venues, and campsites within our service area. Contact us for special locations."

*Using the Sauna:*
- "How many people can fit?" → "The sauna comfortably seats 6 adults."
- "How hot does it get?" → "Our wood-fired sauna reaches 150–200°F (65–93°C)."
- "How much firewood is included?" → "1 bundle is included (2–3 hours of burn time). You can add extra bundles for $XX each."
- "Can I use the sauna in winter?" → "Absolutely — winter is the best time! The contrast of cold air and hot sauna is an incredible experience."

*Payment & Cancellation:*
- "What payment methods do you accept?" → "We accept all major credit and debit cards through our secure online checkout."
- "When am I charged?" → "Your card is charged at the time of booking."
- "Do I need to leave a security deposit?" → "No deposit is required, but you are responsible for any damage beyond normal wear."

---

### 6. ABOUT PAGE (`/about`)

**Purpose:** Build trust and personal connection. People rent from people they trust.

**Layout:**
- Page title: *"About Us"*
- **Our Story Section:**
  - Photo of the owner(s) / team beside the sauna
  - 2–3 paragraphs about why the business was started — passion for sauna culture, wellness, community
  - Tone: authentic, warm, personal
- **Our Sauna Section:**
  - Detailed specs of the sauna unit(s): dimensions, wood type, heating method, capacity, amenities
  - Multiple photos: exterior, interior, details (wood grain, stove, chimney)
- **Our Values:**
  - 3–4 values with icons: "Authenticity", "Wellness for Everyone", "Sustainability", "Community"
- **Service Area Map:**
  - Embedded map showing delivery radius
- CTA: **"Ready to try it? → Book Now"**

---

### 7. CONTACT PAGE (`/contact`)

**Purpose:** Provide a way for visitors to reach out with questions or custom requests.

**Layout:**
- Page title: *"Get in Touch"*
- Two-column layout:
  - **Left: Contact Form**
    - Name, Email, Phone, Subject (dropdown: General Inquiry, Booking Question, Partnership, Event Request, Other), Message
    - Submit button
  - **Right: Contact Info**
    - Phone number (clickable on mobile)
    - Email address
    - Business hours: "Mon–Sun: 8:00 AM – 8:00 PM"
    - Social media links
    - Service area note
- Below: embedded Google Map centered on service area

---

### 8. PRODUCTS PAGE (`/products`)

**Purpose:** Showcase all available rental products — the sauna as the hero, plus standalone items like the cold plunge that can be rented independently.

**Layout:**
- Page title: *"Our Rentals"*
- **Primary Product Card (large, hero-style):**
  - The Mobile Sauna — large image carousel, full description, specs, starting price, **"Book Now"** CTA
- **Standalone Rentals Section:**
  - Grid of cards for items that can be rented independently:
    - Cold Plunge Tub — photo, description, price, **"Book Now"** CTA
    - (Future products)
- **Add-Ons Section:**
  - Items only available as add-ons when booking the sauna:
    - Extra Firewood, Aromatherapy Kit, etc.
  - Note: "These add-ons are available during the booking process."

---

### 9. TERMS & CONDITIONS PAGE (`/terms`)

**Purpose:** Protect the business legally and set clear customer expectations.

**Content to include:**
- Rental agreement overview
- Booking and payment terms
- Cancellation and refund policy (with timeline)
- Delivery requirements and customer responsibilities
- Liability and damage policy
- Weather policy (e.g., "Rentals proceed in rain/snow. Cancellation for extreme weather at our discretion with full refund.")
- Age requirement (18+)
- Prohibited uses
- Contact for disputes

---

### 10. PRIVACY POLICY PAGE (`/privacy`)

**Content:** Standard privacy policy covering data collection (name, email, phone, payment info via Stripe), usage, sharing, cookies, and contact info.

---

### 11. BLOG PAGE (`/blog`) — *Optional, recommended for SEO*

**Purpose:** Drive organic traffic and establish authority in the sauna/wellness space.

**Layout:**
- Grid of blog post cards: featured image, title, excerpt, date, read time
- Categories: "Sauna Benefits", "Tips & How-To", "Events & News", "Wellness"
- Individual post page: clean reading experience with related posts at bottom

**Sample post topics:**
- "5 Health Benefits of Regular Sauna Use, Backed by Science"
- "How to Host the Perfect Sauna Party"
- "Sauna vs. Hot Tub: Which is Better for Recovery?"
- "Winter Sauna Guide: Why Cold Weather Makes It Better"
- "What to Expect at Your First Mobile Sauna Rental"

---

## Dynamic Pricing Logic

The pricing engine should work as follows:

```
function getPriceForDate(product, date):
  1. Get all active pricing_rules for this product
  2. Check for specific_date match (holidays) → highest priority
  3. Check for day_of_week match (weekend vs weekday)
  4. Fall back to product.base_price
  5. Return the price from the highest-priority matching rule
```

**Pricing tiers (example defaults to seed):**

| Product | Weekday (Mon–Thu) | Weekend (Fri–Sun) | Holiday |
|---------|-------------------|--------------------| --------|
| Mobile Sauna | $350 | $450 | $550 |
| Cold Plunge Tub (add-on) | $100 | $150 | $175 |
| Cold Plunge Tub (standalone) | $150 | $200 | $225 |
| Extra Firewood Bundle | $15 | $15 | $15 |
| Aromatherapy Kit | $25 | $25 | $25 |

**Holidays to pre-configure:** New Year's Day, Memorial Day, Independence Day, Labor Day, Thanksgiving, Christmas Eve, Christmas Day, New Year's Eve.

---

## Payment Flow (Stripe)

1. User selects date and add-ons → React app calculates estimated total for display (using pricing rules fetched from Supabase)
2. User fills in contact info and clicks "Continue to Payment"
3. React app calls the Supabase Edge Function:
   ```
   const { data } = await supabase.functions.invoke('create-payment-intent', {
     body: { rental_date, items: [{ product_id, quantity }], customer: { name, email, phone, address } }
   })
   ```
4. Edge Function (`supabase/functions/create-payment-intent/index.ts`):
   - Queries Supabase DB to validate availability (date not already booked or blocked)
   - Recalculates total server-side using pricing rules from the DB (never trust client prices)
   - Creates a Stripe PaymentIntent with the total amount
   - Inserts a `booking` record in Supabase with status `pending`
   - Returns `{ clientSecret, bookingId }` to the React app
5. React app renders Stripe Payment Element with the `clientSecret`
6. User enters card details and submits
7. Stripe processes payment → sends webhook to the `stripe-webhook` Edge Function (public URL)
8. Edge Function (`supabase/functions/stripe-webhook/index.ts`):
   - Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET` (stored as a Supabase secret)
   - On `payment_intent.succeeded`: updates booking status to `confirmed`, sends confirmation email via Resend
   - On `payment_intent.payment_failed`: updates booking status, optionally notifies admin
9. React app redirects to the confirmation page, which fetches booking details from Supabase by `bookingId`

---

## Email Notifications

**Booking Confirmation Email:**
- Subject: "Your Sauna Booking is Confirmed — [Booking Number]"
- Body: booking details, date, items, total, delivery address, what to prepare, cancellation policy, contact info

**Reminder Email (24 hours before):**
- Subject: "Your Sauna Arrives Tomorrow!"
- Body: delivery time, preparation checklist, weather note, contact for last-minute changes

**Cancellation Confirmation:**
- Subject: "Booking Cancelled — [Booking Number]"
- Body: refund details, rebooking encouragement

---

## Design System & Visual Guidelines

**Color Palette:**
- Primary: Deep Warm Brown (#5C3D2E) — wood, earth, warmth
- Secondary: Soft Sage Green (#8FA98B) — nature, wellness, calm
- Accent: Amber/Gold (#D4A03C) — fire, warmth, premium
- Background: Off-White/Cream (#FAF8F5)
- Text: Charcoal (#2C2C2C)
- Error: Muted Red (#C44536)
- Success: Forest Green (#4A7C59)

**Typography:**
- Headings: Serif font (e.g., Playfair Display, Lora, or DM Serif Display)
- Body: Clean sans-serif (e.g., Inter, DM Sans, or Plus Jakarta Sans)
- Accent: Optional handwritten-style font for callouts (e.g., Caveat)

**Design Principles:**
- Generous whitespace — let the content breathe
- Large, high-quality photography as the primary design element
- Rounded corners (8–12px) on cards and buttons for a friendly feel
- Subtle shadow elevations, no harsh borders
- Smooth scroll behavior and subtle entrance animations
- Mobile-first responsive design — booking flow must work flawlessly on phones
- Sticky header with transparent-to-solid transition on scroll
- Accessibility: WCAG 2.1 AA compliant, proper heading hierarchy, alt text, keyboard navigation, focus indicators

---

## SEO Requirements

> As a React SPA, the app renders in the browser. To make content pages discoverable by search engines and social media previews, use `react-helmet-async` for meta tags and enable Netlify's prerendering feature for crawler bots.

- **`react-helmet-async`** — set unique `<title>`, `<meta name="description">`, Open Graph, and Twitter Card tags on every page
- **Netlify Prerendering** — enable in Netlify dashboard (Settings → Build & Deploy → Prerendering). This serves a pre-rendered HTML snapshot to search engine crawlers while real users get the normal SPA. Free on all plans.
- **Structured data (JSON-LD)** — inject `<script type="application/ld+json">` via `react-helmet-async` for: LocalBusiness schema (home page), Product schema (products page), FAQ schema (FAQ page)
- **Semantic HTML5** — use `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<nav>` throughout
- **`sitemap.xml` and `robots.txt`** — place in `public/` folder as static files
- **Canonical URLs** — set via `react-helmet-async` on each page
- **Fast loading** — Vite's tree-shaking and code splitting keep bundles small. Lazy-load routes with `React.lazy()`. Use WebP images. Add `loading="lazy"` to images below the fold.
- **Alt text** on all images

---

## Seed Data

Pre-populate the database with:
- 1 primary product (Mobile Sauna) with detailed description and 5+ images
- 3 add-on products (Cold Plunge Tub, Extra Firewood Bundle, Aromatherapy Kit)
- 1 standalone product (Cold Plunge Tub — listed independently)
- Pricing rules for weekday, weekend, and holidays for each product
- 10 holiday dates for 2026
- 8–10 testimonials with 4–5 star ratings
- 15+ FAQ items across 4 categories
- 12+ gallery images (use placeholder URLs like https://placehold.co or Unsplash URLs)
- 5 sample blog posts (title + excerpt + placeholder body)

---

## Project Structure

> One repo with two logical sections: `src/` for the React frontend, `supabase/` for database schema and Edge Functions. The frontend deploys to Netlify automatically on push. Edge Functions deploy via `supabase functions deploy`.

```
sauna-rental/
├── public/                          # static assets (favicon, og-image, robots.txt, sitemap.xml)
├── src/                             # React frontend (Vite)
│   ├── components/
│   │   ├── layout/                  # Header, Footer, Navigation, MobileMenu
│   │   ├── home/                    # Hero, HowItWorks, Benefits, Testimonials
│   │   ├── booking/                 # Calendar, PricingBreakdown, AddOnCard, CheckoutForm
│   │   ├── gallery/                 # GalleryGrid, Lightbox
│   │   ├── faq/                     # FaqAccordion, FaqSearch
│   │   ├── products/                # ProductCard, ProductDetail
│   │   ├── admin/                   # AdminLayout, BookingsTable, SettingsPanel
│   │   └── ui/                      # shadcn/ui components (Button, Card, Input, etc.)
│   ├── pages/                       # route-level page components
│   │   ├── HomePage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── BookingConfirmationPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── GalleryPage.tsx
│   │   ├── FaqPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── TermsPage.tsx
│   │   ├── PrivacyPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminBookings.tsx
│   │       └── AdminSettings.tsx
│   ├── hooks/                       # useAvailability, useProducts, usePricing, useCart
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client (browser, anon key)
│   │   ├── stripe.ts                # loadStripe() setup
│   │   ├── pricing.ts               # client-side pricing calculation (for display only)
│   │   └── utils.ts                 # shared utilities, date formatting
│   ├── store/
│   │   └── bookingStore.ts          # Zustand store (selected date, add-ons, totals)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces (Product, Booking, PricingRule, etc.)
│   ├── App.tsx                      # React Router routes + layout
│   ├── main.tsx                     # Vite entry point
│   └── index.css                    # Tailwind directives + global styles
├── supabase/                        # database + server-side logic
│   ├── functions/                   # Edge Functions (Deno/TypeScript)
│   │   ├── create-payment-intent/
│   │   │   └── index.ts             # validate availability, calc price, create Stripe PaymentIntent
│   │   ├── stripe-webhook/
│   │   │   └── index.ts             # handle Stripe payment events
│   │   └── contact-form/
│   │       └── index.ts             # send contact email via Resend
│   ├── migrations/                  # SQL migration files (version-controlled schema)
│   │   ├── 001_create_products.sql
│   │   ├── 002_create_pricing_rules.sql
│   │   ├── 003_create_bookings.sql
│   │   ├── 004_create_blocked_dates.sql
│   │   ├── 005_create_gallery.sql
│   │   ├── 006_create_testimonials.sql
│   │   ├── 007_create_faqs.sql
│   │   └── 008_enable_rls.sql
│   ├── seed.sql                     # initial data (products, pricing, FAQs, testimonials)
│   └── config.toml                  # Supabase project config
├── .env.example                     # template for env vars
├── netlify.toml                     # Netlify build config (SPA redirects)
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Variables

### Frontend (.env for Vite — checked into repo as .env.example)

Vite exposes variables prefixed with `VITE_` to the browser. These are safe to be public.

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SITE_URL=http://localhost:5173
```

### Supabase Edge Functions (stored as Supabase secrets — NOT in the repo)

Set these via `supabase secrets set KEY=VALUE` from the CLI. They are available to all Edge Functions at runtime.

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FROM_EMAIL=bookings@yoursaunarental.com
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # for DB writes from Edge Functions
```

---

## Implementation Order (Recommended)

Build in this order for the fastest path to a working MVP:

1. **Project scaffolding** — `npm create vite@latest sauna-rental -- --template react-ts`, add Tailwind CSS, install shadcn/ui, set up React Router, create Supabase project, link with `supabase init`, push to GitHub, connect to Netlify
2. **Netlify config** — Create `netlify.toml` with SPA redirect rule (`/* → /index.html 200`) so React Router works on refresh
3. **Database schema & seed data** — Write SQL migration files in `supabase/migrations/`, enable RLS, run `supabase db push`, then seed with `seed.sql`
4. **Supabase client setup** — Create `src/lib/supabase.ts` with anon key, set up `@tanstack/react-query` provider for data fetching
5. **Layout & navigation** — App shell with Header, Footer, responsive mobile menu, React Router routes
6. **Home page** — Hero, How It Works, Benefits, Testimonials preview, CTA sections
7. **Products page** — Product cards fetching from Supabase, images from Supabase Storage
8. **Gallery page** — Image grid with lightbox, images from Supabase Storage
9. **FAQ page** — Accordion with category filtering and search, data from Supabase
10. **About & Contact pages** — Static content, contact form that invokes `contact-form` Edge Function
11. **Booking calendar** — Fetch availability + pricing from Supabase directly, render interactive calendar with `react-day-picker`
12. **Add-on selection & pricing engine** — Dynamic pricing display, Zustand cart state, line item breakdown
13. **Checkout flow** — Customer info form (React Hook Form + Zod), Stripe Payment Element integration
14. **Payment Edge Functions** — Write `create-payment-intent` and `stripe-webhook` Edge Functions, deploy with `supabase functions deploy`
15. **Booking confirmation** — Confirmation page fetching booking details from Supabase
16. **Terms & Privacy pages**
17. **Admin dashboard** — Protected by Supabase Auth login, manage bookings, block dates, edit products/pricing
18. **SEO & polish** — `react-helmet-async` for meta tags, enable Netlify prerendering, optimize images, add Framer Motion animations
19. **Blog** (optional) — Markdown files or simple CMS, rendered as routes

---

## Key Technical Details to Get Right

- **Never trust client-side pricing** — the React app calculates prices for display only. The `create-payment-intent` Edge Function must recalculate totals server-side before creating the Stripe PaymentIntent.
- **Race conditions on bookings** — use a database-level unique constraint on `rental_date` in the `bookings` table (for status != 'cancelled') to prevent double-booking. At ~1 booking/day this is unlikely, but the constraint costs nothing.
- **Stripe webhooks are the source of truth** — don't mark a booking as confirmed until the webhook confirms payment succeeded. The `stripe-webhook` Edge Function handles this.
- **Time zones** — store all dates as UTC in the database; display in the business's local timezone on the frontend.
- **Responsive booking flow** — the calendar and checkout must be fully functional on mobile screens (test at 375px width).
- **Loading states** — use `@tanstack/react-query` loading states to show skeleton screens while fetching data from Supabase. Show disabled buttons and spinners during payment processing.
- **Error handling** — graceful error messages for failed payments, network errors, unavailable dates. React Query's `error` state makes this straightforward.
- **Image optimization** — store original images in Supabase Storage. Optimize before uploading (use Squoosh or similar to convert to WebP, resize to max 1920px wide). Use `loading="lazy"` on `<img>` tags for below-the-fold images. Consider a build-time image optimization plugin for Vite if this becomes tedious.
- **Supabase Row-Level Security (RLS)** — enable RLS on all tables. This is your security layer — don't skip it.
  - Public tables (products, pricing_rules, FAQs, gallery, testimonials, blocked_dates): `SELECT` policy for anonymous users
  - Bookings table: `SELECT` on `rental_date` only for anonymous (calendar availability), full access for authenticated admin
  - Admin write operations: restricted to authenticated users with admin role
- **SPA routing on Netlify** — add a `netlify.toml` with `[[redirects]] from = "/*" to = "/index.html" status = 200` so that direct URL access and page refreshes work with React Router.
- **Supabase Edge Function secrets** — never hardcode API keys. Use `supabase secrets set` to store Stripe and Resend keys. Access them via `Deno.env.get('KEY')` in Edge Functions.
- **Keep it simple** — at this scale, avoid over-engineering. No Redis, no job queues, no microservices. A React SPA with Supabase and 3 Edge Functions handles everything.
