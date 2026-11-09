-- Delivery vs. pickup for private rentals.
-- fulfillment_fee is derived server-side: the driving-distance delivery fee or the
-- pickup fee (see supabase/functions/_shared/delivery.ts). It is part of the
-- taxable subtotal.
ALTER TABLE bookings
  ADD COLUMN fulfillment_method TEXT NOT NULL DEFAULT 'delivery'
    CHECK (fulfillment_method IN ('delivery', 'pickup')),
  ADD COLUMN delivery_distance_miles DECIMAL(6, 1),
  ADD COLUMN fulfillment_fee DECIMAL(10, 2) NOT NULL DEFAULT 0;
