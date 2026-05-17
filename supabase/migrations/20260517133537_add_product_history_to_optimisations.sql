-- Create optimisations table for tracking AI-generated listing improvements
CREATE TABLE IF NOT EXISTS public.optimisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('etsy', 'amazon', 'shopify', 'ebay')),
  product_id  text,
  shop_id     uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  input       jsonb NOT NULL DEFAULT '{}',
  output      jsonb NOT NULL DEFAULT '{}',
  score       integer,
  is_saved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.optimisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own optimisations"
  ON public.optimisations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own optimisations"
  ON public.optimisations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own optimisations"
  ON public.optimisations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS optimisations_user_created_idx
  ON public.optimisations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS optimisations_product_history_idx
  ON public.optimisations (user_id, shop_id, product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

-- Create keyword_lists table for saving research results
CREATE TABLE IF NOT EXISTS public.keyword_lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('etsy', 'amazon', 'shopify', 'ebay')),
  name        text NOT NULL,
  keywords    jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own keyword lists"
  ON public.keyword_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own keyword lists"
  ON public.keyword_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own keyword lists"
  ON public.keyword_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own keyword lists"
  ON public.keyword_lists FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS keyword_lists_user_platform_idx
  ON public.keyword_lists (user_id, platform, created_at DESC);
