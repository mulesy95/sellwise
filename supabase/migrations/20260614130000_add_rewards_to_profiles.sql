ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optimisation_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date date,
  ADD COLUMN IF NOT EXISTS weekly_goal int NOT NULL DEFAULT 5;
