# Step 1: Project Scaffolding + Layout

> **Give this entire prompt to the AI agent in Cursor.**

## What to build

Scaffold a React + Vite + TypeScript project for a mobile sauna rental website. Set up the app shell with routing, layout components, and all dependencies.

## Tech stack

- React 18+ with Vite (`react-ts` template)
- TypeScript (strict mode)
- Tailwind CSS 4+
- shadcn/ui for UI components
- React Router v7 for routing
- @tanstack/react-query for data fetching
- @supabase/supabase-js for database access
- Zustand for cart/booking state
- react-helmet-async for SEO meta tags
- Lucide React for icons
- Framer Motion for animations

## Tasks

1. Initialize the project: `npm create vite@latest . -- --template react-ts` (in the current directory)
2. Install and configure Tailwind CSS
3. Install shadcn/ui and initialize it with these settings: tailwind CSS, default style, slate base color
4. Install all dependencies listed above
5. Create a `.env.example` file with these variables (empty values):
   ```
   VITE_SUPABASE_URL='https://lgqmeanxmmozvpkdxcjw.supabase.co'
   VITE_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncW1lYW54bW1venZwa2R4Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mjc2MjAsImV4cCI6MjA4OTEwMzYyMH0.OSh3DpavVZug9gBq7rNPmxdfhts34qLBiAl270gf1XU'
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51TB204GuFwIacsDYvYubQvKjmtcHkeUczjD2QRp9IuNZAo7CI9gWF1nEbkZkzM7DzlsgxEMZI7p8yPskoP9YgLTZ00SJMrXM8l
   VITE_SITE_URL=http://localhost:5173
   ```
6. Create `src/lib/supabase.ts` — initialize and export the Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env
7. Create `src/lib/stripe.ts` — export a `loadStripe()` promise using `VITE_STRIPE_PUBLISHABLE_KEY`
8. Create `netlify.toml` with SPA redirect:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
9. Set up React Router in `src/App.tsx` with these routes (all rendering placeholder pages for now):
   - `/` → HomePage
   - `/book` → BookingPage
   - `/booking/confirmation/:id` → BookingConfirmationPage
   - `/products` → ProductsPage
   - `/gallery` → GalleryPage
   - `/faq` → FaqPage
   - `/about` → AboutPage
   - `/contact` → ContactPage
   - `/terms` → TermsPage
   - `/privacy` → PrivacyPage
   - `/admin` → AdminDashboard (protected, placeholder)
10. Create the layout components:
    - `src/components/layout/Header.tsx` — sticky header with logo, navigation links (Home, Book Now, Products, Gallery, FAQ, About, Contact), and mobile hamburger menu. Transparent background that transitions to solid on scroll. Use the design tokens below.
    - `src/components/layout/Footer.tsx` — logo, nav links, social media icons (Instagram, Facebook, TikTok as placeholders), contact info, service area note, copyright
    - `src/components/layout/MobileMenu.tsx` — slide-in menu for mobile, closes on nav
    - `src/components/layout/Layout.tsx` — wraps Header + `<Outlet />` + Footer
11. Wrap the app in providers: `HelmetProvider`, `QueryClientProvider`, React Router `BrowserRouter`
12. Create placeholder page components in `src/pages/` — each should render the Layout and a simple heading with the page name so we can verify routing works

## Design tokens

Apply these as CSS variables or Tailwind config:

- Primary: `#5C3D2E` (deep warm brown)
- Secondary: `#8FA98B` (soft sage green)
- Accent: `#D4A03C` (amber/gold)
- Background: `#FAF8F5` (off-white/cream)
- Text: `#2C2C2C` (charcoal)
- Error: `#C44536`
- Success: `#4A7C59`
- Headings font: Playfair Display (Google Fonts)
- Body font: Inter (Google Fonts)
- Border radius: 8–12px on cards and buttons
- Generous whitespace throughout

## Expected result

After this step I should be able to:
- `npm run dev` and see the site running
- Click through all nav links and see placeholder pages
- See the header, footer, and mobile menu working
- See the correct fonts and colors applied
