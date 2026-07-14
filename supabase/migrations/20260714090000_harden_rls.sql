-- Harden jikken RLS — shared demo credentials mean authenticated ≠ trusted.
--
-- The reviewer demo account is handed to external people, so the write
-- surface for the `authenticated` role must be the minimum the product
-- actually uses:
--   1. No client-side DELETE anywhere (the old `for all using(true)`
--      policies granted it; no UI calls deleteFlag).
--   2. jikken_catalog is read-only for clients — seeding runs with the
--      service role, and no client code writes it.
--   3. jikken_simulations inserts must be attributed to the caller
--      (created_by = auth.uid()), so audit rows can't be forged onto
--      someone else. The Edge Function writes with the service role and
--      is not gated here.

-- ── jikken_flags: blanket write → insert + update only ─────────────────────
drop policy if exists jikken_flags_write on public.jikken_flags;
-- Live DB drift: a per-command delete policy existed outside the repo's
-- migration history. Drop it too — nothing in the product deletes flags
-- client-side.
drop policy if exists jikken_flags_delete on public.jikken_flags;

drop policy if exists jikken_flags_insert on public.jikken_flags;
create policy jikken_flags_insert on public.jikken_flags
  for insert to authenticated with check (true);

drop policy if exists jikken_flags_update on public.jikken_flags;
create policy jikken_flags_update on public.jikken_flags
  for update to authenticated using (true) with check (true);

-- ── jikken_catalog: client writes removed entirely ─────────────────────────
drop policy if exists jikken_catalog_write on public.jikken_catalog;

-- ── jikken_simulations: inserts must be self-attributed ────────────────────
drop policy if exists jikken_simulations_insert on public.jikken_simulations;
create policy jikken_simulations_insert on public.jikken_simulations
  for insert to authenticated with check (created_by = auth.uid());
