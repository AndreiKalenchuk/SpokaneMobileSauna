-- The original delivery FAQ ("free within 25 miles, $2.50/mile") predates the
-- delivery/pickup pricing. {tokens} are filled from delivery_settings when the
-- FAQ renders (src/hooks/useFaqs.ts), so answers follow admin price changes.
UPDATE faqs
SET answer = 'Delivery is {delivery_fee} for the first {included_miles} driving miles, then {extra_mile_rate} per additional mile (we deliver up to {max_miles} miles). Enter your address while booking and we calculate the exact road distance and fee instantly. Delivery includes setup, a safety walkthrough, and pickup the next day. Prefer to pick it up yourself? Pickup is {pickup_price}.'
WHERE question = 'Is there a delivery fee?';

INSERT INTO faqs (question, answer, category, sort_order)
SELECT
  'Can I pick up the sauna myself?',
  'Yes — pickup is {pickup_price}. Our pickup spot is right off {pickup_exit} ({pickup_street}), about one minute from the interstate, so it''s easy in and easy out. We''ll send the exact pickup details after you book.',
  'Delivery & Setup',
  5
WHERE NOT EXISTS (
  SELECT 1 FROM faqs WHERE question = 'Can I pick up the sauna myself?'
);
