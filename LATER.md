# Post-Launch To-Do (Owner Checklist)

Tasks to complete after deploying the site.

---

## Contact & Business Info

- [ ] **Update phone number** — Replace `(555) 123-4567` in:
  - [ ] `src/lib/site-config.ts` (CONTACT.phone, CONTACT.phoneHref)
  - [ ] Footer (`src/components/layout/Footer.tsx`)
  - [ ] Contact page (`src/pages/ContactPage.tsx` — contactInfo)
  - [ ] LocalBusiness JSON-LD schema in HomePage (uses CONTACT)
- [ ] **Update email** — Replace placeholder email in the same files above
- [ ] **Update service area text** if needed (e.g. "Spokane and surrounding areas")

---

## Social Media

- [ ] **Update Facebook link** — Replace `#` with your Facebook page URL in:
  - [ ] `src/lib/site-config.ts` (SOCIAL.facebook)
  - [ ] Footer
  - [ ] Contact page
- [ ] **Update Instagram link** — Replace `#` with your Instagram URL in the same places
- [ ] Add TikTok link if desired (Footer currently has a placeholder)

---

## Images & Media

- [ ] **Add product pictures** — Replace placeholder images with real photos:
  - [ ] Primary sauna product (via Supabase/products or seed)
  - [ ] Add-ons (cold plunge, firewood, aromatherapy kit, venik)
- [ ] **Replace OG image** — Replace `public/og-image.jpg` with a real sauna photo (1200×630px) for social sharing
- [ ] **Gallery images** — Add real sauna photos to `public/gallery/` (exterior, interior) and seed via Supabase if using DB

---

## Domain & Deployment

- [ ] **Set `VITE_SITE_URL`** — Update env to `https://spokanemobilesauna.com` (or your final domain)
- [ ] **Update sitemap/robots** — Ensure `public/sitemap.xml` and `public/robots.txt` reference your final domain
- [ ] **Google Search Console** — Submit sitemap, request indexing

---

## Optional

- [ ] **Netlify prerendering** — Consider enabling for crawler bots (see REFERENCE.md)
- [ ] **Favicon** — Generate `favicon.ico` and `apple-touch-icon.png` from your logo if desired (e.g. via [realfavicongenerator.net](https://realfavicongenerator.net))
