ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS winback_sent boolean NOT NULL DEFAULT false;
