-- Close the coupon-code leak: the anon policy was USING (true), so the public
-- key could list every code. Coupons are admin-only now; customers check a
-- single code through check_coupon() (migration 023), which never returns ids
-- or other codes. The grant revoke is what guarantees it (grants are checked
-- before RLS), so the policy drop tolerates a renamed policy.
DROP POLICY IF EXISTS "Public read: coupons" ON coupons;
REVOKE ALL ON coupons FROM anon;

-- Codes that existed while the table was public may have been copied, so treat
-- them as leaked. They were never redeemable (checkout had no coupon field), so
-- nothing breaks; re-enable or replace them in Admin → Settings → Coupons.
UPDATE coupons SET is_active = false;
