# Step 2: Database Schema + Seed Data

> **Give this entire prompt to the AI agent in Cursor.**

## Context

This is a mobile sauna rental website using React + Vite (frontend) and Supabase (database). The project is already scaffolded with routing and layout from Step 1.

## Tasks

### 1. Create SQL migration files in `supabase/migrations/`

Write these migration files. Use `CREATE TABLE` with proper types, constraints, and defaults. Use `uuid_generate_v4()` for primary keys.

**`001_create_products.sql`**
```
products: id (UUID PK), name (VARCHAR), slug (VARCHAR UNIQUE), description (TEXT), 
type (TEXT CHECK IN 'primary','addon','standalone'), base_price (DECIMAL 10,2), 
image_url (VARCHAR), is_active (BOOLEAN DEFAULT true), sort_order (INT), 
created_at (TIMESTAMPTZ DEFAULT now()), updated_at (TIMESTAMPTZ DEFAULT now())
```

**`002_create_pricing_rules.sql`**
```
pricing_rules: id (UUID PK), product_id (UUID FK → products), 
rule_type (TEXT CHECK IN 'weekday','weekend','holiday','custom'), price (DECIMAL 10,2), 
day_of_week (INT[]), specific_dates (DATE[]), label (VARCHAR), priority (INT), 
is_active (BOOLEAN DEFAULT true)
```

**`003_create_bookings.sql`**
```
bookings: id (UUID PK), booking_number (VARCHAR UNIQUE), customer_name (VARCHAR), 
customer_email (VARCHAR), customer_phone (VARCHAR), rental_date (DATE), 
status (TEXT CHECK IN 'pending','confirmed','cancelled','completed'), 
subtotal (DECIMAL 10,2), tax_amount (DECIMAL 10,2), total_amount (DECIMAL 10,2), 
stripe_payment_intent_id (VARCHAR), notes (TEXT), delivery_address (TEXT), 
created_at (TIMESTAMPTZ DEFAULT now()), updated_at (TIMESTAMPTZ DEFAULT now())

booking_items: id (UUID PK), booking_id (UUID FK → bookings ON DELETE CASCADE), 
product_id (UUID FK → products), quantity (INT DEFAULT 1), 
unit_price (DECIMAL 10,2), total_price (DECIMAL 10,2)

Add a partial unique index on bookings(rental_date) WHERE status NOT IN ('cancelled') 
to prevent double-booking.
```

**`004_create_blocked_dates.sql`**
```
blocked_dates: id (UUID PK), date (DATE UNIQUE), reason (VARCHAR)
```

**`005_create_gallery.sql`**
```
gallery_images: id (UUID PK), url (VARCHAR), alt_text (VARCHAR), caption (VARCHAR), 
category (VARCHAR DEFAULT 'general'), sort_order (INT), is_active (BOOLEAN DEFAULT true)
```

**`006_create_testimonials.sql`**
```
testimonials: id (UUID PK), customer_name (VARCHAR), rating (INT CHECK 1-5), 
text (TEXT), date (DATE), is_featured (BOOLEAN DEFAULT false), is_active (BOOLEAN DEFAULT true)
```

**`007_create_faqs.sql`**
```
faqs: id (UUID PK), question (TEXT), answer (TEXT), 
category (VARCHAR), sort_order (INT), is_active (BOOLEAN DEFAULT true)
```

**`008_enable_rls.sql`**
Enable Row-Level Security on ALL tables. Create these policies:
- `products`, `pricing_rules`, `gallery_images`, `testimonials`, `faqs`, `blocked_dates`: allow `SELECT` for everyone (anon)
- `bookings`: allow `SELECT` on `rental_date` and `status` columns only for anon (for availability calendar). Allow full CRUD for authenticated users.
- `booking_items`: allow `SELECT` for authenticated users only
- All tables: allow full CRUD for authenticated users (admin)

### 2. Create `supabase/seed.sql`

Populate with realistic data:

**Products:**
- Mobile Sauna 6 person — "Premium wood-fired cedar sauna delivered to your location. Seats 6. Includes bucket, ladle, thermometer, and firewood for 1hr session." — base_price: $229
- Cold Plunge Tub (addon) — same description — base_price: $19
- Extra Firewood Bundle (addon) — "Additional 30 min of burn time." — base_price: $5.99
- Aromatherapy Kit (addon) — "Essential oils: eucalyptus, birch, lavender." — base_price: $5.99
- Sauna whisk/venik (addon) - "To ger full transformation into authentic sauna experience." - base price: $28.99

**Pricing rules for each product:**
- Weekday (Mon–Thu, days 1–4): use base_price, priority 1
- Weekend (Fri–Sun, days 5,6,0): Sauna $289, priority 2
- All addons are the same price
- Holiday (specific dates for 2026): Sauna $319, priority 3
- Holiday dates: 2026-01-01, 2026-05-25, 2026-07-04, 2026-09-07, 2026-11-26, 2026-12-24, 2026-12-25, 2026-12-31

**10 testimonials** (4–5 star ratings, realistic names and quotes about the sauna experience)

**15+ FAQs** across 4 categories: "Booking & Pricing", "Delivery & Setup", "Using the Sauna", "Payment & Cancellation". Use the FAQ content from the project's PROMPT.md reference doc if available, or generate realistic Q&As.

**12 gallery images** — use .jpg images from public/gallery

### 3. Create TypeScript types

Create `src/types/index.ts` with interfaces matching all database tables: `Product`, `PricingRule`, `Booking`, `BookingItem`, `BlockedDate`, `GalleryImage`, `Testimonial`, `Faq`.

### 4. Create data-fetching hooks

Create React Query hooks in `src/hooks/`:
- `useProducts()` — fetch active products, sorted by sort_order
- `usePricingRules()` — fetch all active pricing rules
- `useAvailability(month: string)` — fetch bookings (rental_date, status) and blocked_dates for a given month
- `useGalleryImages()` — fetch active gallery images sorted by sort_order
- `useTestimonials()` — fetch active testimonials
- `useFaqs()` — fetch active FAQs sorted by category then sort_order

Each hook should use `@tanstack/react-query`'s `useQuery` with the Supabase client.

### 5. Create pricing utility

Create `src/lib/pricing.ts` with a function:
```typescript
getPriceForDate(product: Product, date: Date, pricingRules: PricingRule[]): number
```
Logic: check for specific_date match (holidays) first → then day_of_week → fall back to product.base_price. Higher priority rule wins.

## Expected result

After this step:
- `supabase/migrations/` contains 8 SQL files
- `supabase/seed.sql` has realistic data
- TypeScript types match the database schema
- React Query hooks are ready to fetch data from Supabase
- Pricing utility correctly calculates prices for any date
