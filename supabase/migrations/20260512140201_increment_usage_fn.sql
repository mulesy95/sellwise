-- Atomic upsert + increment for usage tracking.
create or replace function public.increment_usage(
  p_user_id uuid,
  p_month   date,
  p_type    text
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.usage (user_id, month, optimisations, keywords, competitor, audits)
  values (
    p_user_id, p_month,
    case when p_type = 'optimisations' then 1 else 0 end,
    case when p_type = 'keywords'      then 1 else 0 end,
    case when p_type = 'competitor'    then 1 else 0 end,
    case when p_type = 'audits'        then 1 else 0 end
  )
  on conflict (user_id, month) do update set
    optimisations = public.usage.optimisations + case when p_type = 'optimisations' then 1 else 0 end,
    keywords      = public.usage.keywords      + case when p_type = 'keywords'      then 1 else 0 end,
    competitor    = public.usage.competitor    + case when p_type = 'competitor'    then 1 else 0 end,
    audits        = public.usage.audits        + case when p_type = 'audits'        then 1 else 0 end;
end;
$$;
