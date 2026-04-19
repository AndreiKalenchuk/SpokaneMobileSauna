CREATE TABLE community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL UNIQUE,
  start_time TIME NOT NULL DEFAULT '16:30',
  end_time TIME NOT NULL DEFAULT '20:00',
  slot_minutes INT NOT NULL DEFAULT 60,
  location TEXT NOT NULL DEFAULT '1921 W 10th Ave, Spokane, WA 99204',
  capacity_per_slot INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_events_date_active
  ON community_events (event_date)
  WHERE is_active = true;
