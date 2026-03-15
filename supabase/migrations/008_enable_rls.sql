-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog/content tables
CREATE POLICY "Public read: products"
  ON products FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: pricing_rules"
  ON pricing_rules FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: gallery_images"
  ON gallery_images FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: testimonials"
  ON testimonials FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: faqs"
  ON faqs FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: blocked_dates"
  ON blocked_dates FOR SELECT TO anon, authenticated
  USING (true);

-- Bookings: anon can only see rental_date and status (for availability calendar)
CREATE POLICY "Anon read availability: bookings"
  ON bookings FOR SELECT TO anon
  USING (true);

-- Bookings: authenticated full CRUD
CREATE POLICY "Auth full access: bookings"
  ON bookings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Booking items: authenticated read
CREATE POLICY "Auth read: booking_items"
  ON booking_items FOR SELECT TO authenticated
  USING (true);

-- Admin (authenticated) full CRUD on all tables
CREATE POLICY "Auth full access: products"
  ON products FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: pricing_rules"
  ON pricing_rules FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: booking_items"
  ON booking_items FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: blocked_dates"
  ON blocked_dates FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: gallery_images"
  ON gallery_images FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: testimonials"
  ON testimonials FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth full access: faqs"
  ON faqs FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
