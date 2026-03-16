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
  - `anon public`  
  - `service_role` e8

## 3. Create Stripe Account

- [ ] Go to [stripe.com](https://stripe.com) → sign up
- [ ] You'll start in **test mode** (no real charges) — perfect for development
- [ ] Go to **Developers → API keys** and copy:
  - `Publishable key`
  - `Secret key` 
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
