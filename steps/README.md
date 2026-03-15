# Build Steps — Mobile Sauna Rental Website

Work through these in order. **Delete each file after completing it** to keep your workspace clean.

| Step | File | Who does it | What |
|------|------|------------|------|
| 0 | `STEP-0-MANUAL-SETUP.md` | **You** | Create accounts: GitHub, Supabase, Stripe, Resend, Netlify. Install Supabase CLI. |
| 1 | `STEP-1-SCAFFOLDING.md` | **AI agent** | Scaffold React + Vite project, install deps, set up routing + layout |
| 2 | `STEP-2-DATABASE.md` | **AI agent** | Write SQL migrations, seed data, TypeScript types, data hooks, pricing utility |
| 2B | `STEP-2B-MANUAL-DATABASE.md` | **You** | Push migrations to Supabase, run seed, set up `.env` |
| 3 | `STEP-3-HOME-PAGE.md` | **AI agent** | Build the full Home page with all sections |
| 4 | `STEP-4-CONTENT-PAGES.md` | **AI agent** | Build Products, Gallery, FAQ, About, Contact, Terms, Privacy pages |
| 5 | `STEP-5-BOOKING-CALENDAR.md` | **AI agent** | Interactive calendar with dynamic pricing + add-on selection |
| 6 | `STEP-6-CHECKOUT.md` | **AI agent** | Checkout form + Stripe Payment Element + confirmation page |
| 7 | `STEP-7-EDGE-FUNCTIONS.md` | **AI agent** | Write 3 Supabase Edge Functions (payment, webhook, contact) |
| 7B | `STEP-7B-MANUAL-DEPLOY.md` | **You** | Deploy Edge Functions, configure Stripe webhook, test payment flow |
| 8 | `STEP-8-ADMIN.md` | **AI agent** | Admin dashboard: login, bookings, settings, blocked dates |
| 8B | `STEP-8B-MANUAL-ADMIN-USER.md` | **You** | Create admin user in Supabase, test admin access |
| 9 | `STEP-9-SEO-POLISH.md` | **AI agent** | SEO meta tags, structured data, performance, animations, 404 page |
| 9B | `STEP-9B-MANUAL-DEPLOY.md` | **You** | Deploy to Netlify, connect domain, go live |

**Full reference spec:** `../REFERENCE.md` — the complete detailed document with all page specs, database schema, design system, pricing logic, etc. The AI agent can consult this if it needs more detail on any section.
