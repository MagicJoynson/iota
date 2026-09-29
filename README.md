# Iota

*The smallest thing that runs everything.*

Iota is Alex's personal operating system for university life: one installable web app (PWA) that holds the MMU timetable, modules and deadlines, shifts and pay, the family company's projects, money and admin, and one ranked task list. **EDEN** sits at the centre.

- **Iota**: the smallest letter of the Greek alphabet. Not one iota out of place.
- **EDEN**: she/her. Calm, dry and competent, a close friend who happens to run your life. Never sycophantic.

## 1.0 — the redesign (29 Sep 2026)

The old "Aurora glass" look is gone: the glowing arcs, the particle orb and the glass cards. In its place is a quiet, exact instrument, built from plain rows, one typeface (Hanken Grotesk, self-hosted), warm-neutral greys and a single ink colour. It has light and dark modes, and on a laptop it adds a sidebar. See `DESIGN.md`.

- **Today**: EDEN's brief, then Now/Next with a 24-hour **day dial** (the old Ring, now drawn as your actual day). Below that are **Do next**, Priorities, Schedule and Coming up.
- **Tasks**: a new first-class system. Each task has priority P1–P4 on the checkbox ring, an area, effort, a hard or soft deadline, the source it came from, and EDEN's note on why it matters.
  - Views: Next (ranked), Today (with a workload meter), Upcoming, By area, Done.
  - Adding: natural-language quick add, e.g. `tomorrow 3pm p2 #fallinghippo 10m`.
  - Completing: undo toasts instead of confirms. On phone, swipe right to complete and left to snooze.
  - Keyboard: `N`, `J`/`K`, `X`, `Enter`, `⌘K`, `G`+letter.
- **Calendar**: agenda or month, with a filter for each section.
- **EDEN**: the same three brains as before. Her rules mode now knows about tasks, and live mode receives the ranked list. She is represented by her **mark**, three section arcs around a core. It is the Ring reduced to a glyph, and it turns while she thinks.
- **Areas**: the University, Work and Personal hubs keep every v0.8 feature, including the module hubs, the Past Modules archive, society hubs, the 日本語 module, earnings and time off. Work gains a **Projects** tab.
- **The 29 Sep sweep**: 88 tasks curated from Gmail, Drive (including the FallingHippo Planner), Calendar, Notion, the bank feed and memory. They are seeded once per device (`js/seed.js`) with stable ids, so re-seeding never duplicates.
- **Offline-first, even with the backend down**: a paused Supabase project no longer signs you out. The login screen has **Continue offline**. Writes queue and sync later.

## Files

```
index.html            shell; self-hosted font preload; script order below
css/app.css           the design system (tokens, rows, check ring, dial, sheets, sidebar/tab bar)
css/jp.css            日本語 module skin on top of app.css
js/supabase.js        tiny client — password grant, refresh (offline-safe), PostgREST on schema iota
js/store.js           cached, optimistic, offline store + outbox + Layer-1 rules; task-meta fallback; seed applier
js/seed.js            the 29 Sep 2026 task sweep + timetable fallback events
js/tasks.js           task engine (score · next · reason · buckets · load), quick-add parser, EDEN's line pools
js/ui.js              icons, EDEN's mark, the day dial, rows, sheets, toasts with undo, markdown
js/eden.js            Layer 3 — live Claude from the phone (persona, context incl. ranked tasks, tools)
js/jp.js              日本語 module (packs, FSRS-4.5-lite, IME)
js/hubs.js            University / Work / Personal hubs, module, past module, society
js/app.js             router, Today, Tasks, Calendar, EDEN, Areas, Settings, quick add, ⌘K, login, boot
js/preview.js         localhost-only fixtures: ?preview [&fresh] [&at=2026-09-30T08:05]
docs/migrations/      SQL to run when the backend is restored (tasks v1 columns)
```

## Deploy

GitHub Pages serves from `main` at the repo root. Bump `CACHE` in `sw.js` on every deploy (currently `iota-shell-v1.0.0`). The phone picks up a new version on its second open.

**Once the MMU Karting Supabase project is restored**, run `docs/migrations/2026-09-29_tasks_v1.sql`. Until then the app strips the new task columns before writing and keeps them locally, so nothing is lost.

## Local preview

`npx serve -l 5178 .` then open `http://localhost:5178/?preview&fresh&at=2026-09-30T08:05#/`. This signs in against in-memory fixtures, clears local state, and pins the clock.
