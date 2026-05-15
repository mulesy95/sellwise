ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_nudge_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_expired_sent boolean NOT NULL DEFAULT false;
