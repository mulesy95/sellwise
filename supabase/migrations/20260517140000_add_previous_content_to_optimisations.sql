ALTER TABLE public.optimisations
ADD COLUMN IF NOT EXISTS previous_content jsonb;
