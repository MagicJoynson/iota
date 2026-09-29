-- Iota 1.0 — tasks get the fields the new Tasks engine uses.
-- Safe to run more than once. Run with the Supabase MCP (execute_sql as postgres) once project cvezetucviaemriljgck is restored.
alter table iota.tasks
  add column if not exists priority      smallint check (priority between 1 and 4),
  add column if not exists area          text,
  add column if not exists notes         text,
  add column if not exists link          text,
  add column if not exists source        text,
  add column if not exists due_kind      text check (due_kind in ('hard', 'soft')),
  add column if not exists snoozed_until timestamptz,
  add column if not exists duration_min  integer,
  add column if not exists done_at       timestamptz;
create index if not exists tasks_owner_status_due on iota.tasks (owner, status, due);
notify pgrst, 'reload schema';

-- After this runs, clear the client-side fallback flag on each device (it re-detects automatically on the next
-- successful write): localStorage.removeItem('iota.taskMetaUnsupported'). Until the migration exists, the app strips
-- these columns before writing and keeps them in a local side-table (iota.taskMeta.v1), so nothing is lost either way.
