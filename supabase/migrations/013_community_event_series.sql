CREATE TABLE community_event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '16:30',
  end_time TIME NOT NULL DEFAULT '20:00',
  slot_minutes INT NOT NULL DEFAULT 60,
  location TEXT NOT NULL DEFAULT '1921 W 10th Ave, Spokane, WA 99204',
  capacity_per_slot INT NOT NULL DEFAULT 10,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
