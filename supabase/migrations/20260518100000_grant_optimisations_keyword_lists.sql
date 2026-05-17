-- Grant authenticated role access to tables created without explicit grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.optimisations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_lists TO authenticated;
