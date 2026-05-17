-- Stores OAuth refresh tokens for eBay (and future platforms that use refresh tokens).
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS refresh_token text;
