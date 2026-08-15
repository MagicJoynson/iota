/* ============================================================
   Iota store — Phase 1: localStorage-backed, Supabase-shaped.
   Phase 2 swaps `Store` internals for the iota schema (same API).
   Also hosts the Layer-1 rules that need no network at all.
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'iota.v1';
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  const DEFAULTS = {
    settings: {
      name: 'Alex',
      rateHourly: '',
      payday: '',                 // day of month or ''
      travelCampusMin: 25,
      travelWorkMin: 20,
      travelTrackMin: 45,
      loadingMin: 20,
      termStart: '',
      termWeeks: 12,
      apiKey: '',
      auroraIntensity: 1,
      reduceMotion: false,
    },
    events: [],   // {id, kind:'uni'|'work'|'kart'|'personal', title, starts_at, ends_at, location, source}
    tasks: [],    // {id, title, section, due, status:'open'|'done', created_at}
    notes: [],    // {id, section, text, created_at}
    shifts: [],   // {id, starts_at, ends_at, role, location, status}
    captures: [], // raw quick captures for audit
  };

  let db = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw) return structuredClone(DEFAULTS);
      return { ...structuredClone(DEFAULTS), ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings || {}) } };
    } catch (_) { return structuredClone(DEFAULTS); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(db)); Store.emit('change'); }

  const listeners = new Set();

  const Store = {
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit(type) { for (const fn of listeners) { try { fn(type); } catch (e) { console.error(e); } } },

    get settings() { return db.settings; },
    setSetting(k, v) { db.settings[k] = v; save(); },

    // ---- generic table ops (mirrors what a PostgREST client will do) ----
    list(table) { return (db[table] || []).slice(); },
    insert(table, row) { const r = { id: uid(), created_at: new Date().toISOString(), ...row }; db[table].push(r); save(); return r; },
    update(table, id, patch) { const i = db[table].findIndex(r => r.id === id); if (i >= 0) { db[table][i] = { ...db[table][i], ...patch }; save(); return db[table][i]; } return null; },
    remove(table, id) { db[table] = db[table].filter(r => r.id !== id); save(); },
    exportJSON() { return JSON.stringify(db, null, 2); },
    reset() { db = structuredClone(DEFAULTS); save(); },

    // ---- unified calendar: every timed thing across the three worlds ----
    allTimed() {
      const ev = db.events.map(e => ({ ...e, _table: 'events' }));
      const sh = db.shifts.map(s => ({ ...s, _table: 'shifts', kind: 'work', title: s.title || (s.role ? `Shift · ${s.role}` : 'Shift') }));
      const tk = db.tasks.filter(t => t.due && t.status !== 'done').map(t => ({ ...t, _table: 'tasks', kind: t.section || 'personal', starts_at: t.due, ends_at: t.due, isTask: true }));
      return [...ev, ...sh, ...tk].filter(x => x.starts_at).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    },
    upcoming(fromDate = new Date(), limit = 20) {
      const from = fromDate.getTime();
      return this.allTimed().filter(x => new Date(x.ends_at || x.starts_at).getTime() >= from).slice(0, limit);
    },
    nextFor(kind) { return this.upcoming().find(x => x.kind === kind) || null; },
    today() {
      const s = new Date(); s.setHours(0, 0, 0, 0); const e = new Date(s); e.setDate(e.getDate() + 1);
      return this.allTimed().filter(x => { const t = new Date(x.starts_at); return t >= s && t < e; });
    },
  };

  // ============================================================
  // Layer 1 rules (offline, deterministic) — the always-on brain
  // ============================================================
  const Rules = {
    /** 0..1 urgency: 1 when something starts within 2h (drives orb 'aware'). */
    urgency(now = new Date()) {
      const nx = Store.upcoming(now, 1)[0];
      if (!nx) return 0;
      const mins = (new Date(nx.starts_at) - now) / 60000;
      if (mins <= 0) return 0.6;
      if (mins > 120) return 0;
      return 1 - mins / 120;
    },
    greeting(now = new Date()) {
      const h = now.getHours(), n = Store.settings.name || 'Alex';
      const part = h < 5 ? 'Late one' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 22 ? 'Evening' : 'Late one';
      return `${part}, ${n}`;
    },
    fmtWhen(iso, now = new Date()) {
      const d = new Date(iso); if (isNaN(d)) return '';
      const sameDay = d.toDateString() === now.toDateString();
      const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      if (sameDay) return time;
      if (d.toDateString() === tmr.toDateString()) return `Tmrw ${time}`;
      const days = (d - now) / 86400000;
      if (days < 6) return d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + time;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + time;
    },
    /** One-liner for the home screen. Canned personality: calm, dry, competent. */
    observation(now = new Date()) {
      const up = Store.upcoming(now, 50);
      const today = Store.today();
      const openTasks = Store.tasks_open();
      const clash = Rules.firstClash(up);
      if (clash) return `${clash.a.title} overlaps ${clash.b.title}. One of them has to move.`;
      const soon = up[0];
      if (soon) {
        const mins = Math.round((new Date(soon.starts_at) - now) / 60000);
        if (mins > 0 && mins <= 120) {
          const buf = Rules.leaveBufferFor(soon);
          const leaveIn = mins - buf;
          if (buf && leaveIn > 0) return `Leave in ${leaveIn} min for ${soon.title}.`;
          if (buf && leaveIn <= 0) return `You should already be moving for ${soon.title}.`;
          return `${soon.title} in ${mins} min.`;
        }
      }
      if (today.length === 0 && openTasks.length === 0) return 'Nothing on. Rare. Enjoy it.';
      if (today.length === 0) return `${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}, nothing timed today.`;
      const uni = today.filter(x => x.kind === 'uni').length, work = today.filter(x => x.kind === 'work').length, kart = today.filter(x => x.kind === 'kart').length;
      const bits = [];
      if (uni) bits.push(`${uni} lecture${uni > 1 ? 's' : ''}`);
      if (work) bits.push(`${work} shift${work > 1 ? 's' : ''}`);
      if (kart) bits.push(`${kart} karting`);
      const s = bits.join(', ');
      return s ? `${s[0].toUpperCase() + s.slice(1)}. Survivable.` : 'A quiet one.';
    },
    leaveBufferFor(item) {
      const s = Store.settings;
      if (item.kind === 'uni') return +s.travelCampusMin || 0;
      if (item.kind === 'work') return +s.travelWorkMin || 0;
      if (item.kind === 'kart') return (+s.travelTrackMin || 0) + (+s.loadingMin || 0);
      return 0;
    },
    firstClash(list) {
      const timed = list.filter(x => !x.isTask && x.ends_at);
      for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length; j++) {
        const a = timed[i], b = timed[j];
        if (new Date(b.starts_at) < new Date(a.ends_at) && new Date(a.starts_at) < new Date(b.ends_at)) return { a, b };
      }
      return null;
    },
    /** Rules-mode chat answers. Returns a string or null (→ "ask me properly"). */
    answer(q, now = new Date()) {
      const t = q.trim().toLowerCase();
      if (!t) return null;
      if (/^(hi|hello|hey|yo)\b/.test(t)) return `Hello. ${Rules.observation(now)}`;
      if (/today|what('s| is) on/.test(t)) {
        const td = Store.today();
        if (!td.length) return 'Nothing timed today. ' + (Store.tasks_open().length ? `${Store.tasks_open().length} open tasks if you want them.` : 'Genuinely free.');
        return 'Today: ' + td.map(x => `${Rules.fmtWhen(x.starts_at, now)} ${x.title}`).join(' · ') + '.';
      }
      if (/this week|week/.test(t)) {
        const end = new Date(now); end.setDate(end.getDate() + 7);
        const wk = Store.upcoming(now, 100).filter(x => new Date(x.starts_at) < end);
        if (!wk.length) return 'Nothing in the next seven days. Suspicious, but fine.';
        const uni = wk.filter(x => x.kind === 'uni').length, work = wk.filter(x => x.kind === 'work').length, kart = wk.filter(x => x.kind === 'kart').length;
        return `Next 7 days: ${uni} uni, ${work} work, ${kart} karting. First up: ${wk[0].title} ${Rules.fmtWhen(wk[0].starts_at, now)}.`;
      }
      if (/deadline|due|assign/.test(t)) {
        const tk = Store.tasks_open().filter(x => x.due).sort((a, b) => new Date(a.due) - new Date(b.due));
        if (!tk.length) return 'No dated tasks or deadlines on file. Either you\'re organised or nothing\'s been captured yet.';
        return 'Deadlines: ' + tk.slice(0, 5).map(x => `${x.title} — ${Rules.fmtWhen(x.due, now)}`).join(' · ');
      }
      if (/money|earn|pay|£/.test(t)) {
        const rate = +Store.settings.rateHourly;
        const shifts = Store.list('shifts');
        const month = shifts.filter(s => new Date(s.starts_at).getMonth() === now.getMonth());
        const hrs = month.reduce((a, s) => a + Math.max(0, (new Date(s.ends_at) - new Date(s.starts_at)) / 3600000), 0);
        if (!rate) return `${month.length} shift${month.length === 1 ? '' : 's'} this month, ${hrs.toFixed(1)} h. Add an hourly rate in Settings and I'll do the money.`;
        return `${month.length} shift${month.length === 1 ? '' : 's'} this month · ${hrs.toFixed(1)} h · ≈ £${(hrs * rate).toFixed(0)} before tax.`;
      }
      if (/add|remind|note/.test(t)) return null; // handled by capture flow in the UI
      if (/who are you|what are you|eden/.test(t)) return 'EDEN. I keep Iota running: your timetable, shifts and karting in one place. Rules-mode for now — plug me into Claude for the clever stuff.';
      return null;
    },
    /** Quick capture classifier: text → {table,row,label}. Heuristic v1; Layer 2/3 refine later. */
    classify(text, now = new Date()) {
      const t = text.trim();
      const low = t.toLowerCase();
      const when = Rules.parseWhen(t, now);
      const isShift = /\bshift\b|\bwork(ing)?\b|\brota\b/.test(low);
      const isKart = /\bkart|\btrack\b|bukc|race|practice|victoria/.test(low);
      const isUni = /lecture|seminar|lab\b|tutorial|module|exam|essay|coursework|assign|deadline|submit|lab /.test(low);
      const isNote = /^note[:\s]/i.test(t) || /^remember[:\s]/i.test(t);
      const isDeadline = /due|deadline|submit|hand in/.test(low);
      const title = Rules.cleanTitle(t);
      if (isNote) return { table: 'notes', row: { section: isUni ? 'uni' : isKart ? 'kart' : isShift ? 'work' : 'personal', text: t.replace(/^(note|remember)[:\s]+/i, '') }, label: 'note' };
      if (isShift && when) return { table: 'shifts', row: { title, starts_at: when.start.toISOString(), ends_at: (when.end || new Date(when.start.getTime() + 4 * 3600000)).toISOString(), status: 'planned', source: 'manual' }, label: 'shift' };
      if (isDeadline || (!when?.end && when && isUni)) return { table: 'tasks', row: { title, section: isUni ? 'uni' : isKart ? 'kart' : isShift ? 'work' : 'personal', due: when ? when.start.toISOString() : null, status: 'open' }, label: 'task' };
      if (when) return { table: 'events', row: { kind: isUni ? 'uni' : isKart ? 'kart' : isShift ? 'work' : 'personal', title, starts_at: when.start.toISOString(), ends_at: (when.end || new Date(when.start.getTime() + 3600000)).toISOString(), source: 'manual' }, label: 'event' };
      return { table: 'tasks', row: { title, section: isUni ? 'uni' : isKart ? 'kart' : isShift ? 'work' : 'personal', due: null, status: 'open' }, label: 'task' };
    },
    cleanTitle(t) {
      return t.replace(/\b(on|this|next)?\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/ig, '')
        .replace(/\b(today|tomorrow|tmrw|tonight)\b/ig, '')
        .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\s*([-–to]+\s*\d{1,2}(:\d{2})?\s*(am|pm)?)?\b/ig, '')
        .replace(/\s+\b(at|from|until|till|on|due|by)\b\s*$/i, '')
        .replace(/\s{2,}/g, ' ').replace(/^[\s,:-]+|[\s,:-]+$/g, '').trim() || t.trim();
    },
    /** Very small natural-date parser: weekday names, today/tomorrow, "12-8", "9am", "16:00-22:00", "Thu 4pm". */
    parseWhen(t, now = new Date()) {
      const low = t.toLowerCase();
      let base = null;
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dm = low.match(/\b(next\s+)?(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/);
      if (/\btoday\b|\btonight\b/.test(low)) base = new Date(now);
      else if (/\btomorrow\b|\btmrw\b/.test(low)) { base = new Date(now); base.setDate(base.getDate() + 1); }
      else if (dm) {
        const target = days.indexOf(dm[2]); base = new Date(now);
        let diff = (target - base.getDay() + 7) % 7; if (diff === 0 && !dm[1]) diff = 0; if (dm[1]) diff += 7 * (diff === 0 ? 1 : 0);
        base.setDate(base.getDate() + diff);
      }
      // times: "12-8", "12–8pm", "16:00-22:00", "9am", "4pm", "17:00"
      const range = low.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(?:to\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
      const single = low.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b/);
      const hr = (h, m, ap, otherAp) => {
        h = +h; m = +(m || 0);
        const a = ap || otherAp;
        if (a === 'pm' && h < 12) h += 12; if (a === 'am' && h === 12) h = 0;
        if (!ap && !otherAp && h < 7) h += 12; // "12-8" → 12:00–20:00; bare small hours read as pm
        return { h, m };
      };
      if (!base && (range || single)) base = new Date(now);
      if (!base) return null;
      const start = new Date(base); start.setSeconds(0, 0);
      let end = null;
      if (range) {
        const s = hr(range[1], range[2], range[3], range[6]), e = hr(range[4], range[5], range[6], range[3]);
        if (!range[6] && e.h <= s.h && e.h < 12) e.h += 12;   // "12-8" → 12:00–20:00
        start.setHours(s.h, s.m);
        end = new Date(start); end.setHours(e.h, e.m); if (end <= start) end.setDate(end.getDate() + 1);
      } else if (single) {
        const s = single[1] != null ? hr(single[1], single[2], single[3]) : hr(single[4], single[5], null);
        start.setHours(s.h, s.m);
      } else {
        start.setHours(9, 0);
      }
      return { start, end };
    },
  };
  Store.tasks_open = () => db.tasks.filter(t => t.status !== 'done');

  window.Store = Store;
  window.Rules = Rules;
})();
