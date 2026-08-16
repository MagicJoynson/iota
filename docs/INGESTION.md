# EDEN Layer 2 — chat ingestion & scheduled runs

Iota's primary data-entry path: Alex tells Claude something in chat → Claude writes rows into the
`iota` schema (Supabase project `cvezetucviaemriljgck`, via the Supabase MCP `execute_sql`) → the app
reflects it on next sync (≤ 5 min, or instantly on open / pull-to-sync in Settings).

**Bases:** `iota.settings` has `activeBase` (`sheffield` until ~25 Sept 2026, then `manchester`) and a `bases` jsonb with each base's home/employer/work/travel values; the flat keys (homeAddress, employer, workAddress, travelMode, travelWorkMin…) always hold the *active* base. Sheffield: 52 Chapman Close, McDonald's Hillsborough, 10 min drive. Manchester: 90 Royce Road, McDonald's Oxford Road, walks 15/30/40.

**Owner uid (Alex):** `236d3551-7600-4ff2-abc5-f46f71100c0d` — every insert must set `owner` explicitly
(MCP runs as `postgres`, so `auth.uid()` is null). Times are UK local; write them with the offset
(`+01` BST / `+00` GMT) so Postgres stores the right instant.

## Shifts
```sql
insert into iota.shifts (owner, starts_at, ends_at, role, location, status, break_min, source) values
 ('236d3551-7600-4ff2-abc5-f46f71100c0d','2026-08-22 12:00+01','2026-08-22 20:00+01','Crew',"McDonald's Oxford Road",'planned',30,'claude');
```
- Alex says "working Sat 12–8" → one row per shift, `status='planned'`, `source='claude'`.
- Cancelled shift → `update iota.shifts set status='cancelled' where …`.
- After the day → nightly run flips past `planned` → `worked` (rules also treat past planned as worked for pay estimates).
- Pay: `iota.pay_rates` holds history; current rate lives in `iota.settings` (`rateHourly`). Payday: settings `payFrequency='fortnightly'`, `payAnchor='2026-08-13'` (Thursdays).

## Events (uni / karting / personal)
```sql
insert into iota.events (owner, kind, title, starts_at, ends_at, location, source, notes) values
 ('236d3551-7600-4ff2-abc5-f46f71100c0d','uni','Lecture — Marketing Principles','2026-09-22 09:00+01','2026-09-22 11:00+01','BS 3.12','claude',null);
```
`kind ∈ uni|work|kart|personal`. Repeating timetable: either one row per occurrence (simplest, what the
app expects today) or a single row with `rrule` (app support pending Phase 3 import).

## Tasks / deadlines
```sql
insert into iota.tasks (owner, title, section, due, status) values
 ('236d3551-7600-4ff2-abc5-f46f71100c0d','Essay draft — intro','uni','2026-10-02 16:00+01','open');
```
Assessments with weightings go in `iota.assessments` (module_id, title, weight_pct, due_at, status, mark).

## Notes, watches, decisions, renewals
- `iota.notes (owner, section, md, title, tags)`
- `iota.watches (owner, text, expected_by)` — promise watcher; resolve with `status='resolved', resolved_note=…`
- `iota.decisions (owner, what, why)` — decision memory
- `iota.renewals (owner, name, expires_on)` — expiry vault
- `iota.societies` — status ∈ member|committee|prospective|lapsed (Football & Badminton are `prospective`; revisit after Freshers' Fair 29–30 Sept 2026). `colour` (hex) tints the society's mini-hub — never an arc hue (violet #8B7CFF / teal #2DD4BF / orange #FF8A4C). Taken: MMU Karting #4DA3FF, Football #4ADE80, Badminton #FACC15; next picks rose #FB7185, sky #38BDF8, lime #A3E635.
- `iota.renewals (owner, name, expires_on, notes)` and open `iota.watches` now surface in Personal › Admin; `iota.notes` with `module_id` show inside that module's hub (University › Modules), `section='personal'` notes under Admin, `section='kart'` notes under the karting hub's My Racing.
- Events of `kind='kart'` belong to the MMU Karting society (inside University in v2) and show in Personal › Week in the society colour.

## Briefings (scheduled runs write these; the app shows the latest for today in EDEN chat)
```sql
insert into iota.briefings (owner, date, kind, md, author) values
 ('236d3551-7600-4ff2-abc5-f46f71100c0d', current_date, 'morning', 'Two lectures, one shift. Leave by 08:45 — it''s a 15-minute walk. Thursday is the tight one.', 'claude');
```
`kind ∈ morning|nightly|weekly|adhoc`. Keep the voice: EDEN, she/her — calm, dry, competent, a close
friend with a sense of humour; concise like Jarvis; never sycophantic; one diagnosis + one next action.

## Reading context before writing
```sql
select * from iota.events  where owner='236d3551-…' and starts_at >= now() - interval '1 day' order by starts_at;
select * from iota.shifts  where owner='236d3551-…' and ends_at   >= now() - interval '1 day' order by starts_at;
select key, value from iota.settings where owner='236d3551-…';
```

## Verification after any write
The app's `Store.sync()` pulls: events/shifts from 45 days back, all tasks (not dropped), notes (200),
societies, open watches, last 14 briefings, modules, assessments. If a row doesn't show, check the
window filters above first, then RLS (`owner` must equal Alex's uid).
