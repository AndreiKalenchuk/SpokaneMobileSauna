CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('weekday', 'weekend', 'holiday', 'custom')),
  price DECIMAL(10, 2) NOT NULL,
  day_of_week INT[],
  specific_dates DATE[],
  label VARCHAR,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
