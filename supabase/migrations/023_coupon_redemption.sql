-- Coupons that admins issue with an expiry date and a quantity.
--
-- A booking holds one use of its coupon from checkout until it is cancelled
-- (declined card, admin cancel) or deleted — the same lifetime as its hold on
-- the date. coupons.current_uses is that count, kept by a trigger on bookings,
-- so admins see uses left live and two customers can't both take the last use.
-- The discount amount itself is computed in supabase/functions/_shared/coupons.ts.

-- 1. Shape: uppercase letters and numbers (dashes allowed between groups), a
--    discount Stripe can still charge (percent below 100), an expiry DATE —
--    valid through that day, Pacific time — and a quantity. starts_at and
--    min_order_amount were never set or used.
UPDATE coupons SET code = upper(trim(code));

ALTER TABLE coupons ADD COLUMN expires_on DATE;
UPDATE coupons
SET expires_on = (expires_at AT TIME ZONE 'America/Los_Angeles')::date
WHERE expires_at IS NOT NULL;

ALTER TABLE coupons
  DROP COLUMN expires_at,
  DROP COLUMN starts_at,
  DROP COLUMN min_order_amount,
  ADD CONSTRAINT coupons_code_format
    CHECK (code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' AND length(code) BETWEEN 4 AND 32),
  ADD CONSTRAINT coupons_discount_range
    CHECK (discount_value > 0 AND (discount_type = 'fixed' OR discount_value < 100)),
  ADD CONSTRAINT coupons_max_uses_positive
    CHECK (max_uses IS NULL OR max_uses > 0),
  ADD CONSTRAINT coupons_current_uses_nonnegative
    CHECK (current_uses >= 0);

-- 2. Redemption rules, in one place. Inactive codes read as not_found so a
--    disabled code isn't confirmed to exist. Admins also select it as a
--    computed column (coupons?select=*,coupon_unavailable_reason).
CREATE OR REPLACE FUNCTION coupon_unavailable_reason(c coupons)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.id IS NULL OR NOT c.is_active THEN 'not_found'
    WHEN c.expires_on < (now() AT TIME ZONE 'America/Los_Angeles')::date THEN 'expired'
    WHEN c.max_uses IS NOT NULL AND c.current_uses >= c.max_uses THEN 'used_up'
  END
$$;

REVOKE ALL ON FUNCTION coupon_unavailable_reason(coupons) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION coupon_unavailable_reason(coupons) TO authenticated;

-- 3. Checkout checks one code at a time. Returns only what the order summary
--    needs — never the row id, usage counts or other codes:
--      {"valid": true, "code": ..., "discount_type": ..., "discount_value": ...}
--      {"valid": false, "reason": "not_found" | "expired" | "used_up"}
CREATE OR REPLACE FUNCTION check_coupon(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c coupons;
  reason TEXT;
BEGIN
  SELECT * INTO c FROM coupons WHERE code = upper(trim(p_code));
  reason := coupon_unavailable_reason(c);
  IF reason IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'reason', reason);
  END IF;
  RETURN json_build_object(
    'valid', true,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value
  );
END
$$;

REVOKE ALL ON FUNCTION check_coupon(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_coupon(TEXT) TO anon, authenticated;

-- 4. Keep current_uses = bookings holding the coupon (any status but cancelled).
--    A new booking must find a use left; concurrent checkouts serialize on the
--    coupon row (FOR UPDATE), so the last use goes to exactly one of them.
--    A booking returning from 'cancelled' is always counted, even past the
--    limit: that is a card retried after a decline, and the money is taken.
CREATE OR REPLACE FUNCTION track_coupon_use()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_coupon UUID;
  new_coupon UUID;
  c coupons;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    IF OLD.status <> 'cancelled' THEN old_coupon := OLD.coupon_id; END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    IF NEW.status <> 'cancelled' THEN new_coupon := NEW.coupon_id; END IF;
  END IF;

  IF old_coupon IS NOT DISTINCT FROM new_coupon THEN
    RETURN NULL;
  END IF;

  IF old_coupon IS NOT NULL THEN
    UPDATE coupons SET current_uses = GREATEST(current_uses - 1, 0) WHERE id = old_coupon;
  END IF;

  IF new_coupon IS NOT NULL THEN
    SELECT * INTO c FROM coupons WHERE id = new_coupon FOR UPDATE;
    IF TG_OP = 'INSERT' AND coupon_unavailable_reason(c) IS NOT NULL THEN
      RAISE EXCEPTION 'coupon_unavailable: %', coupon_unavailable_reason(c);
    END IF;
    UPDATE coupons SET current_uses = current_uses + 1 WHERE id = new_coupon;
  END IF;

  RETURN NULL;
END
$$;

CREATE TRIGGER bookings_track_coupon_use
  AFTER INSERT OR DELETE OR UPDATE OF status, coupon_id ON bookings
  FOR EACH ROW EXECUTE FUNCTION track_coupon_use();

-- Start from the truth (no booking had a coupon so far, but be exact)
UPDATE coupons c
SET current_uses = (
  SELECT count(*) FROM bookings b
  WHERE b.coupon_id = c.id AND b.status <> 'cancelled'
);

-- 5. The confirmation page shows the discount line.
CREATE OR REPLACE FUNCTION get_booking_confirmation(p_booking_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', b.id,
    'booking_number', b.booking_number,
    'rental_date', b.rental_date,
    'status', b.status,
    'customer_email', b.customer_email,
    'fulfillment_method', b.fulfillment_method,
    'delivery_address', b.delivery_address,
    'delivery_distance_miles', b.delivery_distance_miles,
    'fulfillment_fee', b.fulfillment_fee,
    'subtotal', b.subtotal,
    'discount_amount', b.discount_amount,
    'tax_amount', b.tax_amount,
    'total_amount', b.total_amount,
    'items', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', i.id,
            'name', p.name,
            'quantity', i.quantity,
            'total_price', i.total_price
          )
          ORDER BY p.sort_order
        )
        FROM booking_items i
        JOIN products p ON p.id = i.product_id
        WHERE i.booking_id = b.id
      ),
      '[]'::json
    )
  )
  FROM bookings b
  WHERE b.id = p_booking_id
$$;
