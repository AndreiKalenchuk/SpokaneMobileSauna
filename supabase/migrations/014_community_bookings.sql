CREATE TABLE community_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR NOT NULL UNIQUE,
  event_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  customer_phone VARCHAR,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_bookings_date_slot
  ON community_bookings (event_date, slot_time)
  WHERE status != 'cancelled';

CREATE INDEX idx_community_bookings_event_date
  ON community_bookings (event_date);
