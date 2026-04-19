-- Enable RLS
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_bookings ENABLE ROW LEVEL SECURITY;

-- community_events: public read active, authenticated full CRUD
CREATE POLICY "Public read active: community_events"
  ON community_events FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Auth full access: community_events"
  ON community_events FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- community_event_series: authenticated only
CREATE POLICY "Auth full access: community_event_series"
  ON community_event_series FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- community_bookings: anon can read aggregate fields for capacity calc, authenticated full CRUD
CREATE POLICY "Anon read availability: community_bookings"
  ON community_bookings FOR SELECT TO anon
  USING (true);

CREATE POLICY "Auth full access: community_bookings"
  ON community_bookings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
