ALTER TABLE public.optimisations
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS optimisations_is_archived_idx
  ON public.optimisations (user_id, is_archived, created_at DESC);
