/* ============================================================
   Iota — Tasks engine + EDEN's voice (Layer 1)
   Scoring, "what's next", grouping, the natural-language quick-add
   parser, and the line pools EDEN speaks from when no Claude layer
   has written anything better.
   ============================================================ */
(function () {
  'use strict';
  const H = 3600000, D = 86400000;
  // ------------------------------------------------------------
  // Spaces → Areas → Projects.
  //   Space   — a role you're accountable for (Covey's roles, GTD's areas of focus, a Linear team, a Notion teamspace).
  //             Each has a charter and a standard: what "fine" looks like if nothing is on fire.
  //   Area    — an ongoing responsibility inside a space, with no end date (PARA). Tasks always live in one.
  //   Project — a finite outcome with a deadline (PARA, GTD horizon 1). Stored in iota.projects; tasks join by project_id.
  // `lane` is the calendar colour the space reuses (uni / kart / work / personal), so colour stays a quiet signal.
  // Keys are what tasks store in `area`; names are display only and can be renamed in Settings.
  // Personal links (Drive docs etc.) arrive with the private task import, never in this public file.
  // ------------------------------------------------------------
  const SPACE_DEFS = [
    { key: 'degree', name: 'Degree', lane: 'uni', icon: 'cap', hub: '#/uni', charter: 'Year 2 at the Business School, and deciding what Year 3 is.', standard: 'Nothing handed in during the last 48 hours. Next year decided before Christmas.' },
    { key: 'fallinghippo', name: 'FallingHippo', lane: 'work', icon: 'building', charter: 'The family company and the products it makes.', standard: 'Legal and on time, and something shipped every month.' },
    { key: 'karting', name: 'MMU Karting', lane: 'kart', icon: 'flagk', hub: '#/uni/societies', charter: 'Your seat on the society committee.', standard: 'Events run safely and members get what they paid for.' },
    { key: 'work', name: 'Work', lane: 'work', icon: 'briefcase', hub: '#/work', charter: 'Paid work: shifts at McDonald\'s and websites for clients.', standard: 'Availability current, hours capped, every shift paid correctly.' },
    { key: 'life', name: 'Life admin', lane: 'personal', icon: 'home', hub: '#/personal', charter: 'Money, the house and the accounts that keep everything running.', standard: 'Rent covered before payday. Nothing renews or expires unnoticed.' },
    { key: 'health', name: 'Health', lane: 'personal', icon: 'heart', charter: 'Football, training, and the rest of looking after yourself.', standard: 'Training three times a week, registered with a GP.' },
    { key: 'creative', name: 'Creative', lane: 'personal', icon: 'pen', charter: 'Writing, streaming and the maths channel.', standard: 'Something made every week, even if it\'s small.' },
  ];
  const AREA_DEFS = [
    { key: 'Coursework', space: 'degree', name: 'Modules', icon: 'book', blurb: 'Lectures, seminars and the assessments that carry marks.', hub: '#/uni/modules', links: [['Moodle', 'https://moodle.mmu.ac.uk/'], ['Term dates', 'https://www.mmu.ac.uk/about-us/term-dates']] },
    { key: 'Career', space: 'degree', name: 'Next year', icon: 'plane', blurb: 'Placement or exchange in 2027/28, and the applications for both.', links: [['MyCareerHub', 'https://mycareerhub.mmu.ac.uk/'], ['Study abroad', 'https://www.mmu.ac.uk/study/international/study-abroad'], ['How to apply', 'https://www.mmu.ac.uk/study/international/study-abroad/how-to-apply/guidance']] },
    { key: 'Uni', space: 'degree', name: 'Uni admin', icon: 'folder', blurb: 'Enrolment, timetable and the paperwork of being a student.', links: [['Student Hub', 'https://studenthub.mmu.ac.uk/']] },
    { key: 'Societies', space: 'degree', icon: 'users', blurb: 'Football and the rest of what you join.', hub: '#/uni/societies', links: [['The Union', 'https://www.theunionmmu.org/']] },
    { key: 'Japanese', space: 'degree', icon: 'jp', blurb: 'Kana to N4 before Japan.', module: 'language' },
    { key: 'FallingHippo', space: 'fallinghippo', name: 'Company', label: 'FallingHippo', icon: 'folder', blurb: 'Companies House, tax, data protection, the books and the board.' },
    { key: 'fallinghippo.com', space: 'fallinghippo', name: 'Website', label: 'fallinghippo.com', icon: 'globe', blurb: 'The company site, its domains and inboxes.' },
    { key: 'usBox', space: 'fallinghippo', icon: 'tv', blurb: 'The household TV tracker: beta, build and launch.' },
    { key: 'Skein', space: 'fallinghippo', icon: 'note', blurb: 'The writing app and its UI rework.' },
    { key: 'Karting', space: 'karting', name: 'Committee', label: 'Karting committee', icon: 'users', blurb: 'Your committee jobs, training, prices and the account.', links: [['SU committee hub', 'https://www.theunionmmu.org/clubs-and-societies/committee-hub']] },
    { key: 'Karting events', space: 'karting', name: 'Events', label: 'Karting events', icon: 'flagk', blurb: 'Socials, tasters and race days.' },
    { key: 'Karting app', space: 'karting', name: 'Committee app', label: 'Karting app', icon: 'db', blurb: 'The members\' app and the daily sync that feeds it.' },
    { key: "McDonald's", space: 'work', icon: 'clock', blurb: 'Shifts, availability and pay.', hub: '#/work/shifts' },
    { key: 'Clients', space: 'work', name: 'Freelance', icon: 'users', blurb: 'Websites for other people.' },
    { key: 'Money', space: 'life', icon: 'wallet', blurb: 'Pay, loan, rent and subscriptions.', hub: '#/personal/money' },
    { key: 'Home', space: 'life', icon: 'home', blurb: 'The house: council tax, deposit, insurance and bills.' },
    { key: 'Admin', space: 'life', name: 'Accounts & admin', icon: 'folder', blurb: 'Accounts, apps, inboxes and loose ends.', hub: '#/personal/admin' },
    { key: 'Security', space: 'life', icon: 'key', blurb: 'Tokens, passwords and sign-ins.' },
    { key: 'Life', space: 'life', name: 'Everything else', icon: 'sun', blurb: 'Whatever fits nowhere else.' },
    { key: 'Fitness', space: 'health', icon: 'target', blurb: 'Football, the gym and the eight-week programme.' },
    { key: 'Health', space: 'health', name: 'Medical', icon: 'heart', blurb: 'GP, vaccines and prescriptions.' },
    { key: 'Writing', space: 'creative', icon: 'pen', blurb: 'Godsfall, Silver and A Quiet Place to Fall.' },
    { key: 'Streaming', space: 'creative', icon: 'play', blurb: 'MagicJoynson on Twitch and YouTube.' },
    { key: 'Maths channel', space: 'creative', icon: 'chart', blurb: 'MagicJoynson Maths: Manim and the first pilot.' },
  ];
  // Old keys from before the split, so older imports and caches still land somewhere sensible.
  const AREA_ALIAS = { 'Year abroad': 'Career' };
  const GROUPS = [['uni', 'University'], ['work', 'Work'], ['personal', 'Personal']]; // calendar lanes
  const slug = k => String(k).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const SPACE_BY = Object.fromEntries(SPACE_DEFS.map(s => [s.key, s]));
  const laneOfSpace = k => SPACE_BY[k]?.lane || 'personal';
  const AREAS = Object.fromEntries(AREA_DEFS.map(d => [d.key, laneOfSpace(d.space)])); // area → section (lane) for new tasks
  AREAS['Year abroad'] = 'uni';

  /** Spaces with the user's preferences (name, hidden, order). */
  function spaceDefs() {
    const prefs = Store.settings.spacePrefs || {};
    return SPACE_DEFS.map((s, i) => ({ ...s, name: prefs[s.key]?.name || s.name, hidden: !!prefs[s.key]?.hidden, order: prefs[s.key]?.order ?? i, slug: s.key })).sort((a, b) => a.order - b.order);
  }
  const spaceDef = k => spaceDefs().find(s => s.key === k) || null;
  /** Area definitions with the user's preferences (name, hidden, order, moved space) and the import's private links merged in. */
  function areaDefs() {
    const prefs = (Store.settings.areaPrefs || {}), extra = (Store.seedData && Store.seedData()?.areas) || {};
    const known = AREA_DEFS.map((d, i) => ({ ...d, space: prefs[d.key]?.space || d.space, name: prefs[d.key]?.name || d.name || d.key, hidden: !!prefs[d.key]?.hidden, order: prefs[d.key]?.order ?? i, links: [...(extra[d.key]?.links || []), ...(d.links || [])], slug: slug(d.key) }));
    for (const d of known) d.group = laneOfSpace(d.space);
    // areas that only exist on tasks (typed with #something) still get a page
    const seen = new Set([...known.map(d => d.key), ...Object.keys(AREA_ALIAS)]);
    const laneSpace = { uni: 'degree', kart: 'karting', work: 'work', personal: 'life' };
    for (const t of Store.list('tasks')) if (t.area && !seen.has(t.area)) { seen.add(t.area); const sp = prefs[t.area]?.space || laneSpace[t.section] || 'life'; known.push({ key: t.area, name: prefs[t.area]?.name || t.area, space: sp, group: laneOfSpace(sp), icon: 'dot', blurb: '', links: [], hidden: !!prefs[t.area]?.hidden, order: prefs[t.area]?.order ?? 99, slug: slug(t.area), custom: true }); }
    return known.sort((a, b) => a.order - b.order);
  }
  const areaDef = key => { key = AREA_ALIAS[key] || key; return areaDefs().find(d => d.key === key || d.slug === key) || null; };

  // ---- projects ----
  const projects = () => Store.list('projects').slice().sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || (a.due ? new Date(a.due) : 8e15) - (b.due ? new Date(b.due) : 8e15) || (a.sort || 0) - (b.sort || 0));
  const project = id => Store.get('projects', id);
  const projectTasks = id => Store.list('tasks').filter(t => t.project_id === id && t.status !== 'dropped');
  function progress(p) {
    const ts = projectTasks(p.id), done = ts.filter(t => t.status === 'done').length;
    return { total: ts.length, done, open: ts.length - done, pct: ts.length ? done / ts.length : (p.status === 'done' ? 1 : 0) };
  }
  /** The project's health in one word, the way a PM would say it in a stand-up. */
  function projectState(p, now = new Date()) {
    if (p.status === 'done') return { k: 'done', label: 'Done' };
    const pg = progress(p);
    if (!p.due) return { k: 'open', label: pg.total ? `${pg.done} of ${pg.total}` : 'No tasks yet' };
    const left = (new Date(p.due) - now) / D;
    if (left < 0) return { k: 'late', label: 'Past its date' };
    const late = projectTasks(p.id).some(t => t.status === 'open' && t.due && new Date(t.due) < startOfDay(now));
    if (late) return { k: 'risk', label: 'Behind' };
    if (left < 7 && pg.pct < 0.6) return { k: 'risk', label: 'Tight' };
    return { k: 'ok', label: 'On track' };
  }
  const SECTION_AREA = { uni: 'Uni', work: 'FallingHippo', personal: 'Life', kart: 'Karting' };

  const pr = t => +(t.priority || 4);
  const area = t => AREA_ALIAS[t.area] || t.area || SECTION_AREA[t.section] || 'Life';
  /** An area's name out of context (task rows, Today): generic names like "Events" carry their space. */
  const areaName = t => { const k = area(t); const d = AREA_DEFS.find(x => x.key === k); return (Store.settings.areaPrefs || {})[k]?.name || d?.label || d?.name || k; };
  const spaceOfArea = k => areaDef(k)?.space || 'life';
  const spaceOf = t => spaceOfArea(area(t));
  const sectionOf = t => t.section || AREAS[t.area] || 'personal';
  const mins = t => +(t.duration_min || 0) || null;
  const isOpen = t => t.status === 'open';
  const snoozed = (t, now) => t.snoozed_until && new Date(t.snoozed_until) > now;
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOfDay = d => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

  /** Priority score. Higher = sooner. Deadline pressure, stated priority, lead time for big jobs, a nudge for quick wins. */
  function score(t, now = new Date()) {
    let s = [0, 60, 34, 14, 0][pr(t)] || 0;
    if (t.due) {
      const h = (new Date(t.due) - now) / H;
      let d;
      if (h < 0) d = 110 + Math.min(40, -h / 6);
      else if (h <= 24) d = 88 - h;
      else if (h <= 72) d = 64 - (h - 24) / 4;
      else if (h <= 168) d = 42 - (h - 72) / 8;
      else if (h <= 336) d = 24 - (h - 168) / 24;
      else d = Math.max(2, 17 - h / 120);
      if (t.due_kind === 'hard') d *= 1.2;
      s += d;
      const m = mins(t) || 30, daysLeft = Math.max(.5, h / 24);
      if (m >= 240 && h > 0) s += Math.min(28, (m / 60) / daysLeft * 9);
    }
    const m = mins(t);
    if (m && m <= 15) s += 6;
    return Math.round(s * 10) / 10;
  }

  function open(now = new Date()) { return Store.list('tasks').filter(t => isOpen(t) && !snoozed(t, now)); }
  function ranked(now = new Date()) { return open(now).map(t => ({ t, s: score(t, now) })).sort((a, b) => b.s - a.s).map(x => x.t); }

  /** Now / next / then over timed events. All-day-ish blocks (over 5h) yield to real appointments that start alongside them. */
  const LONG = 5 * H;
  function nextEvent(now = new Date()) {
    const ev = Store.upcoming(now, 60).filter(x => !x.isTask && x.ends_at);
    const dur = x => new Date(x.ends_at) - new Date(x.starts_at);
    const liveAll = ev.filter(x => new Date(x.starts_at) <= now && new Date(x.ends_at) > now).sort((a, b) => dur(a) - dur(b));
    const live = liveAll.find(x => dur(x) <= LONG) || null;
    const future = ev.filter(x => new Date(x.starts_at) > now).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at) || (dur(a) > LONG) - (dur(b) > LONG) || dur(a) - dur(b));
    const nx = future.find(x => dur(x) <= LONG) || future[0] || null;
    const longNext = future.find(x => dur(x) > LONG && x !== nx && new Date(x.starts_at) <= new Date(nx?.starts_at || 0));
    const then = nx ? future.find(x => x !== nx && new Date(x.starts_at) > new Date(nx.starts_at) && dur(x) <= LONG) || null : null;
    const overlap = nx ? ev.filter(x => x !== nx && new Date(x.starts_at) < new Date(nx.ends_at) && new Date(x.ends_at) > new Date(nx.starts_at)) : [];
    return { live, nx, then, overlap, alongside: longNext || liveAll.find(x => dur(x) > LONG) || null };
  }
  const shortName = t => String(t || '').split(' · ')[0];

  /** Minutes free before the next timed commitment (minus travel), or null if nothing timed in the next 12h. */
  function freeWindow(now = new Date()) {
    const nx = nextEvent(now).nx;
    if (!nx) return { mins: null, next: null };
    const m = Math.round((new Date(nx.starts_at) - now) / 60000) - (Rules.leaveBufferFor(nx) || 0);
    return { mins: m > 12 * 60 ? null : Math.max(0, m), next: nx };
  }

  /** The one thing to do next. Prefers the top-ranked task that fits the free window; late at night, prefers small ones. */
  function next(now = new Date()) {
    const list = ranked(now); if (!list.length) return null;
    const fw = freeWindow(now);
    if (fw.mins != null && fw.mins < 120) {
      const fit = list.slice(0, 8).find(t => (mins(t) || 30) <= fw.mins);
      if (fit) return fit;
    }
    return list[0];
  }

  function dueLabel(t, now = new Date()) {
    if (!t.due) return '';
    const d = new Date(t.due), diffD = Math.round((startOfDay(d) - startOfDay(now)) / D);
    const time = d.getHours() || d.getMinutes() ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    if (d < now) {
      const late = Math.round((now - d) / D);
      return late >= 1 ? `${late}d late` : 'Overdue';
    }
    if (diffD === 0) return time ? time : 'Today';
    if (diffD === 1) return 'Tomorrow';
    if (diffD < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: '2-digit' } : {}) });
  }
  function dueClass(t, now = new Date()) {
    if (!t.due) return '';
    const h = (new Date(t.due) - now) / H;
    return h < 0 ? 'late' : h < 36 ? 'soon' : '';
  }
  const fmtMins = m => !m ? '' : m < 60 ? `${m}m` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;

  /** EDEN's one-line reason for why this, now. Built from facts, never filler. */
  function reason(t, now = new Date()) {
    const bits = [];
    if (t.due) {
      const h = (new Date(t.due) - now) / H, d = new Date(t.due);
      const hard = t.due_kind === 'hard';
      if (h < 0) { const days = Math.round(-h / 24); bits.push(days >= 1 ? `It was due ${days === 1 ? 'yesterday' : days + ' days ago'}.` : 'It\'s overdue.'); }
      else if (h < 24 && startOfDay(d).getTime() === startOfDay(now).getTime()) bits.push(`Due today${d.getHours() ? ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}${hard ? ', and it\'s a hard deadline' : ''}.`);
      else if (h < 48) bits.push(`Due tomorrow${hard ? ' — a hard deadline' : ''}.`);
      else if (h < 168) bits.push(`Due ${d.toLocaleDateString('en-GB', { weekday: 'long' })}${hard ? ' (hard deadline)' : ''}.`);
      const m = mins(t) || 0;
      if (m >= 240 && h > 0) bits.push(`About ${fmtMins(m)} of work — it needs starting well before then.`);
    } else if (pr(t) === 1) bits.push('No date, but you flagged it top priority.');
    const fw = freeWindow(now), m = mins(t);
    const spare = fw.mins - (m || 0);
    if (fw.next && fw.mins != null && m && m <= fw.mins && fw.mins < 180) bits.push(`About ${fmtMins(m)}, so it fits before ${shortName(fw.next.title)}${spare >= 5 ? ` with ${spare} minutes to spare` : ', just'}.`);
    else if (m && m <= 15) bits.push(`${m <= 5 ? 'A five-minute' : `A ${m}-minute`} job. Clear it.`);
    return bits.join(' ');
  }

  /** Group for the Tasks list. */
  function bucket(t, now = new Date()) {
    if (snoozed(t, now)) return 'snoozed';
    if (!t.due) return pr(t) <= 2 ? 'anytime' : 'someday';
    const d = new Date(t.due);
    if (d < now && d < startOfDay(now)) return 'overdue';
    if (d <= endOfDay(now)) return 'today';
    const tm = new Date(now); tm.setDate(tm.getDate() + 1);
    if (d <= endOfDay(tm)) return 'tomorrow';
    const wk = new Date(now); wk.setDate(wk.getDate() + 7);
    if (d <= endOfDay(wk)) return 'week';
    const mo = new Date(now); mo.setDate(mo.getDate() + 31);
    if (d <= endOfDay(mo)) return 'month';
    return 'later';
  }
  const BUCKETS = [['overdue', 'Overdue'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days'], ['anytime', 'Anytime, but important'], ['month', 'This month'], ['later', 'Later'], ['someday', 'Someday'], ['snoozed', 'Snoozed']];

  /** Workload for a day: planned task minutes due that day vs. free waking minutes. */
  function dayLoad(day = new Date(), now = new Date()) {
    const s = startOfDay(day), e = endOfDay(day);
    const due = open(now).filter(t => t.due && new Date(t.due) >= s && new Date(t.due) <= e || (t.due && new Date(t.due) < s && startOfDay(now).getTime() === s.getTime()));
    const taskMin = due.reduce((a, t) => a + (mins(t) || 30), 0);
    const endH = +Store.settings.dayEndHour || 23, wakeStart = Math.max(new Date(s).setHours(8, 0, 0, 0), now.getTime()), wakeEnd = new Date(s).setHours(Math.min(endH, 24), 0, 0, 0);
    let busy = 0;
    for (const x of Store.allTimed().filter(x => !x.isTask && x.ends_at)) { const a = Math.max(new Date(x.starts_at), wakeStart), b = Math.min(new Date(x.ends_at), wakeEnd); if (b > a) busy += (b - a) / 60000; }
    const free = Math.max(0, (wakeEnd - wakeStart) / 60000 - busy);
    return { taskMin, free, count: due.length };
  }

  // ------------------------------------------------------------
  // Quick-add parser: "Email Vicky re formations tmrw 3pm p2 #fallinghippo 15m !"
  // ------------------------------------------------------------
  const AREA_KEYS = Object.keys(AREAS).reduce((m, k) => (m[k.toLowerCase().replace(/[^a-z]/g, '')] = k, m), {});
  Object.assign(AREA_KEYS, { fh: 'FallingHippo', uni: 'Uni', work: "McDonald's", mcd: "McDonald's", maccies: "McDonald's", kart: 'Karting', karting: 'Karting', money: 'Money', admin: 'Admin', abroad: 'Career', exchange: 'Career', placement: 'Career', site: 'fallinghippo.com', website: 'fallinghippo.com', gym: 'Fitness', football: 'Fitness', maths: 'Maths channel', events: 'Karting events', app: 'Karting app', freelance: 'Clients', medical: 'Health', gp: 'Health', jp: 'Japanese', essay: 'Coursework', cw: 'Coursework' });
  function parse(text, now = new Date()) {
    let t = ' ' + text + ' ';
    const out = { priority: null, area: null, due: null, due_kind: null, duration_min: null, tokens: [] };
    t = t.replace(/\s(p[1-4])(?=\s)/i, (_, p) => { out.priority = +p[1]; out.tokens.push({ k: 'p' + p[1], label: 'P' + p[1] }); return ' '; });
    t = t.replace(/\s(!{1,3})(?=\s)/, (_, b) => { out.priority = out.priority || Math.max(1, 3 - b.length + 1); out.tokens.push({ k: 'p' + out.priority, label: 'P' + out.priority }); return ' '; });
    t = t.replace(/\s\+([\w-]+)(?=\s)/, (m, w) => { const k = w.toLowerCase(); const pj = projects().find(p => p.status === 'active' && slug(p.name).split('-').some(x => x.startsWith(k))); if (!pj) return m; out.project_id = pj.id; out.tokens.push({ k: 'project', label: pj.name }); if (!out.area && pj.area) out.area = pj.area; return ' '; });
    t = t.replace(/\s#([\w'-]+)(?=\s)/, (_, a) => { const key = a.toLowerCase().replace(/[^a-z]/g, ''); out.area = AREA_KEYS[key] || areaDefs().find(d => d.name.toLowerCase().replace(/[^a-z]/g, '') === key)?.key || (a[0].toUpperCase() + a.slice(1)); out.tokens.push({ k: 'area', label: areaDef(out.area)?.name || out.area }); return ' '; });
    t = t.replace(/\s(\d+(?:\.\d+)?)\s?(h|hr|hrs|hours?)(?:\s?(\d+)\s?m(?:in)?s?)?(?=\s)/i, (_, h, __, m) => { out.duration_min = Math.round(+h * 60 + (+m || 0)); out.tokens.push({ k: 'dur', label: fmtMins(out.duration_min) }); return ' '; });
    if (!out.duration_min) t = t.replace(/\s(\d{1,3})\s?(m|min|mins|minutes)(?=\s)/i, (_, m) => { out.duration_min = +m; out.tokens.push({ k: 'dur', label: fmtMins(+m) }); return ' '; });
    t = t.replace(/\s(hard|deadline)(?=\s)/i, () => { out.due_kind = 'hard'; return ' '; });
    const w = Rules.parseWhen(t, now);
    if (w) {
      const hasTime = /\d\s*(am|pm)|\d:\d\d|\bat\s+\d/i.test(t);
      const d = new Date(w.start); if (!hasTime) { const [hh, mm] = String(Store.settings.defaultDueTime || '18:00').split(':').map(Number); d.setHours(hh || 18, mm || 0, 0, 0); }
      out.due = d.toISOString(); out.due_kind = out.due_kind || 'soft';
      out.tokens.push({ k: 'due', label: (out.due_kind === 'hard' ? 'Deadline ' : 'Due ') + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + (hasTime ? ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '') });
      t = Rules.cleanTitle(t);
    }
    out.title = t.replace(/\s{2,}/g, ' ').replace(/\s+(by|due|on|at)\s*$/i, '').trim();
    out.section = out.area ? (AREAS[out.area] || 'personal') : null;
    return out;
  }

  // ------------------------------------------------------------
  // EDEN's voice — condition pools, no-repeat shuffle, real data in every line.
  // ------------------------------------------------------------
  const RECENT_KEY = 'iota.voice.recent';
  function say(pool, key) {
    let recent = []; try { recent = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]'); } catch (_) {}
    const fresh = pool.map((l, i) => [l, key + i]).filter(([, id]) => !recent.includes(id));
    const [line, id] = (fresh.length ? fresh : pool.map((l, i) => [l, key + i]))[Math.floor(Math.random() * (fresh.length || pool.length))];
    recent = [id, ...recent.filter(x => x !== id)].slice(0, 12); try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (_) {}
    return line;
  }
  const b = s => `<b>${esc(s)}</b>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const timeStr = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  /** The Today brief: 1–3 sentences, HTML (bold only on the things that matter). Facts first, the aside last. */
  function brief(now = new Date()) {
    const h = now.getHours(), eod = endOfDay(now);
    const list = ranked(now), top = next(now);
    const overdue = list.filter(t => t.due && new Date(t.due) < now);
    const dueToday = list.filter(t => t.due && new Date(t.due) >= now && new Date(t.due) <= eod);
    const hardToday = dueToday.filter(t => t.due_kind === 'hard');
    const nx = nextEvent(now).nx;
    const when = t => { const d = new Date(t.due); return d.getHours() >= 21 ? 'tonight' : 'at ' + timeStr(d); };
    const out = [];

    if (h < 5) out.push(say([`It's gone ${['midnight', 'one', 'two', 'three', 'four'][h]}.`, 'Late one.', 'Still up, then.'], 'late'));
    else if (h < 12) out.push(say(['Morning.', 'Morning, Alex.'], 'am'));
    else if (h < 18) out.push(say(['Afternoon.', 'Afternoon, Alex.'], 'pm'));
    else out.push(say(['Evening.', 'Evening, Alex.'], 'eve'));

    if (hardToday.length === 1) out.push(`${b(hardToday[0].title)} is due ${when(hardToday[0])}, and it's a hard deadline.`);
    else if (hardToday.length === 2) out.push(`Two hard deadlines today: ${b(hardToday[0].title)} ${when(hardToday[0])}, and ${b(hardToday[1].title)} ${when(hardToday[1])}.`);
    else if (hardToday.length > 2) out.push(`${hardToday.length} hard deadlines today, starting with ${b(hardToday[0].title)} ${when(hardToday[0])}.`);
    else if (dueToday.length) out.push(`${dueToday.length === 1 ? 'One thing is' : dueToday.length + ' things are'} due today${dueToday.length > 5 ? ', which is ambitious' : ''}.`);

    if (overdue.length === 1) out.push(`${b(overdue[0].title)} slipped past its time${top === overdue[0] ? ', so it\'s first below' : ''}.`);
    else if (overdue.length > 1) out.push(`${overdue.length} things slipped overnight. They're at the top.`);

    if (nx) {
      const m = Math.round((new Date(nx.starts_at) - now) / 60000), buf = Rules.leaveBufferFor(nx) || 0, name = shortName(nx.title);
      const sameDay = new Date(nx.starts_at).toDateString() === now.toDateString();
      if (h < 5) out.push(`${name} is at ${timeStr(nx.starts_at)}${sameDay ? '' : ' tomorrow'}. Sleep would help.`);
      else if (m > 0 && m <= 120 && buf) out.push(m - buf > 0 ? `Leave in ${m - buf} minutes for ${name}.` : `You should already be moving for ${name}.`);
      else if (m > 0 && m <= 180) out.push(`${name} at ${timeStr(nx.starts_at)}.`);
    }
    if (out.length < 3 && top && !overdue.includes(top) && !hardToday.includes(top)) out.push(say([`I'd start with ${b(top.title)}.`, `${b(top.title)} first.`], 'top'));
    if (!list.length) out.push(say(['Nothing on, nothing due. I\'ll assume that\'s deliberate.', 'The list is clear. I shan\'t tell anyone.'], 'empty'));
    if ((h >= 23 || h < 5) && !out.some(l => /Sleep/.test(l))) out.push(say(['The list will keep; so, ideally, will you.', 'Nothing here improves at this hour.'], 'bed'));
    return [out[0], ...out.slice(1).slice(0, 2)].join(' ');
  }

  /** One-liner for a completed task (shown in the toast only occasionally). */
  function doneLine(t, now = new Date()) {
    const age = t.created_at ? (now - new Date(t.created_at)) / D : 0;
    if (t.due && new Date(t.due) < now) return say(['Done. Late, but done.', 'Off the list. Finally.'], 'dlate');
    if (age > 10) return say([`Done. That one had been loitering.`, 'Gone. It had outstayed its welcome.'], 'dold');
    if (pr(t) === 1) return say(['Done. That was the big one.', 'Done. Noted.'], 'dp1');
    return say(['Done.', 'Done. Noted.', 'Off the list.', 'Cleared.'], 'd');
  }

  window.Tasks = { AREAS, AREA_DEFS, SPACE_DEFS, GROUPS, areaDefs, areaDef, areaName, spaceDefs, spaceDef, spaceOf, spaceOfArea, laneOfSpace, projects, project, projectTasks, progress, projectState, slug, BUCKETS, score, ranked, open, next, reason, dueLabel, dueClass, fmtMins, bucket, parse, dayLoad, area, sectionOf, pr, mins, freeWindow, brief, doneLine, say, nextEvent, shortName };
})();
