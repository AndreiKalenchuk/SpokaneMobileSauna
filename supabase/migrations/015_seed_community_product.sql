INSERT INTO products (name, slug, description, type, base_price, is_active, sort_order)
VALUES (
  'Community Sauna Seat',
  'community-sauna',
  'A one-hour community sauna session at 1921 W 10th Ave, Spokane. Bring your towel, robe, and water bottle.',
  'standalone',
  29.95,
  true,
  100
)
ON CONFLICT (slug) DO NOTHING;
