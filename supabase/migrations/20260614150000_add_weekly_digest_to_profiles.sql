alter table public.profiles
  add column if not exists weekly_digest_sent_week date;
