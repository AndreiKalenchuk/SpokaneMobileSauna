# Step 9: SEO + Performance + Polish

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind. All pages and functionality are built. Now optimize for search engines, performance, and final visual polish. Business Name is Spokane cider mobile sauna, offers a mobile sauna 6 person with wood berning stove and adons ad venik, firewood essential oils rental, sauna delivers to you in any area in spokane and closest cites or out of area for additional change. Sauna has health benefits and good for muscles recovery

## Tasks

### SEO

1. **Verify `react-helmet-async`** is set on every page with unique:
   - `<title>` — e.g., "Book Your Mobile Sauna — [Business Name]" // Business Name is Spokane mobile sauna
   - `<meta name="description">` — unique per page, 150–160 chars
   - `<meta property="og:title">`, `og:description`, `og:image`, `og:url`
   - `<meta name="twitter:card" content="summary_large_image">`
   - `<link rel="canonical">`

2. **Structured Data (JSON-LD)** — inject via `react-helmet-async`:
   - Home page: `LocalBusiness` schema (name, address, phone, URL, opening hours, price range)
   - Products page: `Product` schema (name, description, price, availability)
   - FAQ page: `FAQPage` schema (list of Question + Answer pairs)

3. **Static SEO files** in `public/`:
   - `robots.txt`:
     ```
     User-agent: *
     Allow: /
     Sitemap: https://yoursaunarental.com/sitemap.xml
     ```
   - `sitemap.xml` — list all public page URLs with `<lastmod>` dates

4. **Semantic HTML audit** — ensure all pages use `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>` appropriately. Heading hierarchy should be `h1` → `h2` → `h3`, one `h1` per page.

### Performance

5. **Code splitting** — lazy-load route components with `React.lazy()` and `<Suspense>`:
   ```tsx
   const GalleryPage = lazy(() => import('./pages/GalleryPage'))
   const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
   ```
   Wrap with `<Suspense fallback={<PageSkeleton />}>`.

6. **Image optimization:**
   - All `<img>` tags below the fold should have `loading="lazy"` and `decoding="async"`
   - Add `width` and `height` attributes to prevent layout shift
   - Hero image: preload in `<head>` via `react-helmet-async`

7. **Bundle analysis** — add `rollup-plugin-visualizer` to `vite.config.ts` so the developer can inspect bundle size with `npm run build`

### Visual Polish

8. **Page transitions** — add Framer Motion `<AnimatePresence>` on route changes for smooth fade/slide transitions

9. **Scroll to top** on route change — React Router doesn't do this by default. Add a `ScrollToTop` component.

10. **404 page** — create a friendly "Page Not Found" page with a link back to Home

11. **Loading states audit** — verify every page that fetches data shows skeletons (not blank space) while loading

12. **Favicon** — add a favicon (can be a simple sauna/flame icon). Place `favicon.ico` and `favicon.svg` in `public/`. Add Apple touch icon.

13. **Open Graph image** — create a default OG image (1200×630px) at `public/og-image.jpg` — can be a placeholder for now, the owner will replace it with a real sauna photo.

## Expected result

After this step:
- Every page has proper meta tags and structured data
- Lighthouse SEO score is 90+
- Lighthouse Performance score is 85+
- Routes lazy-load and the initial bundle is lean
- Smooth page transitions and scroll behavior
- 404 page works
- Site feels polished and ready for real users
