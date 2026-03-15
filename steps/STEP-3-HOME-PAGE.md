# Step 3: Home Page

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind + shadcn/ui. Supabase is connected. Data hooks exist from Step 2. The design should feel premium, outdoorsy, and wellness-oriented — warm wood tones, earth colors, generous whitespace.

## Task

Build the full Home page at `src/pages/HomePage.tsx`. It should be the main landing page that drives visitors to book.

## Sections (top to bottom)

### 1. Hero (full viewport height)
- Full-bleed background image (use a high-quality Unsplash sauna/nature placeholder for now)
- Semi-transparent dark gradient overlay from bottom
- Headline (Playfair Display, large): "Bring the Sauna to You"
- Subheadline: "Premium wood-fired mobile sauna delivered to your door for a 24-hour escape"
- Primary CTA: "Book Your Sauna" button → links to `/book`
- Secondary CTA: "See How It Works" → smooth scroll to next section
- Trust badges row: "4.9 Rating", "500+ Rentals", "Free Setup & Teardown"

### 2. How It Works
- 3 horizontal cards (stack vertically on mobile) with Lucide icons and Framer Motion entrance animation:
  1. "Choose Your Date" — "Pick an available date on our calendar."
  2. "We Deliver & Set Up" — "Our team delivers, sets up, and walks you through."
  3. "Enjoy & We Pick Up" — "Relax for 24 hours. We handle the rest."

### 3. Featured Product
- Fetch the primary product from Supabase using `useProducts()`
- Large image, product name, specs (seats 6, wood-fired, cedar interior, includes bucket & ladle), starting price "From $350/day"
- "Book Now" and "Learn More" buttons

### 4. Benefits — "Why Sauna?"
- Grid of 6 cards with icons:
  - Stress Relief, Muscle Recovery, Better Sleep, Detoxification, Immune Boost, Social Connection
  - Each with a 1-sentence description

### 5. Add-Ons Preview — "Enhance Your Experience"
- Horizontal scrollable cards showing add-on products from Supabase
- Each: image, name, short description, price starting from "+$XX"

### 6. Testimonials Carousel
- Fetch from Supabase using `useTestimonials()`
- Auto-rotating cards: customer name, star rating (filled stars), quote text
- Subtle warm background

### 7. Gallery Preview
- Fetch first 8 images using `useGalleryImages()`
- Grid of images (4 cols desktop, 2 cols mobile)
- "View Full Gallery" link → `/gallery`

### 8. FAQ Preview
- Fetch top 5 FAQs using `useFaqs()`
- Accordion (shadcn/ui Accordion component)
- "See All FAQs" link → `/faq`

## Requirements
- Fully responsive (mobile-first)
- Use Framer Motion for scroll-triggered entrance animations on sections
- All data from Supabase — show skeleton/loading states while fetching
- Use `react-helmet-async` to set: title "Mobile Sauna Rental — [Business Name]", meta description, Open Graph tags
