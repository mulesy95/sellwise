-- ============================================================
-- Sellwise — initial schema
-- ============================================================

-- Profiles: extends auth.users with app-specific data
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  full_name              text,
  plan                   text not null default 'free' check (plan in ('free', 'starter', 'growth', 'studio')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Usage tracking: counts per user per calendar month
create table public.usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  month          date not null,  -- first day of the month, e.g. 2026-05-01
  optimisations  int not null default 0,
  keywords       int not null default 0,
  competitor     int not null default 0,
  audits         int not null default 0,
  unique (user_id, month)
);

-- Saved listings: history of AI-generated listings
create table public.saved_listings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  product_name text not null,
  title        text not null,
  tags         text[] not null default '{}',
  description  text not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Row-level security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.usage          enable row level security;
alter table public.saved_listings enable row level security;

create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

create policy "usage: own rows" on public.usage
  for all using (auth.uid() = user_id);

create policy "saved_listings: own rows" on public.saved_listings
  for all using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile row when a user signs up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Keep updated_at current on profiles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
