# Step 4: Content Pages (Products, Gallery, FAQ, About, Contact, Terms, Privacy)

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind + shadcn/ui. Supabase connected with data hooks. Home page is built. Design: premium, warm wood tones, earth colors, generous whitespace.

## Build these pages

### Products Page (`/products`)
- Hero card for the primary product (Mobile Sauna): image carousel, full description, specs, starting price, "Book Now" CTA
- "Standalone Rentals" section: grid of cards for products with type='standalone' (Cold Plunge Tub) — photo, description, price, "Book Now" link
- "Add-Ons" section: items with type='addon' — card grid with note "Available during booking"
- All data from Supabase via `useProducts()`

### Gallery Page (`/gallery`)
- Filter tabs: "All", "Exterior", "Interior", "Events", "Scenery", "Cold Plunge" (using the `category` field)
- Masonry grid of images, lazy-loaded with `loading="lazy"`
- Click opens full-screen lightbox (use `yet-another-react-lightbox`)
- CTA at bottom: "Ready to book? → Book Now"
- Data from `useGalleryImages()`

### FAQ Page (`/faq`)
- Search bar at top that filters questions as user types
- Category tabs: "Booking & Pricing", "Delivery & Setup", "Using the Sauna", "Payment & Cancellation"
- Accordion items grouped by category (shadcn/ui Accordion)
- Data from `useFaqs()`

### About Page (`/about`)
- "Our Story" section: placeholder photo + 2–3 paragraphs about starting a mobile sauna business (passion for sauna culture, wellness, community). Use placeholder text that the owner can replace later.
- "Our Sauna" section: detailed specs — dimensions, wood type (western red cedar), heating (wood-fired stove), capacity (6 adults), amenities. Multiple placeholder photos.
- "Our Values": 4 cards with icons — Authenticity, Wellness for Everyone, Sustainability, Community
- "Service Area": placeholder for an embedded map with note "Serving [City] and surrounding areas within XX miles"
- CTA: "Ready to try it? → Book Now"

### Contact Page (`/contact`)
- Two-column layout (stacks on mobile):
  - Left: contact form — Name, Email, Phone, Subject dropdown (General Inquiry, Booking Question, Partnership, Event Request, Other), Message textarea, Submit button
  - Right: phone (clickable tel: link), email (clickable mailto:), hours "Mon–Sun: 8AM–8PM", social links, service area note
- Form validation with React Hook Form + Zod
- On submit: call `supabase.functions.invoke('contact-form', { body: formData })` — the Edge Function doesn't exist yet, so just show a success toast for now and log the data
- Below: placeholder for embedded Google Map

### Terms & Conditions (`/terms`)
- Generate a realistic rental terms page covering: rental agreement, booking/payment terms, cancellation policy (free >72h, 50% 72–24h, no refund <24h), delivery requirements, liability, weather policy, age requirement (18+), prohibited uses, contact for disputes

### Privacy Policy (`/privacy`)
- Generate a standard privacy policy for a small business that collects: name, email, phone, delivery address (for bookings), payment info (processed by Stripe — not stored on our servers), cookies (analytics only)

## Requirements for all pages
- Use `react-helmet-async` for unique title + meta description on each page
- Responsive, mobile-first
- Loading skeletons while data fetches
- Consistent with the design system (colors, fonts, spacing from Home page)
