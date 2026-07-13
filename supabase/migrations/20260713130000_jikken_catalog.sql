-- Jikken feature catalog — the Feature × Situation menu content, as data.
--
-- Phase 2 of the catalog work: lets the presentation's Feature and Situation
-- menus scale to a large number of entries that Ryan can add/edit without a
-- redeploy. The EVALUATION engine stays local and deterministic — this table
-- only stores the catalog CONTENT (flag configs, populations, stories). The
-- bundled `FEATURES` in @jikken/shared remains the offline / test fallback, so
-- the app works identically whether or not this table is populated.
--
-- One row per feature; the three situations (all-clear / conflict / warning)
-- live in a jsonb blob matching @jikken/shared FeatureDef.situations. Same
-- shared org Supabase project (bsfngnjvmostukrfhoxx), jikken_ prefixed, behind
-- the .experienceplus.ai SSO cookie, so RLS is scoped to authenticated users.

create table if not exists public.jikken_catalog (
  id          text primary key,                    -- feature id (e.g. 'dark-mode')
  label       text not null,                       -- Feature-menu display name
  description text not null,                        -- one-line summary of what the flag gates
  sort_order  integer not null default 0,           -- menu order
  situations  jsonb not null,                       -- Record<SituationId, Scenario>
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists jikken_catalog_sort_idx
  on public.jikken_catalog (sort_order);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.jikken_catalog enable row level security;

-- Read for authenticated users (the whole product is behind the SSO cookie);
-- writes for authenticated users too (single shared demo workspace, matching
-- jikken_flags). Seeding runs with the service role, which bypasses RLS.
drop policy if exists jikken_catalog_select on public.jikken_catalog;
create policy jikken_catalog_select on public.jikken_catalog
  for select to authenticated using (true);

drop policy if exists jikken_catalog_write on public.jikken_catalog;
create policy jikken_catalog_write on public.jikken_catalog
  for all to authenticated using (true) with check (true);
