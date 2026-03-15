ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: coupons"
  ON coupons FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Auth full access: coupons"
  ON coupons FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
