-- Grant PostgREST access so service_role and authenticated users
-- can read/write app tables via the REST API (supabase-js client).
-- Without these grants, direct table queries via createAdminClient()
-- silently return null even though the data exists.

grant all on public.profiles       to service_role, authenticated;
grant all on public.usage          to service_role, authenticated;
grant all on public.saved_listings to service_role, authenticated;

-- Refresh the existing user's trial so it's actually in the future.
-- (The backfill migration capped it at now() for pre-existing accounts.)
update public.profiles
set trial_ends_at = now() + interval '7 days'
where trial_ends_at < now() + interval '1 day';
