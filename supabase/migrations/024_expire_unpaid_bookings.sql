-- Abandoned checkouts. create-payment-intent inserts a 'pending' booking when the
-- customer reaches the payment step; if they never pay, that row used to hold
-- the date (and its coupon use) until an admin cancelled it. Holds now last 10
-- minutes — name/email/phone are entered before the hold starts, so only the
-- card is left — and a cron job cancels expired holds every minute, which frees
-- the date and gives the coupon use back (track_coupon_use trigger, 023).
--
-- The job doesn't touch Stripe, so a payment already in flight can still
-- succeed after expiry: stripe-webhook then reinstates the booking if the date
-- is still free, or refunds it automatically if someone else took the date.
-- The checkout counts down and disables Pay when the hold ends.

ALTER TABLE bookings ADD COLUMN hold_expires_at TIMESTAMPTZ;
-- New bookings only; confirmed/completed rows never expire
ALTER TABLE bookings ALTER COLUMN hold_expires_at SET DEFAULT now() + interval '10 minutes';
UPDATE bookings
SET hold_expires_at = created_at + interval '10 minutes'
WHERE status = 'pending';

-- Returns how many holds it released. Also called by create-payment-intent
-- right before its availability check, so a checkout never waits on the cron.
CREATE OR REPLACE FUNCTION expire_unpaid_bookings()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expired AS (
    UPDATE bookings
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'pending' AND hold_expires_at < now()
    RETURNING 1
  )
  SELECT count(*)::int FROM expired
$$;

-- Service role (edge functions) and the cron job only
REVOKE ALL ON FUNCTION expire_unpaid_bookings() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Same name → replaces an existing job instead of adding a second one
SELECT cron.schedule(
  'expire-unpaid-bookings',
  '* * * * *',
  'SELECT public.expire_unpaid_bookings()'
);
