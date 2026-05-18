create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade,
  action text not null,
  platform text,
  resource_id text,
  result text not null,
  detail jsonb
);

alter table audit_logs enable row level security;

create policy "Users read own audit logs" on audit_logs
  for select using (auth.uid() = user_id);

create index audit_logs_user_created_idx on audit_logs (user_id, created_at desc);
