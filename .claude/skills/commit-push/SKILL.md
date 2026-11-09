---
name: commit-push
description: Commit and push changes in this sauna-rental repo — pushing main redeploys the site on Netlify. Use when the user asks to commit, push, ship, or redeploy this project.
argument-hint: "[optional commit message or scope]"
---

# Commit & push — Spokane Mobile Sauna

Pushing `main` deploys production: Netlify builds every push to `main`.
Supabase (migrations, edge functions, secrets) is **not** deployed by a push — see step 7.

## 1. Inspect

- `git status --short`, `git diff --stat`, `git log --oneline -5` (match the message style).
- Read the diff of anything you didn't write in this session before staging it; ask if unsure it belongs.

## 2. Never commit

- `.env`, `.env.*` (gitignored — keep it that way), `supabase/.temp/`, `.claude/settings.local.json`.
- `CLAUDE.md` — untracked on purpose (machine-specific proxy details). Stage with `git add -A -- . ':!CLAUDE.md'`.
- Secrets: Stripe/Supabase keys, the service-role key, the `DELIVERY_ORIGIN` value or the pickup street address, internal/corporate hostnames.

Scan what's staged; any hit on an added (`+`) line → unstage it and tell the user:

```bash
git diff --cached | grep -nE 'sk_(live|test)_[A-Za-z0-9]{8}|eyJhbGci|service_role_key|DELIVERY_ORIGIN=[0-9-]'
```

## 3. Lockfile check (Netlify)

If `package-lock.json` is staged, every `resolved` URL must use the public npm registry or the Netlify build fails with `ENOTFOUND` (see README). This must print nothing:

```bash
grep '"resolved"' package-lock.json | grep -v 'https://registry.npmjs.org/' | head
```

## 4. Verify

```bash
npm run test:unit
npm run lint    # some findings pre-exist — compare the count with before; don't add new ones
npm run build
```

## 5. Commit

- Stage explicit paths, never blindly.
- Message style used here: `feat:` / `fix:` / `docs:` / `refactor:` / `chore:` + imperative summary (≤ 72 chars), blank line, bullet body for multi-part changes. Pass it with a heredoc (`git commit -F - <<'EOF'`).
- End with the attribution lines the current session requires.
- Split unrelated work into separate commits when the files don't overlap.

## 6. Push

- Push only when the user asked to push/deploy. `main` is production; for work that shouldn't go live yet, branch first.
- Remote git commands need the corporate proxy bypassed (local commands don't):

  ```bash
  NO_PROXY="*" no_proxy="*" git -c http.proxy= -c https.proxy= push
  # new branch: ... push -u origin <branch>
  ```

- `.husky/pre-push` runs `npm test`, **including integration tests against the live Supabase project** (needs `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`; inserts then deletes fixture rows). Run it with `NO_PROXY="*" no_proxy="*"` set. If it fails, report the failing test — never use `--no-verify` unless the user explicitly says so.
- Non-fast-forward rejection: `NO_PROXY="*" no_proxy="*" git -c http.proxy= -c https.proxy= pull --rebase origin main`, re-run the tests, push again. Never force-push `main`.

## 7. After pushing

- Report the commit hashes and messages, the branch, and the push result (Netlify builds automatically).
- If the pushed commits touch `supabase/migrations/` or `supabase/functions/`, remind the user those deploy separately — and only run them with their go-ahead (they change production):
  - migrations: `NO_PROXY="*" supabase db push` (or paste the files into Dashboard → SQL Editor, in order)
  - functions: `NO_PROXY="*" supabase functions deploy <name ...>`
  - secrets: `NO_PROXY="*" supabase secrets set KEY=value` (or Dashboard → Edge Functions → Secrets)
