-- Grant full CRUD to service_role on all public tables
-- (service_role is used by the admin client which bypasses RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shops TO authenticated;
GRANT DELETE ON TABLE public.beta_codes TO service_role;
GRANT UPDATE, DELETE ON TABLE public.waitlist TO service_role;
