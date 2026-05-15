ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_queued_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_optimisation_at timestamptz;
