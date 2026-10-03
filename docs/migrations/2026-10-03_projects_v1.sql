-- Iota 1.1 — projects (finite outcomes with a finish date) and tasks.project_id.
-- Applied to cvezetucviaemriljgck on 3 Oct 2026. Safe to re-run.
create table if not exists iota.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  space text not null,
  area text,
  outcome text,
  due timestamptz,
  status text not null default 'active' check (status in ('active','done','dropped')),
  done_at timestamptz,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table iota.projects enable row level security;
-- owner_select / owner_insert / owner_update / owner_delete: owner = (select auth.uid()), role authenticated
grant select, insert, update, delete on iota.projects to authenticated;
alter table iota.tasks add column if not exists project_id uuid references iota.projects(id) on delete set null;
notify pgrst, 'reload schema';
