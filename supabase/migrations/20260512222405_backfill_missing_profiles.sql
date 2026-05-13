-- Backfill profile rows for any auth users created before the profiles table
-- and handle_new_user trigger were set up.
insert into public.profiles (id)
select id from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;