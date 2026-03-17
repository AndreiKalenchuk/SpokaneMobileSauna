-- =============================================================================
-- Products
-- =============================================================================
INSERT INTO products (id, name, slug, description, type, base_price, image_url, is_active, sort_order) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Mobile Sauna 6 Person', 'mobile-sauna-6-person',
   'Premium wood-fired cedar sauna delivered to your location. Seats 6. Includes bucket, ladle, thermometer, and firewood for 1hr session.',
   'primary', 229.00, '/gallery/exterior/exterior-1.jpg', true, 1),

  ('a1b2c3d4-0002-4000-8000-000000000002', 'Cold Plunge Tub', 'cold-plunge-tub',
   'Refreshing cold plunge tub to complement your sauna session. The ultimate contrast therapy experience.',
   'addon', 19.00, '/gallery/exterior/exterior-2.jpg', true, 2),

  ('a1b2c3d4-0003-4000-8000-000000000003', 'Extra Firewood Bundle', 'extra-firewood-bundle',
   'Additional 30 min of burn time.',
   'addon', 5.99, '/gallery/interior/interior-1.jpg', true, 3),

  ('a1b2c3d4-0004-4000-8000-000000000004', 'Aromatherapy Kit', 'aromatherapy-kit',
   'Essential oils: eucalyptus, birch, lavender.',
   'addon', 5.99, '/gallery/interior/interior-2.jpg', true, 4),

  ('a1b2c3d4-0005-4000-8000-000000000005', 'Sauna Whisk/Venik', 'sauna-whisk-venik',
   'To get full transformation into authentic sauna experience.',
   'addon', 28.99, '/gallery/interior/interior-3.jpg', true, 5);

-- =============================================================================
-- Pricing Rules
-- =============================================================================

-- Mobile Sauna pricing
INSERT INTO pricing_rules (product_id, rule_type, price, day_of_week, specific_dates, label, priority) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'weekday', 229.00, '{1,2,3,4}', NULL, 'Weekday rate', 1),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'weekend', 289.00, '{5,6,0}', NULL, 'Weekend rate', 2),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'holiday', 319.00, NULL,
   '{2026-01-01,2026-04-12,2026-05-25,2026-07-04,2026-09-07,2026-11-26,2026-12-24,2026-12-25,2026-12-31}',
   'Holiday rate', 3);

-- Cold Plunge Tub pricing (same all days)
INSERT INTO pricing_rules (product_id, rule_type, price, day_of_week, specific_dates, label, priority) VALUES
  ('a1b2c3d4-0002-4000-8000-000000000002', 'weekday', 19.00, '{1,2,3,4}', NULL, 'Weekday rate', 1),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'weekend', 19.00, '{5,6,0}', NULL, 'Weekend rate', 2),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'holiday', 19.00, NULL,
   '{2026-01-01,2026-04-12,2026-05-25,2026-07-04,2026-09-07,2026-11-26,2026-12-24,2026-12-25,2026-12-31}',
   'Holiday rate', 3);

-- Extra Firewood Bundle pricing (same all days)
INSERT INTO pricing_rules (product_id, rule_type, price, day_of_week, specific_dates, label, priority) VALUES
  ('a1b2c3d4-0003-4000-8000-000000000003', 'weekday', 5.99, '{1,2,3,4}', NULL, 'Weekday rate', 1),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'weekend', 5.99, '{5,6,0}', NULL, 'Weekend rate', 2),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'holiday', 5.99, NULL,
   '{2026-01-01,2026-04-12,2026-05-25,2026-07-04,2026-09-07,2026-11-26,2026-12-24,2026-12-25,2026-12-31}',
   'Holiday rate', 3);

-- Aromatherapy Kit pricing (same all days)
INSERT INTO pricing_rules (product_id, rule_type, price, day_of_week, specific_dates, label, priority) VALUES
  ('a1b2c3d4-0004-4000-8000-000000000004', 'weekday', 5.99, '{1,2,3,4}', NULL, 'Weekday rate', 1),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'weekend', 5.99, '{5,6,0}', NULL, 'Weekend rate', 2),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'holiday', 5.99, NULL,
   '{2026-01-01,2026-04-12,2026-05-25,2026-07-04,2026-09-07,2026-11-26,2026-12-24,2026-12-25,2026-12-31}',
   'Holiday rate', 3);

-- Sauna Whisk/Venik pricing (same all days)
INSERT INTO pricing_rules (product_id, rule_type, price, day_of_week, specific_dates, label, priority) VALUES
  ('a1b2c3d4-0005-4000-8000-000000000005', 'weekday', 28.99, '{1,2,3,4}', NULL, 'Weekday rate', 1),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'weekend', 28.99, '{5,6,0}', NULL, 'Weekend rate', 2),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'holiday', 28.99, NULL,
   '{2026-01-01,2026-04-12,2026-05-25,2026-07-04,2026-09-07,2026-11-26,2026-12-24,2026-12-25,2026-12-31}',
   'Holiday rate', 3);

-- =============================================================================
-- Testimonials (10)
-- =============================================================================
INSERT INTO testimonials (customer_name, rating, text, date, is_featured) VALUES
  ('Sarah M.', 5, 'Absolutely incredible experience! We had the sauna set up for a winter birthday party and everyone loved it. The wood-fired heat was perfect, and the cold plunge after was exhilarating.', '2026-01-15', true),
  ('Jake T.', 5, 'Best date night idea ever. My wife and I had the sauna in our backyard under the stars. Worth every penny. Already rebooked for next month!', '2026-01-22', true),
  ('Melissa R.', 4, 'Setup was fast and professional. The sauna reached temperature quickly and stayed hot for hours. Only wish we had booked the cold plunge too!', '2025-12-08', false),
  ('David K.', 5, 'We rented this for a team-building retreat and it was the highlight of the weekend. Six people fit comfortably and the aromatherapy kit was a great add-on.', '2025-11-20', true),
  ('Anna L.', 5, 'The venik experience brought back childhood memories of Finnish saunas. Authentic, relaxing, and so easy to book. Highly recommend the whisk add-on!', '2026-02-03', true),
  ('Chris P.', 4, 'Great concept and well-executed. The mobile sauna was clean, hot, and delivered right on schedule. We used it after a long ski day — perfection.', '2026-02-14', false),
  ('Emily W.', 5, 'This was the most unique gift I have ever given my husband. He absolutely loved it. The whole family ended up taking turns. Will be a yearly tradition now.', '2025-10-30', false),
  ('Marcus J.', 5, 'As someone who visits saunas in Finland regularly, I was impressed by the quality. The cedar smells amazing and the wood-fired heat is the real deal.', '2026-01-05', false),
  ('Priya S.', 4, 'Wonderful for a girls'' weekend! We paired it with wine and charcuterie on the patio. The eucalyptus aromatherapy kit made it feel like a luxury spa.', '2025-12-20', false),
  ('Tom H.', 5, 'I was skeptical about a "mobile" sauna but this thing is legit. Solid build, gets incredibly hot, and the delivery crew was super professional. 10/10.', '2026-03-01', true);

-- =============================================================================
-- FAQs (16)
-- =============================================================================

-- Booking & Pricing
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('How far in advance should I book?',
   'We recommend booking at least 1 week ahead, especially for weekends. Same-week availability may exist on weekdays.',
   'Booking & Pricing', 1),
  ('What is your cancellation policy?',
   'Free cancellation up to 72 hours before delivery. 50% refund for cancellations within 72–24 hours. No refund within 24 hours.',
   'Booking & Pricing', 2),
  ('Why are weekend/holiday prices different?',
   'Demand is higher on weekends and holidays. Weekday rentals offer the best value.',
   'Booking & Pricing', 3),
  ('Do you offer multi-day discounts?',
   'Yes! Contact us for custom multi-day pricing.',
   'Booking & Pricing', 4),
  ('Is there a delivery fee?',
   'Delivery is free within 25 miles of our home base. Beyond that, a fee of $2.50 per additional mile applies.',
   'Booking & Pricing', 5);

-- Delivery & Setup
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('What do I need to prepare at my location?',
   'A flat, level surface (grass, gravel, or driveway) at least 8×12 ft, with 10 ft clearance from buildings and overhead obstructions. Access for our trailer to back in.',
   'Delivery & Setup', 1),
  ('How long does setup take?',
   'About 30–45 minutes. We handle everything — delivery, setup, firing up the sauna, and pickup afterward.',
   'Delivery & Setup', 2),
  ('Can you deliver to any location?',
   'We deliver to private residences, Airbnb properties, event venues, and campsites within our service area. Contact us for special locations.',
   'Delivery & Setup', 3),
  ('What happens if the weather is bad?',
   'Rain, snow, or cold — the sauna runs in any weather! In fact, winter sessions with snowfall are our most popular. We only reschedule for severe weather warnings (thunderstorms, high winds).',
   'Delivery & Setup', 4);

-- Using the Sauna
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('How many people can fit?',
   'The sauna comfortably seats 6 adults.',
   'Using the Sauna', 1),
  ('How hot does it get?',
   'Our wood-fired sauna reaches 150–200°F (65–93°C). You control the temperature by adjusting the vent and adding water to the stones.',
   'Using the Sauna', 2),
  ('How much firewood is included?',
   'One bundle is included, providing about 1 hour of burn time. You can add extra bundles for $5.99 each for longer sessions.',
   'Using the Sauna', 3),
  ('Can I use the sauna in winter?',
   'Absolutely — winter is the best time! The contrast of cold air and hot sauna is an incredible experience. Many of our customers say winter sessions are their favorite.',
   'Using the Sauna', 4);

-- Payment & Cancellation
INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('What payment methods do you accept?',
   'We accept all major credit and debit cards through our secure online checkout powered by Stripe.',
   'Payment & Cancellation', 1),
  ('When am I charged?',
   'Your card is charged at the time of booking. You will receive a confirmation email with your booking details immediately.',
   'Payment & Cancellation', 2),
  ('Do I need to leave a security deposit?',
   'No deposit is required, but you are responsible for any damage beyond normal wear.',
   'Payment & Cancellation', 3);

-- =============================================================================
-- Coupons
-- =============================================================================
INSERT INTO coupons (code, discount_type, discount_value, max_uses, is_active) VALUES
  ('frends50', 'percent', 50.00, NULL, true),
  ('frends-50', 'fixed', 50.00, NULL, true);

-- =============================================================================
-- Gallery Images (real photos from public/gallery)
-- =============================================================================
INSERT INTO gallery_images (url, alt_text, caption, category, sort_order) VALUES
  -- Exterior
  ('/gallery/exterior/exterior-1.jpg', 'Mobile sauna exterior view', 'Our cedar mobile sauna ready for delivery', 'exterior', 1),
  ('/gallery/exterior/exterior-2.jpg', 'Sauna exterior at golden hour', 'Beautiful cedar exterior', 'exterior', 2),
  ('/gallery/exterior/exterior-3.jpg', 'Mobile sauna setup', 'Ready for your backyard', 'exterior', 3),
  ('/gallery/exterior/exterior-4.jpg', 'Sauna exterior view', 'Premium wood-fired mobile sauna', 'exterior', 4),
  ('/gallery/exterior/exterior-5.jpg', 'Cedar sauna exterior', 'Handcrafted mobile sauna', 'exterior', 5),
  -- Interior
  ('/gallery/interior/interior-1.jpg', 'Sauna interior with benches', 'Handcrafted cedar benches seat up to 6', 'interior', 6),
  ('/gallery/interior/interior-2.jpg', 'Sauna interior warm glow', 'Authentic wood-fired heat', 'interior', 7),
  ('/gallery/interior/interior-3.jpg', 'Cedar interior detail', 'Premium cedar interior', 'interior', 8),
  ('/gallery/interior/interior-4.jpg', 'Sauna benches and stove', 'The real sauna experience', 'interior', 9),
  ('/gallery/interior/interior-5.jpg', 'Cozy sauna interior', 'Relax and unwind', 'interior', 10),
  -- Video frames (extracted from sauna video)
  ('/gallery/interior/video-frame-01.jpg', 'Sauna in action', 'Our mobile sauna in use', 'interior', 11),
  ('/gallery/interior/video-frame-02.jpg', 'Sauna session', 'Enjoy the heat', 'interior', 12),
  ('/gallery/interior/video-frame-03.jpg', 'Sauna warmth', 'Wood-fired authenticity', 'interior', 13),
  ('/gallery/interior/video-frame-04.jpg', 'Sauna experience', 'Pure relaxation', 'interior', 14),
  ('/gallery/interior/video-frame-05.jpg', 'Mobile sauna session', 'Delivered to your door', 'interior', 15);
