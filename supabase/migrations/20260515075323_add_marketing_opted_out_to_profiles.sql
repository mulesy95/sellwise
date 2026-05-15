ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opted_out boolean NOT NULL DEFAULT false;
