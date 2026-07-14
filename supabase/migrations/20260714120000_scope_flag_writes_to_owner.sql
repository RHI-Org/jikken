-- Scope mutable flag rows to the authenticated user who created or claimed
-- them. SELECT remains workspace-readable; writes are no longer granted by
-- always-true policies.

alter table public.jikken_flags
  add column if not exists created_by uuid
    references auth.users(id) on delete restrict
    default auth.uid();

create index if not exists jikken_flags_created_by_idx
  on public.jikken_flags (created_by);

drop policy if exists jikken_flags_insert on public.jikken_flags;
create policy jikken_flags_insert on public.jikken_flags
  for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists jikken_flags_update on public.jikken_flags;
create policy jikken_flags_update on public.jikken_flags
  for update to authenticated
  using (
    created_by = (select auth.uid())
    or created_by is null
  )
  with check (created_by = (select auth.uid()));

comment on column public.jikken_flags.created_by is
  'Authenticated owner. Legacy seed rows are unowned until their first edit claims them.';
