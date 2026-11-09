-- Admin-editable delivery/pickup pricing and copy (Admin → Settings → Delivery & Pickup).
-- Exactly one row (id = 1). Read by the site and by the delivery-quote,
-- create-payment-intent and stripe-webhook edge functions.
-- Seed values mirror DEFAULT_DELIVERY_SETTINGS in supabase/functions/_shared/delivery.ts.
-- The origin used for distance is NOT stored here — it stays in the DELIVERY_ORIGIN secret.
CREATE TABLE delivery_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_base_fee DECIMAL(10, 2) NOT NULL DEFAULT 89 CHECK (delivery_base_fee >= 0),
  delivery_included_miles DECIMAL(6, 1) NOT NULL DEFAULT 20 CHECK (delivery_included_miles >= 0),
  delivery_rate_per_extra_mile DECIMAL(10, 2) NOT NULL DEFAULT 1 CHECK (delivery_rate_per_extra_mile >= 0),
  delivery_mile_rounding TEXT NOT NULL DEFAULT 'up'
    CHECK (delivery_mile_rounding IN ('up', 'nearest', 'down', 'exact')),
  delivery_max_miles DECIMAL(6, 1) NOT NULL DEFAULT 50 CHECK (delivery_max_miles > 0),
  delivery_note TEXT NOT NULL DEFAULT 'Includes setup, a safety walkthrough & next-day pickup.',
  delivery_points TEXT[] NOT NULL DEFAULT ARRAY[
    'Exact road-distance quote when you book',
    'Professional setup & safety walkthrough',
    'We collect it the next day'
  ],
  delivery_instructions TEXT[] NOT NULL DEFAULT ARRAY[
    'We''ll contact you 24 hours before your rental to confirm delivery details.',
    'Please ensure the delivery area is clear — level surface with 4 ft clearance from structures.',
    'The sauna will be delivered before 2 PM and picked up the next day after 10 AM.'
  ],

  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (pickup_fee >= 0),
  pickup_exit TEXT NOT NULL DEFAULT 'I-90 Exit 280A',
  pickup_street TEXT NOT NULL DEFAULT 'Maple St',
  pickup_area TEXT NOT NULL DEFAULT 'Spokane, WA',
  pickup_note TEXT NOT NULL DEFAULT 'About a minute off the interstate — easy in, easy out. We''ll send the exact pickup details after you book.',
  pickup_points TEXT[] NOT NULL DEFAULT ARRAY[
    'About one minute off the interstate',
    'Quick hitch-up and walkthrough at pickup',
    'Exact pickup details sent after booking'
  ],
  pickup_instructions TEXT[] NOT NULL DEFAULT ARRAY[
    'We''ll text you the exact pickup spot and time — it''s right off {pickup_exit} ({pickup_street}).',
    'Bring a vehicle that can tow the sauna trailer, plus your driver''s license.',
    'Have a level spot ready that meets the site requirements in our Rental Terms (Section 4). We walk you through setup and fire safety at pickup.'
  ],

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT at_least_one_fulfillment_method CHECK (delivery_enabled OR pickup_enabled)
);

INSERT INTO delivery_settings (id) VALUES (1);

ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read: delivery_settings"
  ON delivery_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Single seeded row: admins may edit it, never insert or delete
CREATE POLICY "Auth update: delivery_settings"
  ON delivery_settings FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
