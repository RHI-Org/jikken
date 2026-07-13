-- Jikken data layer — flags + simulation audit log.
--
-- Two tables behind the shared org Supabase project (bsfngnjvmostukrfhoxx),
-- prefixed jikken_ so they never collide with the other SSO apps. The whole
-- product sits behind the .experienceplus.ai SSO cookie, so RLS is scoped to
-- authenticated users; the jikken-simulate Edge Function writes with the
-- service role (bypasses RLS). jikken_simulations is added to the Realtime
-- publication so the Dashboard's History page streams inserts live — the
-- CLI→Dashboard hand-off centerpiece.

-- ── jikken_flags ─────────────────────────────────────────────────────────
create table if not exists public.jikken_flags (
  id                 text primary key,
  name               text not null,
  description        text,
  enabled            boolean not null default true,
  rollout_percentage integer not null default 100
                       check (rollout_percentage between 0 and 100),
  audience_rules     jsonb not null default '[]'::jsonb,
  environment        text not null default 'staging'
                       check (environment in ('development', 'staging', 'production')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── jikken_simulations (the audit log = the History page) ──────────────────
create table if not exists public.jikken_simulations (
  id               uuid primary key default gen_random_uuid(),
  simulation_id    text not null,
  flag_id          text not null,
  scenario         text,
  surface          text not null default 'dashboard'
                     check (surface in ('cli', 'dashboard', 'sdk', 'presentation', 'ci')),
  result           text not null check (result in ('all_clear', 'conflict', 'warning')),
  exit_code        integer not null,
  summary          jsonb not null,
  decisions        jsonb not null default '[]'::jsonb,
  evaluated_at     timestamptz not null,
  total_latency_ms integer not null default 0,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists jikken_simulations_created_at_idx
  on public.jikken_simulations (created_at desc);
create index if not exists jikken_simulations_flag_id_idx
  on public.jikken_simulations (flag_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.jikken_flags enable row level security;
alter table public.jikken_simulations enable row level security;

-- Flags: authenticated users read and manage (single shared demo workspace).
drop policy if exists jikken_flags_select on public.jikken_flags;
create policy jikken_flags_select on public.jikken_flags
  for select to authenticated using (true);

drop policy if exists jikken_flags_write on public.jikken_flags;
create policy jikken_flags_write on public.jikken_flags
  for all to authenticated using (true) with check (true);

-- Simulations: authenticated users read the audit trail and append runs.
-- (The Edge Function inserts with the service role, so it is not gated here.)
drop policy if exists jikken_simulations_select on public.jikken_simulations;
create policy jikken_simulations_select on public.jikken_simulations
  for select to authenticated using (true);

drop policy if exists jikken_simulations_insert on public.jikken_simulations;
create policy jikken_simulations_insert on public.jikken_simulations
  for insert to authenticated with check (true);

-- ── Realtime ───────────────────────────────────────────────────────────────
-- Stream inserts to the Dashboard's History page (the hand-off pulse).
-- Idempotent: `alter publication … add table` errors if already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'jikken_simulations'
  ) then
    alter publication supabase_realtime add table public.jikken_simulations;
  end if;
end $$;

-- ── Seed flags (idempotent) ────────────────────────────────────────────────
insert into public.jikken_flags (id, name, description, enabled, rollout_percentage, audience_rules, environment)
values
  ('dark-mode', 'Dark Mode Toggle', 'Enables dark mode UI for eligible users', true, 100,
   '[{"type":"segment","operator":"equals","value":"early_adopter"}]'::jsonb, 'staging'),
  ('new-checkout', 'New Checkout Flow', 'Redesigned checkout with fewer steps', true, 10,
   '[]'::jsonb, 'production'),
  ('beta-dashboard', 'Beta Dashboard', 'Early-access analytics dashboard', false, 0,
   '[]'::jsonb, 'development')
on conflict (id) do nothing;
