# Step 2B: Push Database to Supabase (YOU do this)

After the AI generates the migration and seed files in Step 2, run these commands yourself.

---

## 1. Link your local project to Supabase

```bash
cd sauna-rental
supabase init          # if not already done — creates supabase/ folder
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is the part of your Supabase URL before `.supabase.co` (e.g., `abcdefghijklm`).

## 2. Push migrations to the database

```bash
supabase db push
```

This runs all files in `supabase/migrations/` in order against your remote Supabase database.

## 3. Run the seed data

```bash
# Option A: via Supabase CLI
supabase db reset    # WARNING: this drops and recreates everything, then seeds

# Option B: manually in the Supabase dashboard
# Go to SQL Editor → paste the contents of supabase/seed.sql → Run
```

## 4. Verify in Supabase Dashboard

- [ ] Go to **Table Editor** — you should see all 7 tables with data
- [ ] Go to **Authentication → Policies** — verify RLS is enabled on all tables
- [ ] Test a query in **SQL Editor**: `SELECT * FROM products WHERE is_active = true;`

## 5. Set up your .env file

Copy `.env.example` to `.env` and fill in your Supabase and Stripe keys:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...your-key...
VITE_SITE_URL=http://localhost:5173
```

## 6. Test data fetching

Run `npm run dev` and open the browser console. If the hooks from Step 2 are connected to any page, you should see data loading. If not, you'll verify this in Step 3 when building the Home page.

---

*Delete this file after completing all items above.*
