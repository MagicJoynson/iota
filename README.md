# Iota

*The smallest thing that runs everything.*

Iota is Alex's personal operating system for university life — one installable web app (PWA) holding the MMU timetable, module notes and deadlines, work shifts and pay, and karting/society life, with **EDEN**, a living particle-orb AI, at the centre of the Ring.

- **Iota** — ninth and smallest letter of the Greek alphabet. Not one iota out of place.
- **EDEN** — the garden and the tree of knowledge. Calm, dry, competent. Concise like Jarvis, never sycophantic.

## Status — Phase 1: the shell ✅

| Piece | State |
|---|---|
| Aurora background (slow drift, reduced-motion aware) | done |
| The Ring — three glass arcs matching `brand-iota-full.png`, breathing, next-up glow + badges | done |
| EDEN orb — canvas 2D particle galaxy; three sizes (Ring 200px · hotbar 46px · chat 104px); idle / aware / listening / thinking / speaking morphs | done |
| Section pages (University · Work · Karting & Societies) with floating glass hotbar + mini orb | done |
| Page transitions (scale+fade from tap point) | done |
| EDEN chat (rules-mode answers, quick chips, "Ask me properly →" prompt copy) | done |
| Quick capture (long-press orb) → local classifier files task/event/shift/note | done |
| Settings (rates, payday, travel buffers, term dates, aurora intensity, reduce motion, API key slot, export/reset) | done |
| PWA — manifest, icons, service worker shell cache | done |
| Data | **local only** (localStorage) — Phase 2 moves it to the `iota` schema in Supabase |

## Run locally

Any static server from the repo root, e.g.

```bash
npx serve .
```

## Deploy

GitHub Pages via `.github/workflows/pages.yml` (same pattern as `mmu-karting`). All URLs are relative, routing is hash-based, so the `/iota/` project-pages path just works.

## Structure

```
index.html            shell + capture sheet
css/app.css           Aurora-glass design system
js/orb.js             EdenOrb — the particle orb (one component, parameterised)
js/store.js           Store (localStorage, Supabase-shaped API) + Rules (Layer-1 brain)
js/app.js             router, Ring, sections/hotbar, EDEN chat, settings, capture
sw.js                 service worker (bump CACHE on deploy)
manifest.webmanifest  PWA manifest
icons/                192 / 512 / maskable / apple-touch, derived from the brand art
assets/brand-512.png  splash + About art
```

## Briefs

Built from `OneDrive/My Stuff/My Uni Life App/IOTA-CONCEPT-BRIEF.md` and `IOTA-Product-and-Build-Brief.docx`. Backend map for the karting side: `OneDrive/My Stuff/MMU-Karting Society App/AUDIT-BRIEF.md`.
