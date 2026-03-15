# Step 0: Manual Setup (YOU do this — not the AI)

Complete these before giving any prompts to the AI agent. Each section takes 5–10 minutes.

---

## 1. Create GitHub Repository

- [ ] Go to [github.com/new](https://github.com/new)
- [ ] Name: `sauna-rental` (or your preference)
- [ ] Private repo, no template, no README (the AI will generate these)
- [ ] Copy the repo URL — you'll need it in Step 1

## 2. Create Supabase Project

- [ ] Go to [supabase.com](https://supabase.com) → sign up / sign in with GitHub
- [ ] Click "New Project"
- [ ] Name: `sauna-rental`
- [ ] Set a strong database password — **save it somewhere safe**
- [ ] Region: pick the closest to your customers
- [ ] Wait for the project to finish provisioning (~2 minutes)
- [ ] Go to **Settings → API** and copy these values (you'll need them in Step 1):
  - `Project URL` (looks like `https://lgqmeanxmmozvpkdxcjw.supabase.co`)
  - `anon public` eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncW1lYW54bW1venZwa2R4Y2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mjc2MjAsImV4cCI6MjA4OTEwMzYyMH0.OSh3DpavVZug9gBq7rNPmxdfhts34qLBiAl270gf1XU 
  - `service_role` eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxncW1lYW54bW1venZwa2R4Y2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyNzYyMCwiZXhwIjoyMDg5MTAzNjIwfQ.ZSMgEcfMHIicOLiVwnRYQCzXnSJKUpE9b1zBHSo0Fe8

## 3. Create Stripe Account

- [ ] Go to [stripe.com](https://stripe.com) → sign up
- [ ] You'll start in **test mode** (no real charges) — perfect for development
- [ ] Go to **Developers → API keys** and copy:
  - `Publishable key` pk_test_51TB204GuFwIacsDYvYubQvKjmtcHkeUczjD2QRp9IuNZAo7CI9gWF1nEbkZkzM7DzlsgxEMZI7p8yPskoP9YgLTZ00SJMrXM8l 
  - `Secret key` sk_test_51TB204GuFwIacsDYCK1ZtduGWVmGlOMShbzJfG26g7E3v6jOZHAu4vWGl575aiRfHJn3qNl6diQZrXM3TBh5skht00u3VXzED5
- [ ] **Don't** activate your account yet — do that only when you're ready to accept real payments

## 4. Create Resend Account (for emails)

- [ ] Go to [resend.com](https://resend.com) → sign up
- [ ] Go to **API Keys** → create a new key
- [ ] Copy the API key  re_3BZn6zK4_62DGtpetT7zDQNxkk1BdvSET
- [ ] Note: on the free tier you can only send from `onboarding@resend.dev` until you verify your own domain. That's fine for development.

## 5. Install Supabase CLI (on your machine)

```bash
# macOS
brew install supabase/tap/supabase

# or via npm (any OS)
npm install -g supabase
```

- [ ] Verify: `supabase --version` should print a version number
- [ ] Log in: `supabase login` (opens browser for GitHub auth)

## 6. Create Netlify Account

- [ ] Go to [netlify.com](https://netlify.com) → sign up with GitHub
- [ ] **Don't create a site yet** — you'll connect the GitHub repo after Step 1

## 7. Buy a Domain (optional — can do later)

- [ ] Namecheap, Google Domains, Cloudflare Registrar — wherever you prefer
- [ ] ~$12/year for a `.com`
- [ ] You'll point it to Netlify later in Step 9

---

## Checklist Summary

After completing this step, you should have:

| Item | Where to find it |
|------|-----------------|
| GitHub repo URL | github.com/your-username/sauna-rental |
| Supabase Project URL | Supabase dashboard → Settings → API |
| Supabase Anon Key | Supabase dashboard → Settings → API |
| Supabase Service Role Key | Supabase dashboard → Settings → API |
| Stripe Publishable Key | Stripe dashboard → Developers → API keys |
| Stripe Secret Key | Stripe dashboard → Developers → API keys |
| Resend API Key | Resend dashboard → API Keys |
| Supabase CLI installed | `supabase --version` works |
| Netlify account | netlify.com (connected to GitHub) |

**Keep all these keys handy — you'll plug them in during Step 1.**

---

*Delete this file after completing all items above.*
