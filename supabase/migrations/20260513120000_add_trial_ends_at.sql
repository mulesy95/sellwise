-- Add trial_ends_at to profiles
alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

-- Update new-user trigger to grant a 7-day Growth trial automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, trial_ends_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    now() + interval '7 days'
  );
  return new;
end;
$$;

-- Backfill existing users who have no trial (set trial_ends_at to their created_at + 7 days,
-- capped so it's never in the future for old accounts)
update public.profiles
set trial_ends_at = least(created_at + interval '7 days', now())
where trial_ends_at is null;
