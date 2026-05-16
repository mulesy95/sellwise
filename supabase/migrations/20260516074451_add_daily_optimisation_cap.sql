-- Daily optimisation cap to protect margin on unlimited plans.
-- Growth: 100/day, Studio: 250/day. Enforced in application layer via DAILY_OPTIMISATION_LIMITS.
-- The RPC resets daily_optimisations atomically when the date rolls over.

ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS daily_optimisations int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_reset_date date NOT NULL DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_month   date,
  p_type    text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_today date := CURRENT_DATE;
BEGIN
  INSERT INTO public.usage (
    user_id, month,
    optimisations, keywords, competitor, audits,
    daily_optimisations, daily_reset_date
  )
  VALUES (
    p_user_id, p_month,
    CASE WHEN p_type = 'optimisations' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'keywords'      THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'competitor'    THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'audits'        THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'optimisations' THEN 1 ELSE 0 END,
    v_today
  )
  ON CONFLICT (user_id, month) DO UPDATE SET
    optimisations       = public.usage.optimisations + CASE WHEN p_type = 'optimisations' THEN 1 ELSE 0 END,
    keywords            = public.usage.keywords      + CASE WHEN p_type = 'keywords'      THEN 1 ELSE 0 END,
    competitor          = public.usage.competitor    + CASE WHEN p_type = 'competitor'    THEN 1 ELSE 0 END,
    audits              = public.usage.audits        + CASE WHEN p_type = 'audits'        THEN 1 ELSE 0 END,
    daily_optimisations = CASE
      WHEN public.usage.daily_reset_date < v_today
        THEN CASE WHEN p_type = 'optimisations' THEN 1 ELSE 0 END
      ELSE public.usage.daily_optimisations + CASE WHEN p_type = 'optimisations' THEN 1 ELSE 0 END
    END,
    daily_reset_date    = CASE
      WHEN public.usage.daily_reset_date < v_today THEN v_today
      ELSE public.usage.daily_reset_date
    END;
END;
$$;
