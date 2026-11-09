-- Close a PII leak: the anon policy on bookings is USING (true) over every column,
-- so the public anon key could read all customers' names, emails, phones and
-- addresses. RLS filters rows, not columns, so restrict columns with grants:
-- anon keeps only what the availability calendar needs (rental_date, status) —
-- notably NOT id, so booking ids can't be enumerated.
REVOKE SELECT ON bookings FROM anon;
GRANT SELECT (rental_date, status) ON bookings TO anon;

-- The confirmation page reads a single booking by its unguessable id (the Stripe
-- return URL) through this function instead of selecting from the table.
-- Returns NULL when the id doesn't exist. Customer name and phone are omitted.
CREATE OR REPLACE FUNCTION get_booking_confirmation(p_booking_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', b.id,
    'booking_number', b.booking_number,
    'rental_date', b.rental_date,
    'status', b.status,
    'customer_email', b.customer_email,
    'fulfillment_method', b.fulfillment_method,
    'delivery_address', b.delivery_address,
    'delivery_distance_miles', b.delivery_distance_miles,
    'fulfillment_fee', b.fulfillment_fee,
    'subtotal', b.subtotal,
    'tax_amount', b.tax_amount,
    'total_amount', b.total_amount,
    'items', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', i.id,
            'name', p.name,
            'quantity', i.quantity,
            'total_price', i.total_price
          )
          ORDER BY p.sort_order
        )
        FROM booking_items i
        JOIN products p ON p.id = i.product_id
        WHERE i.booking_id = b.id
      ),
      '[]'::json
    )
  )
  FROM bookings b
  WHERE b.id = p_booking_id
$$;

REVOKE ALL ON FUNCTION get_booking_confirmation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_booking_confirmation(UUID) TO anon, authenticated;
