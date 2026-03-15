# Step 9B: Deploy to Production (YOU do this)

The site is built. Time to go live.

---

## 1. Push to GitHub

```bash
git add .
git commit -m "Complete sauna rental website"
git remote add origin https://github.com/YOUR_USERNAME/sauna-rental.git
git push -u origin main
```

## 2. Connect Netlify to GitHub

- [ ] Go to [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project"
- [ ] Select GitHub → authorize → choose your `sauna-rental` repo
- [ ] Build settings (should auto-detect from `netlify.toml`):
  - Build command: `npm run build`
  - Publish directory: `dist`
- [ ] **Environment variables** — click "Show advanced" and add:
  - `VITE_SUPABASE_URL` = your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` = your anon key
  - `VITE_STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key (use `pk_test_` for now)
  - `VITE_SITE_URL` = your Netlify URL (e.g., `https://your-site.netlify.app`) — update after first deploy
- [ ] Click "Deploy"
- [ ] Wait for the build to finish (~1–2 minutes)

## 3. Enable Netlify Prerendering (for SEO)

- [ ] Go to **Site settings → Build & Deploy → Post processing → Prerendering**
- [ ] Enable it — this serves pre-rendered HTML to search engine crawlers

## 4. Connect Your Custom Domain

You have two options. **Option A is recommended** — it's simpler and gives Netlify full control over DNS.

### Option A: Use Netlify DNS (recommended)

This tells your domain registrar "Netlify handles everything for this domain."

**Step 1 — Add domain in Netlify:**
- [ ] Go to **Site settings → Domain management → Add custom domain**
- [ ] Enter your domain (e.g., `yoursaunarental.com`)
- [ ] Netlify will say the domain isn't using Netlify DNS yet — click **"Set up Netlify DNS"**
- [ ] Netlify gives you **4 nameservers**, they look like:
  ```
  dns1.p05.nsone.net
  dns2.p05.nsone.net
  dns3.p05.nsone.net
  dns4.p05.nsone.net
  ```
- [ ] **Copy all 4 nameservers**

**Step 2 — Update nameservers at your registrar:**

Go to where you bought the domain and replace the default nameservers with Netlify's 4 nameservers.

<details>
<summary><strong>Bluehost</strong></summary>

> **Important:** You're paying Bluehost for hosting, but you won't need their hosting — Netlify hosts your site for free. You only need Bluehost for the domain name. After the site is live, consider transferring the domain to a cheaper registrar (Cloudflare Registrar ~$10/year, Namecheap ~$12/year) and cancelling the Bluehost hosting plan to stop paying for a service you don't use.

- Log in to [my.bluehost.com](https://my.bluehost.com)
- Go to **Domains** in the left sidebar
- Click on your domain name
- Click the **DNS** tab
- Scroll down to **Nameservers** section
- Click **"Edit"** next to the nameservers
- Select **"Custom nameservers"** (instead of Bluehost default)
- Enter Netlify's 4 nameservers (one per field):
  - `dns1.p05.nsone.net`
  - `dns2.p05.nsone.net`
  - `dns3.p05.nsone.net`
  - `dns4.p05.nsone.net`
  *(use the actual values Netlify gives you — these are examples)*
- Click **Save**
- Bluehost may show a warning about pointing away — that's fine, confirm it
- **If you use Bluehost email:** before changing nameservers, write down your MX records from Bluehost DNS settings. You'll need to add them in Netlify DNS after the switch so email keeps working.

</details>

<details>
<summary><strong>Hostinger</strong></summary>

- Log in → **Domains** → click your domain → **DNS / Nameservers**
- Click **"Change nameservers"**
- Delete the existing Hostinger nameservers
- Add Netlify's 4 nameservers
- Save

</details>

<details>
<summary><strong>Namecheap</strong></summary>

- Log in → **Domain List** → click **Manage** on your domain
- Under **Nameservers**, change from "Namecheap BasicDNS" to **"Custom DNS"**
- Enter Netlify's 4 nameservers
- Click the green checkmark to save

</details>

<details>
<summary><strong>GoDaddy</strong></summary>

- Log in → **My Products** → click **DNS** next to your domain
- Click **"Change nameservers"** → **"Enter my own nameservers"**
- Enter Netlify's 4 nameservers
- Save

</details>

<details>
<summary><strong>Google Domains / Squarespace Domains</strong></summary>

- Log in → select your domain → **DNS** → **Custom name servers**
- Switch to custom nameservers
- Enter Netlify's 4 nameservers
- Save

</details>

<details>
<summary><strong>Cloudflare Registrar</strong></summary>

- Log in → select your domain → **DNS** → **Records**
- Note: If your domain is on Cloudflare, you can't change nameservers away from Cloudflare. Use **Option B** below instead (add DNS records in Cloudflare pointing to Netlify).

</details>

**Step 3 — Wait for propagation:**
- [ ] This takes **15 minutes to 24 hours** (usually under 1 hour)
- [ ] Check status at [dnschecker.org](https://dnschecker.org) — search for your domain
- [ ] Once propagated, Netlify will show a green checkmark next to your domain

**Step 4 — HTTPS:**
- [ ] Netlify automatically provisions a **free SSL certificate** via Let's Encrypt
- [ ] This happens within minutes of DNS propagation
- [ ] Verify: visit `https://yourdomain.com` — should show the padlock icon

**Step 5 — Add www redirect:**
- [ ] In Netlify **Domain management**, also add `www.yoursaunarental.com` as a domain alias
- [ ] Netlify will auto-redirect `www` to the apex domain (or vice versa)

---

### Option B: Keep DNS at your registrar (external DNS)

Use this if you don't want to change nameservers (e.g., you have email or other services on the same domain).

**Step 1 — Add domain in Netlify:**
- [ ] Go to **Site settings → Domain management → Add custom domain**
- [ ] Enter your domain → when prompted, choose **"Add domain without Netlify DNS"**

**Step 2 — Add DNS records at your registrar:**

Go to your registrar's DNS settings and add these records:

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| **A** | `@` (or blank) | `75.2.60.5` | 5 min or Auto |
| **CNAME** | `www` | `your-netlify-site.netlify.app` | 5 min or Auto |

Replace `your-netlify-site.netlify.app` with your actual Netlify site URL (shown in Site settings → General).

**Step 3 — Wait and verify** (same as Option A, Step 3–5)

---

### After domain is connected:

- [ ] Update Netlify env var: `VITE_SITE_URL=https://yoursaunarental.com`
- [ ] Trigger a redeploy: **Deploys → Trigger deploy → Deploy site**
- [ ] Update `public/sitemap.xml` URLs to use your real domain
- [ ] Update `public/robots.txt` sitemap URL

## 5. Update Stripe Webhook URL (for production)

When you're ready for real payments:
- [ ] Go to **Stripe Dashboard → Developers → Webhooks**
- [ ] Update the endpoint URL to your production Supabase function URL
  (it's the same URL — Supabase doesn't change between test and live mode)
- [ ] Switch Stripe from test mode to live mode
- [ ] Update Supabase secrets with **live** Stripe keys:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_live_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_...
  ```
- [ ] Update Netlify env var: `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Trigger Netlify redeploy

## 6. Set Up Resend Domain (for professional emails)

- [ ] Go to **Resend → Domains → Add domain**
- [ ] Add your domain and follow DNS verification steps
- [ ] Once verified, update the Edge Function's `FROM_EMAIL`:
  ```bash
  supabase secrets set FROM_EMAIL=bookings@yourdomain.com
  ```

## 7. Verify Everything Works

- [ ] Visit your live URL — all pages load
- [ ] Book a sauna using Stripe test card `4242 4242 4242 4242`
- [ ] Check the booking appears in Supabase
- [ ] Check the confirmation email arrives
- [ ] Check the admin dashboard works at `/admin/login`
- [ ] Test on mobile phone
- [ ] Run Lighthouse audit (Chrome DevTools → Lighthouse)

## 8. Google Business Profile (recommended)

- [ ] Go to [business.google.com](https://business.google.com)
- [ ] Create or claim your business listing
- [ ] Add your website URL
- [ ] This helps with local "mobile sauna rental near me" searches more than any on-page SEO

---

## You're live! Checklist summary:

| Item | Status |
|------|--------|
| Site deployed on Netlify | ☐ |
| Prerendering enabled | ☐ |
| Custom domain connected | ☐ |
| Nameservers updated at registrar | ☐ |
| DNS propagated (check dnschecker.org) | ☐ |
| HTTPS working (padlock icon) | ☐ |
| www redirect working | ☐ |
| `VITE_SITE_URL` updated to real domain | ☐ |
| Stripe webhook on production URL | ☐ |
| Stripe in live mode (when ready) | ☐ |
| Resend domain verified | ☐ |
| Test booking works end-to-end | ☐ |
| Mobile tested | ☐ |
| Admin login works | ☐ |
| Google Business Profile created | ☐ |

*Delete this file after going live.*
