# Sauna Rental Booking

React + TypeScript + Vite app with Supabase backend and Stripe payments.

## Getting Started

```bash
npm install
npm run dev
```

## Making Database Changes

### Standard Flow

```bash
supabase migration new my_change_name
# edit the generated file in supabase/migrations/ with your SQL
supabase db push
```

- `supabase db push` only runs **new** migrations — it won't re-run ones already applied
- Always keep a migration file in your repo for every schema change, regardless of how you apply it
- If you need to set the DB password for CLI access: `export SUPABASE_DB_PASSWORD='your-password'`

## Corporate Proxy Workaround

If `supabase` CLI commands fail with "Service Unavailable", it's the corporate PAC proxy
(`directvpac.blob.core.windows.net`) blocking outbound HTTPS to `api.supabase.com`.

**Fix — prefix any supabase command with `NO_PROXY="*"`:**

```bash
NO_PROXY="*" supabase db push
NO_PROXY="*" supabase secrets set MY_KEY=my_value
NO_PROXY="*" supabase functions deploy my-function
```

Or set it for the whole terminal session:

```bash
export NO_PROXY="*"
```

To make it permanent, add `export NO_PROXY="*"` to `~/.zshrc`.

### Fallback — Use the Dashboard

If the CLI still fails:

1. **Migrations:** Create the migration file locally, then go to **Supabase Dashboard → SQL Editor** and paste + run the same SQL manually
2. **Secrets:** Go to **Supabase Dashboard → Edge Functions → Manage Secrets** and add them via the UI
3. Commit the migration file to your repo
