-- Expand platform CHECK constraint to include all 9 supported platforms.
-- The original constraint only allowed 4 (etsy/amazon/shopify/ebay).
-- New platforms (woocommerce/wix/squarespace/tiktok/social) were silently failing.

-- optimisations table
ALTER TABLE public.optimisations
  DROP CONSTRAINT IF EXISTS optimisations_platform_check;

ALTER TABLE public.optimisations
  ADD CONSTRAINT optimisations_platform_check
  CHECK (platform IN ('etsy', 'amazon', 'shopify', 'ebay', 'woocommerce', 'wix', 'squarespace', 'tiktok', 'social'));

-- keyword_lists table
ALTER TABLE public.keyword_lists
  DROP CONSTRAINT IF EXISTS keyword_lists_platform_check;

ALTER TABLE public.keyword_lists
  ADD CONSTRAINT keyword_lists_platform_check
  CHECK (platform IN ('etsy', 'amazon', 'shopify', 'ebay', 'woocommerce', 'wix', 'squarespace', 'tiktok', 'social'));

-- Ensure feedback column exists (may not exist in production if migration was missed)
ALTER TABLE public.optimisations
  ADD COLUMN IF NOT EXISTS feedback text
  CHECK (feedback IN ('up', 'down'));

-- Ensure is_archived column exists (may not exist in production if migration was missed)
ALTER TABLE public.optimisations
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Ensure score column exists
ALTER TABLE public.optimisations
  ADD COLUMN IF NOT EXISTS score integer;
