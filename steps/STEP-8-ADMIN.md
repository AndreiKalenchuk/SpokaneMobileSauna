# Step 8: Admin Dashboard

> **Give this entire prompt to the AI agent in Cursor.**

## Context

Mobile sauna rental website. React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase. The public-facing site is complete with booking and payments working. Now build a simple admin dashboard for the business owner to manage bookings and settings.

## Task

Build admin pages under the `/admin` route, protected by Supabase Auth.

### Authentication

1. Create `src/pages/admin/AdminLoginPage.tsx`:
   - Simple login form: email + password
   - Use `supabase.auth.signInWithPassword()`
   - On success, redirect to `/admin`
   - On error, show error message

2. Create a `ProtectedRoute` component that wraps all `/admin/*` routes:
   - Check `supabase.auth.getSession()` on load
   - Listen to `supabase.auth.onAuthStateChange()`
   - If not authenticated, redirect to `/admin/login`
   - Show a loading spinner while checking auth

3. Create `src/components/admin/AdminLayout.tsx`:
   - Sidebar navigation: Dashboard, Bookings, Settings, Logout
   - Different layout from the public site (no public header/footer)
   - "Logout" calls `supabase.auth.signOut()` and redirects to `/`

### Admin Dashboard (`/admin`)
- Summary cards:
  - Total bookings this month
  - Revenue this month
  - Upcoming bookings (next 7 days)
  - Today's booking (if any)
- Simple stats fetched from Supabase with aggregate queries

### Bookings Management (`/admin/bookings`)
- Table of all bookings (shadcn/ui Table component)
- Columns: Booking #, Customer Name, Date, Status, Total, Created
- Filter by status: All, Pending, Confirmed, Completed, Cancelled
- Sort by date (newest first by default)
- Click a row to see full details in a side panel:
  - All booking fields
  - Line items (products + quantities + prices)
  - Customer contact info
  - Status update buttons: "Mark Completed", "Cancel Booking"
  - Cancel should update status to 'cancelled' in Supabase

### Settings (`/admin/settings`)

**Blocked Dates tab:**
- Calendar view showing currently blocked dates (highlighted in red)
- Click a date to block/unblock it
- "Block Date" form: pick a date, enter reason, save to `blocked_dates` table
- List of blocked dates with delete button

**Products tab:**
- List of all products with edit button
- Edit form: name, description, base_price, is_active toggle
- (No delete — just deactivate with is_active = false)

**Pricing Rules tab:**
- List of pricing rules grouped by product
- Edit form: price, rule_type, day_of_week, specific_dates
- Add new rule

## Data Access

All queries use `supabase` client. Since the admin is authenticated via Supabase Auth, RLS policies from Step 2 should allow full CRUD on all tables for authenticated users.

## Requirements
- Clean, functional admin UI — doesn't need to be fancy, just usable
- Use shadcn/ui Table, Dialog, Form components
- Responsive (should work on a tablet)
- No `react-helmet-async` needed for admin pages (no SEO)
