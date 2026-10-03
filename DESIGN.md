---
name: Iota
description: A quiet, exact personal instrument. Rows, not cards. One ink, and EDEN at the centre.
colors:
  bg: "#F7F7F5"
  bg-side: "#F0F0ED"
  surface: "#FFFFFF"
  fill: "rgba(28, 28, 26, .045)"
  fill-2: "rgba(28, 28, 26, .08)"
  ink: "#1C1C1A"
  ink-2: "rgba(28, 28, 26, .64)"
  ink-3: "rgba(28, 28, 26, .46)"
  line: "rgba(28, 28, 26, .09)"
  line-2: "rgba(28, 28, 26, .16)"
  on-ink: "#FAFAF8"
  uni: "#6E56CF"
  work: "#0E9888"
  personal: "#E0620D"
  p1: "#D93D42"
  p2: "#D98200"
  ok: "#218358"
  sel: "rgba(110, 86, 207, .16)"
  bg-dark: "#131312"
  bg-side-dark: "#0E0E0D"
  surface-dark: "#1B1B1A"
  fill-dark: "rgba(237, 237, 234, .055)"
  fill-2-dark: "rgba(237, 237, 234, .10)"
  ink-dark: "#EDEDEA"
  ink-2-dark: "rgba(237, 237, 234, .64)"
  ink-3-dark: "rgba(237, 237, 234, .44)"
  line-dark: "rgba(237, 237, 234, .09)"
  line-2-dark: "rgba(237, 237, 234, .17)"
  on-ink-dark: "#131312"
  uni-dark: "#A594F9"
  work-dark: "#2EC8AE"
  personal-dark: "#FF8A3D"
  p1-dark: "#FF6369"
  p2-dark: "#FFB224"
  ok-dark: "#3DD68C"
  sel-dark: "rgba(165, 148, 249, .20)"
typography:
  display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, -apple-system, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.028em"
  figure:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.016em"
  section:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"cv11\" 1"
  row-title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.35
  meta:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.35
  tab:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 550
    letterSpacing: "0.01em"
rounded:
  r: "6px"
  seg: "8px"
  toast: "10px"
  r-lg: "12px"
  sheet: "14px"
  full: "50%"
spacing:
  gutter: "20px"
  row-y: "11px"
  row-min: "48px"
  section: "32px"
  page: "760px"
  page-wide: "1120px"
  side-w: "236px"
  tabbar-h: "56px"
components:
  button-default:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    height: "34px"
    padding: "0 12px"
  button-default-hover:
    backgroundColor: "{colors.fill-2}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.r}"
    height: "34px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    height: "34px"
    padding: "0 12px"
  button-ghost-hover:
    backgroundColor: "{colors.fill}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.r}"
    height: "28px"
    padding: "0 10px"
  chip-on:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    height: "40px"
    padding: "0 12px"
  row:
    textColor: "{colors.ink}"
    typography: "{typography.row-title}"
    padding: "11px 0"
    height: "48px"
  check:
    rounded: "{rounded.full}"
    size: "20px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.toast}"
    padding: "10px 10px 10px 14px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  tabbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    typography: "{typography.tab}"
    height: "56px"
---

# Design System: Iota

Source of truth is `css/app.css`: the custom properties on `:root` and the dark overrides. When a value here disagrees with that file, the file is right and this document is stale. `css/jp.css` adds the 日本語 module on top of the same tokens. `js/ui.js` holds the icon set, EDEN's mark, the day dial, the task and event rows, sheets and toasts.

## Overview

**Creative North Star: "The Quiet Instrument"**

Iota is a tool Alex opens twenty times a day, so it behaves like a good instrument: plain rows, one typeface, one ink, and hairlines doing the structural work. It follows the canon of Things 3, Linear and Notion Calendar, played straight. There's no themed world. Colour is rationed. The three section hues are marks that say "this belongs to University, Work or Personal". They never decorate. Priority sits on the checkbox ring, not on a badge. Personality lives in two places only: EDEN's words, and her ring-shaped mark.

The layout is dense but calm: 15px body, 48px rows, 20px gutter. On the phone there's a five-slot tab bar with EDEN's mark in the centre. From 900px up there's a dim sidebar, and from 1180px Today and Tasks gain a right-hand rail. Light and dark follow the system, with a manual override on `html[data-theme]`.

Explicitly rejected (PRODUCT.md): the old Aurora glass look, the particle orb and glowing arcs. Anything that reads as AI-generated.

**Key Characteristics:**
- Warm-neutral greys, neither cream nor blue-black. Ink is the only accent.
- Rows with 1px hairlines, not cards. Only settings panels and a few module surfaces get a container.
- Hanken Grotesk is the only Latin face, with tabular figures for every number.
- Section hues only as dots, arcs and thin data bars.
- Motion is short and ease-out. The one set piece is task completion.

## Colors

A warm-neutral greyscale with a single ink. Three section hues and three state hues are held back for marks.

### Primary
- **Ink** (`ink` / `ink-dark`): the accent. Primary buttons, the selected tab, today's date disc, the dial needle and hub, the focus ring (2px outline), toggles when on, the P2 ring. Where another system would reach for brand blue, Iota uses ink.
- **On-ink** (`on-ink`): text and ticks on an ink fill, e.g. primary buttons, toasts and the filled check.

### Secondary: section hues (marks only)
- **University Violet** (`uni`): University. Karting maps here: `--kart: var(--uni)`, and `kindVar('kart')` resolves to `--uni`. It's still labelled "Karting" in text.
- **Work Teal** (`work`): Work. It also fills the current payday bar in the Earnings chart.
- **Personal Orange** (`personal`): Personal, and the fallback for any unknown kind.
- **Selection Violet** (`sel`): the `::selection` wash only.

### Tertiary: state
- **Signal Red** (`p1`): P1 ring and its 9% tinted fill, late due dates and late group headings, the danger button's text, errors, an over-capacity load meter, the P1 token in quick add.
- **Caution Amber** (`p2`): *not* the P2 ring (that's ink). Used for the "Draft" prefix on revisions, the offline/unreachable sync dot, and the "Hard" grade in Japanese reviews.
- **Done Green** (`ok`): the swipe-to-complete underlay, the tick on EDEN's action lines, the online sync dot, correct answers in Japanese.

### Neutral
- **Page** (`bg`): app background, also used for `theme-color` and the manifest.
- **Sidebar** (`bg-side`): the desktop sidebar, one step dimmer than the page.
- **Surface** (`surface`): raised things. Tab bar, sheets, composer, inputs, settings panels, the active segment.
- **Fill / Fill-2** (`fill`, `fill-2`): tonal state. Fill is default button and hover. Fill-2 is pressed, selected, active nav and your own chat bubble.
- **Ink-2** (`ink-2`, 64%): secondary text such as meta, sub-headings and labels.
- **Ink-3** (`ink-3`, 44–46%): tertiary text, inactive tabs, P4 ring, placeholders, dial ticks.
- **Line / Line-2** (`line`, `line-2`): hairlines at 9%, and at 16–17% for stronger borders (chip outline, input stroke, grip, scrollbar).

The JP module adds `--jp-gold`, `--jp-silver` and `--jp-bronze` (mastery dots only, with light and dark values in `css/jp.css`). `--jp` is aliased to ink.

### Named Rules
**The One Ink Rule.** Ink is the accent. A new primary action is ink on on-ink. It's never a section hue and never a new brand colour.

**The Marks-Only Rule.** Section hues appear as marks that encode a section: 7–10px dots, dial arcs, the EDEN mark's arcs, the hollow ring on timed task rows, 4–5px calendar dots, and 4px data bars. The only text use is the start time of a live event row. They never fill a surface, button, chip, heading or background.

**The Priority-on-the-Ring Rule.** Priority is shown only by the checkbox ring (see Components). There are no priority badges, flags or coloured row edges.

## Typography

**Display / Body Font:** Hanken Grotesk, variable 100–900. Fallback: `ui-sans-serif, -apple-system, "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`.
**Japanese:** a system CJK stack (Hiragino Sans → Noto Sans JP → Yu Gothic → Meiryo), only on `.ja`, `.jp-glyph` and similar in `css/jp.css`.

**Provenance:** self-hosted from `@fontsource-variable/hanken-grotesk` 5.3.0 under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`). It ships as two woff2 subsets, latin and latin-ext, with `font-display: swap`. The latin file is preloaded in `index.html` and cached by `sw.js`, so the face works offline. Don't swap in a CDN link.

**Character:** a warm, slightly humanist grotesk that stays exact. Hierarchy comes from weight steps (400 / 500 / 550 / 600 / 650 / 700) and negative tracking at large sizes, not from size jumps.

### Hierarchy
- **Display** (700, 34px, 1.05, -0.028em): the weekday heading on Today. It appears once per screen at most.
- **Figure** (700, 30–32px, -0.03em, tabular): the NOW/NEXT time, big figures, `.grade-big` (40px). Figures are type, not cards.
- **Headline** (650, 26px, 1.15): page `h1`. Login is 28px, EDEN's header 22px.
- **Title** (650, 20–21px, 1.25, -0.016em): task detail title, the "Do next" task.
- **Section** (650, 16px, 1.3): section `h2` beside a 13px ink-2 meta. Group headings are 13.5px 650.
- **Body** (400, 15px, 1.45): default. EDEN's brief is 16px (17px from 900px), chat 15.5px/1.55. Prose is capped at 58–62ch.
- **Row title** (500, 15px, 1.35).
- **Meta** (400, 13px, ink-2): row meta, trails, notes (13.5px).
- **Label** (550–600, 12.5–13px, ink-2): field labels, settings group headings, legend. Sentence case, no tracking.
- **Tab** (550, 10.5px, +0.01em): the tab bar only.

`body` sets `font-feature-settings: "ss01" 0, "cv11" 1`. Every number, `time` and `.tnum`/`.num` element uses `font-variant-numeric: tabular-nums`. Headings use `text-wrap: balance` and paragraphs use `pretty`.

### Named Rules
**The One Face Rule.** Hanken Grotesk is the only Latin face, with no display serif and no mono. `kbd` uses the same face at 11px.

**The Tabular Rule.** Any number that can change (times, counts, money, grades) is tabular, so columns and trails don't jitter.

## Layout

- **Phone (below 900px):** single column. `.page` is max 760px (1120px for `.wide` on Today, Tasks and Calendar), padded `safe-top + 18px` and 20px each side. The fixed tab bar is 56px plus the bottom safe area, with 5 equal columns: Today, Tasks, EDEN (centre, 24px mark, hold to quick-add), Calendar, Areas. Chips and segmented controls scroll sideways and bleed to the screen edge using a negative gutter.
- **Laptop (900px and up):** a `236px` sticky sidebar in `bg-side` with a right hairline, then the main column. The page is left-aligned with 36px top, 56px left and 40px right padding. The tab bar is hidden and chips wrap.
- **Wide (1180px and up):** Today becomes `1fr 320px` with a 48px gap. The sticky rail holds the day dial (up to 200px) and the schedule, and the phone dial and duplicate schedule are hidden. Tasks with a selection becomes `1fr 400px`, with the detail pane sticky behind a left hairline.
- **Rhythm:** rows are 11px vertical padding with a 48px minimum. Sections sit 32px apart and section headers 6px above their rows. The row grid is `auto 1fr auto` (lead, body, trail) with a 12px column gap.
- **Other breakpoints:** 700px (two-up `.twin`, JP grids at 10 columns), 520px (account rows stack), 480px (next-up source button drops to icon only), 380px (dial 112px, NOW time 28px).
- All shell spacing respects `env(safe-area-inset-*)`. The app is installed to the iPhone Home Screen.

## Elevation & Depth

It's flat and tonal. Depth comes from the three greys (`bg-side` < `bg` < `surface`) and from fill washes. Shadows only appear on things that float over content.

### Shadow Vocabulary
- **Pop** (`--shadow-pop`, light: `0 1px 1px rgba(0,0,0,.04), 0 8px 24px -6px rgba(0,0,0,.14), 0 0 0 1px var(--line)`, dark: `0 0 0 1px var(--line-2), 0 12px 32px -8px rgba(0,0,0,.6)`): desktop dialogs and palette, the EDEN composer.
- **Sheet** (`--shadow-sheet`, light: `0 -1px 0 var(--line), 0 -12px 40px -12px rgba(0,0,0,.18)`): phone bottom sheets.
- **Toast** (`0 10px 30px -8px rgba(0,0,0,.35)`): toasts only.
- **Ring-as-border** (`0 0 0 1px var(--line)` or `inset 0 0 0 1px var(--line-2)`): settings panels, chips and inputs draw their stroke with box-shadow, not `border`.
- **Composer focus** (`0 0 0 1.5px var(--ink)` plus the pop drop).
- The scrim is `rgba(10,10,9,.32)`.

### Named Rules
**The Float-Only Shadow Rule.** A shadow means it's floating: sheets, dialogs, palette, composer, toast. Rows, sections and panels at rest are flat.

**The No-Glass Rule.** No `backdrop-filter`, no coloured glows, no decorative gradient fills. The build's only gradients are functional: the strike line is drawn with a `linear-gradient` background, and the EDEN footer fades to `bg` over 14px so the thread scrolls under it. Both are allowed.

## Shapes

- **Gently rounded (6px, `--r`):** buttons, chips, inputs, rows on hover or select, tokens, tags, palette results.
- **8px:** segmented-control track (segments inside are 6px).
- **10px:** toast. **12px (`--r-lg`):** settings panels, desktop dialogs, composer, JP cards.
- **14px:** phone sheet top corners, and your chat bubble (`14 14 4 14`, tail bottom-right).
- **Circles:** the check ring, section dots, the dial, the EDEN mark, date discs, the sync dot.
- **Hairlines** are always 1px. Row dividers start at 30px, aligned to the title, not the check. On timed rows they start at 74px. In flush lists and settings panels they run full width.
- Icons are a single hand-drawn set in `js/ui.js`: 24 grid, stroke 1.6, round caps and joins, `currentColor`, drawn at 20px (16px `.i-sm`, 22px in the tab bar). New icons must follow the same grid and stroke. No icon font and no emoji glyphs.

## Components

### Buttons
- **Shape:** 6px, 34px tall, 12px side padding, 14px 550. `sm` is 28px/13px, `lg` 42px/15px, `icon` is a 34px square.
- **Default:** `fill` wash, ink text. Hover goes to `fill-2`, press scales to .97.
- **Primary:** ink fill with on-ink text. Hover mixes 86% ink with the page. Use one per view at most (e.g. "Done" on Do next).
- **Ghost:** transparent, `fill` on hover. **Danger:** ghost styling with `p1` text.
- **Disabled:** 45% opacity.

### Chips and segmented controls
- **Filter chip:** 28px, 6px radius, inset 1px `line-2` stroke, 13px 500 ink-2. When on, it switches to `fill-2`, ink text and no stroke. A count sits at 60% opacity.
- **Toggle chip** (section filters) carries a dot at 45% opacity, full when selected.
- **Segmented:** `fill` track at 8px radius with 2px padding. The active segment is `surface` with a hairline ring and a `0 1px 2px` lift. It's used for hub sub-tabs and the Tasks views.

### Inputs
- 40px, `surface` background, inset `line-2` stroke. Focus switches to an inset 1.5px ink stroke with no outline. Placeholder is ink-3. Labels are 13px 550 ink-2 above the field.
- Inline property editors in task detail use a borderless `fill` at 30px.
- **Toggle:** 34×20 `fill-2` track. When on it turns ink, and the knob moves 14px and becomes on-ink.

### Rows (the core list primitive)
- **Task row:** `lead | body | trail`. The lead is the check ring. The body has a 15px 500 title over a meta line with the section dot and area, a "Deadline" tag (650 ink) for hard dues, and effort, all separated by 2px ink-3 dots. The trail is a 13px tabular due label. It turns `p1` when late and ink 550 when soon.
- **Hover** (fine pointer only): `fill` background with the same fill bled 8px either side via box-shadow, so text doesn't shift.
- **Selected:** `fill-2`, and its dividers are hidden.
- **Swipe (phone):** swipe right shows an `ok` underlay to complete, swipe left an `ink-2` underlay.

### Time-gutter row
The schedule's signature row: `52px | 14px | 1fr | auto` with an 8px gap.
- The time column is 13.5px 550 tabular, with the end time in 12px ink-3 below it.
- The gutter holds an 8px **section dot** set by `--c: kindVar(kind)`. A due task on the timeline shows a hollow 1.5px ring instead of a filled dot.
- A **live** row colours its start time in the section hue and trails a bold "Now". A **past** row drops to 50% opacity.
- Dividers start at 74px, after the gutter.

### Check ring and priority
A 20px circle. Its ring is an inset box-shadow in `--pc`, and a 12px tick SVG sits inside.
- **P1:** `p1` red ring (1.5px) plus a 9% red tint inside.
- **P2:** a **2px ink ring**. It's the heaviest neutral, not amber.
- **P3:** 1.5px `ink-2`. **P4:** 1.5px `ink-3` (the default).
- **Hover:** the ring thickens to 2px and the tick previews by drawing partway (dashoffset 6) in the ring colour. **Press:** scales to .88.
- **Done:** the ring fills with `--pc` (P3 and P4 fill with ink-2) and the tick draws in on-ink.

### Completion sequence
In `completeTask` (`js/app.js`) and `.check`/`.strike`/`.row-wrap` (`css/app.css`):
1. Haptic (8ms vibrate). Hover is suppressed until the pointer moves, so the row under the cursor doesn't flash.
2. The ring fills (200ms). The **tick draws in 160ms** after a 60ms delay.
3. The **strike** grows across the title in **220ms** after an 80ms delay. The title goes ink-3 and the meta 60%.
4. At **~620ms** the row wrap collapses: `grid-template-rows 1fr → 0fr` over 260ms `--ease-io` while fading over 200ms.
5. At 900ms the change commits and an **undo toast** shows a dry done line (e.g. "Done.", "Off the list.", "Done. Late, but done.") with "Undo ⌘Z". It stays **5s** (plain toasts stay 2.4s). ⌘Z / Ctrl+Z undoes too.

Re-renders are held while this plays (the `animating` counter), so the list never jumps mid-animation.

### Day dial
"The Ring, made functional" (`UI.dial`). A 200-unit SVG drawn at 132px on the phone (112px under 380px) and up to 200px in the rail.
- It's a 24h face with midnight at the top. The track is a `line` circle (r 84, stroke 11, 55% opacity). The elapsed part of the day is overdrawn in `fill-2`.
- There are 24 ticks. Every 6th is major (ink-2, 1.4) and the rest are minor (ink-3, 1). Optional labels read 0 / 6 / 12 / 18 in 9px 600 ink-3.
- Each timed commitment is an 11-wide **section-coloured arc** with butt caps, inset .6° at each end so neighbours don't touch. Due tasks are 2.6r ink dots at r 72.
- The ink **needle** at now (1.6, round cap) ends on a 3.2r ink hub. It can instead show a centre label on a `bg` disc.
- It carries an `aria-label` summarising its commitments, and each arc has a `<title>`.

### EDEN's mark
A glyph reduced from the original Iota Ring (`MARK_ARCS` in `js/ui.js`): three arcs at r 9.2 on a 24 grid, stroke 2.2, butt caps, around an ink core of r 3.3.
- **Geometry (the original Ring's):** University 248°→350° (top-left), Work 10°→112° (top-right), Personal 128°→232° (bottom), with 0° at 12 o'clock. The same paths are inlined in the splash in `index.html` and in `icons/mark.svg`.
- **States:** `thinking` spins the arcs (1.1s linear) and shrinks the core to .75. `speaking` beats the core (900ms, to 1.28). `listening` thickens the arcs to 2.8. `data-aware="<section>"` thickens that section's arc to 3.4 (e.g. during a lecture). `mono` draws everything in `currentColor`.
- **Sizes:** 16px in the sidebar and next-up, 18px on notes and chat, 20px as the sidebar brand, 22px on the brief, 24px in the tab bar, 34–40px on the EDEN header, login and splash.
- It's EDEN's face and Iota's app mark. It's never an orb and never glows.

**Raster provenance.** `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`, `icons/apple-touch-icon.png` (180px) and `assets/brand-512.png` were rendered with headless Chromium from `icons/mark.svg` on 29 Sep 2026, on the light `bg`. They replace the old Aurora brand art, which is no longer referenced by the app, manifest or service worker. If the mark changes, edit `mark.svg` and re-render all five. Don't hand-edit the PNGs. `mark.svg` hard-codes the light values, so the favicon core stays `#1C1C1A` in dark mode.

### EDEN surfaces and voice
- **Brief** (Today): the mark, then 16–17px prose capped at 58ch, then a 12.5px ink-3 source line ("Morning briefing, 06:45").
- **Chat:** EDEN's messages have no bubble, just the 18px mark in the gutter. Yours sit in a right-aligned `fill-2` bubble. Action lines are 13px ink-2 with an `ok` tick. The composer is a `surface` with the pop shadow and a 12px radius.
- **Microcopy voice (all EDEN and system lines):** British English (en-GB dates, 24h times, £). Dry and calm. **Facts first**: the time, the task, the number, then at most one short clause of character ("Done. That one had been loitering."). **No exclamation marks and no emoji** (EDEN may mirror an emoji only if Alex uses one first). Most lines are one to three sentences, with bold kept for the one time or number that matters. Never sycophantic, never "as an AI". Say "student loan", never "SFE". Empty states say what's true ("Nothing timed today.", "Nothing else on the list.").

### Navigation
- **Tab bar:** `surface` with a top hairline. Inactive tabs are ink-3 and the current one ink (`aria-current="page"`). Icons are 22px over a 10.5px label.
- **Sidebar:** 30px items, 13.5px 500 ink-2, 16px icons at 80%. Hover is `fill` and current is `fill-2` with ink text. Counts are right-aligned 12px ink-3 tabular. Group labels are 12px 550 ink-3. Quick actions are `surface` buttons with a hairline ring and a `kbd` hint.
- **Sidebar area groups:** University, Work and Personal are collapsible groups (a 14px chevron that rotates, state remembered per device). Their areas sit beneath as 28px, 13px items indented to 30px along a 1px `line` rail. The current area shows a 2px ink tick on the rail rather than a new colour. A collapsed group shows its total count.
- **Crumb/back:** 13.5px 500 ink-2 with a 15px chevron.

### Spaces, areas and projects
- **Model:** three levels, borrowed from PARA, GTD's horizons of focus, Things 3 and Linear.
  - **Space:** a role Alex answers for. It has a one-line charter and a *standard*, the PARA "standard to be maintained".
  - **Area:** an ongoing responsibility with no end date. Every task lives in exactly one.
  - **Project:** a finite outcome with a finish date and a "done when" line, stored in `iota.projects`. Tasks join a project with `project_id`, and can join one from any area.
- **Spaces:** there are seven (Degree, FallingHippo, MMU Karting, Work, Life admin, Health, Creative), inside the 5–7 range Sunsama recommends for top-level channels.
  - They're defined in `Tasks.SPACE_DEFS`. Areas are defined in `Tasks.AREA_DEFS` and carry `space`.
  - The user can rename, hide and reorder both (`spacePrefs`, `areaPrefs`) and move areas between spaces.
- **Colour:** spaces don't get colours of their own. Each reuses one of the four calendar lanes (`lane`: uni / kart / work / personal), so hue stays a quiet calendar signal. Spaces are told apart by a 16px line icon.
- **Sidebar:** spaces are collapsible groups with their icon. The first three are open by default, the rest collapsed with a total count, following Notion's "most used on top" guidance. Areas nest beneath. A **Projects** item sits in the main navigation with the active count.
- **Space page (`#/space/<key>`):**
  - The h1 sits beside a 34px `fill` icon tile, with the charter as the sub line.
  - **The standard** is a 12px 600 ink-3 label followed by body text.
  - EDEN's line covers what's open, what's slipping and where to start.
  - **Projects** come before **Areas** ("Ongoing, no finish line").
  - At ≥1180px a side column holds Coming up (the space's lane) and Go to (the old hub tabs).
- **Project row:** an 18px pie in ink (the Things completion pie), the name, then "due · N days · done/total" as meta. The trailing state word:
  - On track (`ok`)
  - Tight or Behind (`p2`), when a task is overdue or under 60% done with a week left
  - Past its date (`p1`)
- **Project page (`#/project/<id>`):**
  - Crumbs read space / area.
  - The pie sits in the title tile, and the state and date form the sub line.
  - **Done when** uses the same label treatment as The standard.
  - A 4px ink progress bar on `fill-2` sits above EDEN's line ("N of M done, D days to go. Next: …").
  - Tasks are grouped To do / Snoozed / Done. **Mark project done** comes last.
- **Quick add:** `+word` attaches the first active project whose name has a word starting with it, and the token reads the project name. `#area` works as before, and adding to an area from a project's page fills in that area.
- **Phone:** the fifth tab is **Spaces**. Its index is a Projects link, then each space's header row (icon tile, charter, count) over its area rows. Heads with two actions stack under 560px.

### Settings
- **Structure:** a declarative schema (`js/settings.js`) of panes → sections → rows. Every row has a label, an optional description and search synonyms.
- **Desktop:** a split view. The left column is 212px and sticky, holding search and the pane list in four groups separated by hairlines. The pane is at most 640px wide.
- **Phone:** a drill-down. The index is iOS-style inset lists with 28px `fill-2` icon tiles and the current value on the right. A pane opens at `#/settings/<pane>` with a "‹ Settings" crumb.
- **Rows:** label (14.5px 550) and description (13px ink-2) on the left, control on the right. Rows with wide controls stack under 560px. Panels are `surface` with a hairline and 12px radius.
- **Saving:** there are no Save buttons and no toasts. A change saves at once, and a green "Saved" (12px 550, `ok`) fades in beside the row label for 1.6s.
- **Destructive actions:** they live in a Danger zone panel with a p1-tinted ring. They confirm inline (question, then Cancel and a filled red button), never in a dialog. Clearing is blocked while changes are unsynced.
- **Search:** matches label, description and synonyms across all panes. Choosing a result opens the pane, scrolls to the row and flashes it in `sel`.
- **Theme tiles:** three miniature app frames (System, Light, Dark). The selected one gets a 2px ink ring.

### Sheets, dialogs, palette, toasts
- **Sheet (phone):** a `surface` panel with 14px top corners, the sheet shadow, and a 36×4 `line-2` grip. It's max 88dvh and slides up over 260ms `cubic-bezier(.32,.72,0,1)`. The scrim fades in.
- **Dialog (900px and up):** the same markup becomes a 560px (detail 520px) panel at 12vh from the top, 12px radius, pop shadow, opening with a 180ms scale from .98. Esc closes it and focus returns.
- **Palette:** a 50px input over results. The active result is `fill-2`.
- **Quick add:** a 17px 500 textarea beside a check ring. Parsed tokens are 26px `fill` pills (P1 in red).
- **Toast:** an ink pill with on-ink text, 10px radius, above the tab bar (centred on the main column on desktop). It rises 16px over 200ms. Its buttons are on-ink 650 with a 14% on-ink hover.

### Motion
- **Tokens:** `--t-fast` 140ms for hover and colour, `--t` 200ms for state, page enter and toasts. `--ease` `cubic-bezier(.23,1,.32,1)` (ease-out) is the default. `--ease-io` `cubic-bezier(.77,0,.175,1)` is only for the row collapse.
- **Page enter:** 6px rise and fade, 200ms. The splash fades over 240ms.
- **Reduced motion (system `prefers-reduced-motion: reduce`):** all animations run 1ms once. EDEN's thinking spin stops and the mark dims to 60%. Row collapse, swipe and sheet become a 120ms linear opacity change. `completeTask` skips the choreography and commits straight to the undo toast.
- **Reduced motion (in-app setting):** `body.reduce-motion` forces every animation and transition to 1ms and stops the JP shake.

## Do's and Don'ts

### Do:
- **Do** build every list from rows: check or dot lead, 15px title, 13px ink-2 meta, tabular trail, 1px `line` dividers inset to the title.
- **Do** mark a section with `--c: kindVar(kind)` on a 7–10px dot, arc or 4px bar, and route Karting through `--uni`.
- **Do** show priority on the check ring only: P1 red with tint, P2 2px ink, P3 ink-2, P4 ink-3.
- **Do** use ink for the one primary action on a view, and `fill` washes for everything else.
- **Do** keep numbers tabular and times in 24h en-GB.
- **Do** use 140ms / 200ms `--ease` for new transitions, and give any new animation a reduced-motion path.
- **Do** write EDEN's lines facts first, British and dry, one to three sentences.
- **Do** re-render all five PNGs from `icons/mark.svg` whenever the mark changes, and note the date.

### Don't:
- **Don't** put a section hue on a surface, button, chip, heading or background. It's a mark, not a theme.
- **Don't** add priority badges, flags or coloured row edges, or use amber `p2` for the P2 ring.
- **Don't** wrap lists or stats in cards. Figures are inline type between hairlines (`.stats`, `.figure`).
- **Don't** use glass, `backdrop-filter`, glows, particle or orb imagery, or decorative gradients. That's the rejected Aurora look.
- **Don't** add a second Latin typeface, a CDN font, an icon font or emoji glyphs as icons.
- **Don't** add uppercase tracked labels above headings. Labels are sentence case, 12.5–13px, ink-2.
- **Don't** use exclamation marks or emoji in UI or EDEN copy.
- **Don't** give resting rows or panels a drop shadow. Shadows mean it's floating.
