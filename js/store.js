/* ============================================================
   Iota store — Phase 2: Supabase `iota` schema behind a cached,
   optimistic, offline-tolerant API. Reads are synchronous from the
   last-known snapshot; writes apply locally first, then sync.
   Also hosts EDEN's Layer-1 rules + personality templates.
   ============================================================ */
(function () {
  'use strict';

  const CACHE_KEY = 'iota.cache.v2';
  const OUTBOX_KEY = 'iota.outbox.v1';
  const TABLES = ['events', 'shifts', 'pay_rates', 'tasks', 'notes', 'societies', 'watches', 'briefings', 'modules', 'assessments', 'captures'];
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  const DEFAULT_SETTINGS = {
    name: 'Alex', employer: '', rateHourly: '', payFrequency: 'fortnightly', payAnchor: '', payDayOfMonth: '',
    travelMode: 'walk', travelCampusMin: 15, travelWorkMin: 30, travelTrackMin: 40, loadingMin: 15,
    homeAddress: '', campusAddress: '', workAddress: '', trackAddress: '',
    termStart: '', termWeeks: 12, apiKey: '', auroraIntensity: 1, reduceMotion: false,
  };
  const LOCAL_ONLY_KEYS = new Set(['apiKey']); // never leaves the device

  let db = load();
  function load() {
    let c = null; try { c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (_) {}
    const base = { settings: { ...DEFAULT_SETTINGS }, syncedAt: null };
    for (const t of TABLES) base[t] = [];
    const out = c ? { ...base, ...c, settings: { ...DEFAULT_SETTINGS, ...(c.settings || {}) } } : base;
    try { out.settings.apiKey = localStorage.getItem('iota.apiKey') || ''; } catch (_) {}
    return out;
  }
  function persist() { const { ...c } = db; c.settings = { ...c.settings, apiKey: '' }; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); }
  let outbox = []; try { outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); } catch (_) {}
  function saveOutbox() { localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); }

  const listeners = new Set();
  const emit = type => { for (const fn of listeners) { try { fn(type); } catch (e) { console.error(e); } } };

  // ---- remote ops (queued if offline / failing) ----
  async function remote(op) {
    if (!window.SB || !SB.session) { queue(op); return; }
    try { await runOp(op); }
    catch (e) { if (e.status && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 408 && e.status !== 429) { console.warn('Iota: rejected write', op, e.details || e.message); Store.lastError = e.message; emit('error'); } else queue(op); }
  }
  function queue(op) { outbox.push(op); saveOutbox(); emit('outbox'); }
  async function runOp(op) {
    if (op.kind === 'insert') return SB.rest('POST', op.table, { body: op.row, prefer: 'return=minimal,resolution=merge-duplicates' });
    if (op.kind === 'update') return SB.rest('PATCH', `${op.table}?id=eq.${op.id}`, { body: op.patch, prefer: 'return=minimal' });
    if (op.kind === 'delete') return SB.rest('DELETE', `${op.table}?id=eq.${op.id}`, { prefer: 'return=minimal' });
    if (op.kind === 'setting') return SB.rest('POST', 'settings?on_conflict=owner,key', { body: { key: op.key, value: op.value }, prefer: 'return=minimal,resolution=merge-duplicates' });
  }
  async function flush() {
    if (!outbox.length || !SB.session || !navigator.onLine) return;
    const pending = outbox.slice(); outbox = []; saveOutbox();
    for (const op of pending) await remote(op);
    emit('outbox');
  }

  const Store = {
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    emit,
    lastError: null,
    get settings() { return db.settings; },
    get syncedAt() { return db.syncedAt; },
    get pending() { return outbox.length; },
    get signedIn() { return !!(window.SB && SB.session); },

    setSetting(k, v) {
      db.settings[k] = v;
      if (LOCAL_ONLY_KEYS.has(k)) { try { localStorage.setItem('iota.apiKey', v || ''); } catch (_) {} persist(); emit('change'); return; }
      persist(); emit('change');
      remote({ kind: 'setting', key: k, value: v });
    },

    // ---- table ops (optimistic; PostgREST-shaped) ----
    list(table) { return (db[table] || []).slice(); },
    get(table, id) { return (db[table] || []).find(r => r.id === id) || null; },
    insert(table, row) {
      const r = { id: uuid(), created_at: new Date().toISOString(), ...row };
      (db[table] = db[table] || []).push(r); persist(); emit('change');
      remote({ kind: 'insert', table, row: r });
      return r;
    },
    update(table, id, patch) {
      const i = (db[table] || []).findIndex(r => r.id === id); if (i < 0) return null;
      db[table][i] = { ...db[table][i], ...patch }; persist(); emit('change');
      remote({ kind: 'update', table, id, patch });
      return db[table][i];
    },
    remove(table, id) {
      db[table] = (db[table] || []).filter(r => r.id !== id); persist(); emit('change');
      remote({ kind: 'delete', table, id });
    },

    /** Pull everything from Supabase into the snapshot. */
    async sync() {
      if (!SB.session) return false;
      await flush();
      const since = new Date(Date.now() - 45 * 86400000).toISOString(); // events/shifts: last 45 days onward
      const q = {
        events: `events?select=*&or=(ends_at.gte.${since},starts_at.gte.${since})&order=starts_at`,
        shifts: `shifts?select=*&ends_at=gte.${since}&order=starts_at`,
        pay_rates: 'pay_rates?select=*&order=effective_from.desc',
        tasks: 'tasks?select=*&status=neq.dropped&order=due.asc.nullslast',
        notes: 'notes?select=*&order=created_at.desc&limit=200',
        societies: 'societies?select=*&order=sort',
        watches: 'watches?select=*&status=neq.resolved&order=expected_by',
        briefings: 'briefings?select=*&order=created_at.desc&limit=14',
        modules: 'modules?select=*&order=code',
        assessments: 'assessments?select=*&order=due_at',
        captures: 'captures?select=*&order=created_at.desc&limit=50',
        settings: 'settings?select=key,value',
      };
      const results = await Promise.allSettled(Object.entries(q).map(([t, path]) => SB.rest('GET', path).then(rows => [t, rows])));
      let ok = 0;
      for (const r of results) {
        if (r.status !== 'fulfilled') { console.warn('sync', r.reason); continue; }
        const [t, rows] = r.value; ok++;
        if (t === 'settings') { const s = { ...DEFAULT_SETTINGS }; for (const row of rows) s[row.key] = row.value; s.apiKey = db.settings.apiKey; db.settings = s; }
        else db[t] = rows || [];
      }
      if (ok) { db.syncedAt = new Date().toISOString(); persist(); emit('sync'); }
      return ok > 0;
    },
    async flush() { return flush(); },
    clearLocal() { localStorage.removeItem(CACHE_KEY); localStorage.removeItem(OUTBOX_KEY); db = load(); outbox = []; emit('change'); },
    exportJSON() { return JSON.stringify({ ...db, outbox }, null, 2); },

    // ---- unified calendar ----
    allTimed() {
      const ev = db.events.filter(e => e.status !== 'cancelled').map(e => ({ ...e, _table: 'events' }));
      const sh = db.shifts.filter(s => s.status !== 'cancelled').map(s => ({ ...s, _table: 'shifts', kind: 'work', title: s.role ? `Shift · ${s.role}` : 'Shift' }));
      const tk = db.tasks.filter(t => t.due && t.status === 'open').map(t => ({ ...t, _table: 'tasks', kind: t.section || 'personal', starts_at: t.due, ends_at: t.due, isTask: true }));
      const as = db.assessments.filter(a => a.due_at && a.status !== 'graded' && a.status !== 'submitted').map(a => ({ ...a, _table: 'assessments', kind: 'uni', starts_at: a.due_at, ends_at: a.due_at, isTask: true, title: a.title }));
      return [...ev, ...sh, ...tk, ...as].filter(x => x.starts_at).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
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
    tasks_open() { return db.tasks.filter(t => t.status === 'open'); },
  };

  window.addEventListener('online', () => flush());

  // ============================================================
  // Layer 1 rules — offline, deterministic. And EDEN's voice.
  // EDEN: she/her. Calm, dry, competent; a close friend with a
  // sense of humour. Concise like Jarvis, never sycophantic.
  // ============================================================
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const Rules = {
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
      const part = h < 5 ? pick(['Still up', 'Late one']) : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 22 ? 'Evening' : pick(['Late one', 'Evening']);
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
      if (days < 6 && days > 0) return d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + time;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + time;
    },
    fmtRange(a, b) {
      const f = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return b ? `${f(a)}–${f(b)}` : f(a);
    },
    hours(a, b) { return Math.max(0, (new Date(b) - new Date(a)) / 3600000); },
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
    /** Next payday from settings: fortnightly/weekly anchor date, or monthly day. */
    nextPayday(now = new Date()) {
      const s = Store.settings;
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      if ((s.payFrequency === 'fortnightly' || s.payFrequency === 'weekly') && s.payAnchor) {
        const step = s.payFrequency === 'weekly' ? 7 : 14;
        let d = new Date(s.payAnchor + 'T00:00:00'); if (isNaN(d)) return null;
        while (d <= today) d.setDate(d.getDate() + step);
        return d;
      }
      if (s.payFrequency === 'monthly' && +s.payDayOfMonth) {
        let d = new Date(today.getFullYear(), today.getMonth(), +s.payDayOfMonth); if (d <= today) d = new Date(today.getFullYear(), today.getMonth() + 1, +s.payDayOfMonth); return d;
      }
      return null;
    },
    lastPayday(now = new Date()) {
      const nx = Rules.nextPayday(now); if (!nx) return null; const s = Store.settings;
      const d = new Date(nx); if (s.payFrequency === 'monthly') d.setMonth(d.getMonth() - 1); else d.setDate(d.getDate() - (s.payFrequency === 'weekly' ? 7 : 14)); return d;
    },
    /** Unpaid break for a shift length, from settings.breakRule ({overHours, longBreakMin, shortBreakMin}). */
    breakFor(hours) {
      const r = Store.settings.breakRule || { overHours: 6, longBreakMin: 45, shortBreakMin: 30 };
      return hours > (+r.overHours || 6) ? (+r.longBreakMin || 45) : (+r.shortBreakMin || 30);
    },
    payEstimate(shifts) {
      const rate = +Store.settings.rateHourly || 0;
      const hrs = shifts.reduce((a, s) => a + Rules.hours(s.starts_at, s.ends_at) - (s.break_min || 0) / 60, 0);
      return { hours: hrs, gross: hrs * rate };
    },

    /** EDEN's one-liner for the Ring. */
    observation(now = new Date()) {
      const up = Store.upcoming(now, 50), today = Store.today(), openTasks = Store.tasks_open();
      const clash = Rules.firstClash(up);
      if (clash) return pick([`${clash.a.title} overlaps ${clash.b.title}. Physics says pick one.`, `Heads up — ${clash.a.title} and ${clash.b.title} are on top of each other.`]);
      const soon = up[0];
      if (soon) {
        const mins = Math.round((new Date(soon.starts_at) - now) / 60000);
        if (mins > 0 && mins <= 120) {
          const buf = Rules.leaveBufferFor(soon), leaveIn = mins - buf;
          if (buf && leaveIn > 0) return pick([`Leave in ${leaveIn} min for ${soon.title}. It's a ${buf}-minute walk, I've done the maths.`, `${soon.title} in ${mins} — shoes on in ${leaveIn}.`]);
          if (buf && leaveIn <= 0) return pick([`You should already be moving for ${soon.title}. I'm not covering for you.`, `${soon.title} in ${mins} min and it's a ${buf}-minute walk. Go.`]);
          return `${soon.title} in ${mins} min.`;
        }
        if (mins <= 0 && soon.ends_at && new Date(soon.ends_at) > now) return `${soon.title} — happening now. Focus.`;
      }
      const w = Rules.dueWatches(now, 2);
      if (w.length) return `Also watching: ${w[0].text.replace(/ — .*/, '')} — ${w[0].expected_by ? Rules.fmtWhen(w[0].expected_by + 'T09:00:00', now).replace(' 09:00', '') : 'soon'}.`;
      if (today.length === 0 && openTasks.length === 0) return pick(['Nothing on. Rare. Enjoy it before I find something.', 'Diary\'s empty. I checked twice. Go outside.', 'Free day. Don\'t spend it staring at the ceiling.']);
      if (today.length === 0) return pick([`${openTasks.length} open task${openTasks.length === 1 ? '' : 's'}, nothing timed. Suspiciously calm.`, `Nothing timed today, ${openTasks.length} on the list. Your call.`]);
      const uni = today.filter(x => x.kind === 'uni').length, work = today.filter(x => x.kind === 'work').length, kart = today.filter(x => x.kind === 'kart').length;
      const bits = [];
      if (uni) bits.push(`${uni} lecture${uni > 1 ? 's' : ''}`);
      if (work) bits.push(`${work} shift${work > 1 ? 's' : ''}`);
      if (kart) bits.push(`${kart} karting`);
      const s = bits.join(', ');
      return s ? pick([`${s[0].toUpperCase() + s.slice(1)}. Survivable. Hydrate.`, `${s[0].toUpperCase() + s.slice(1)}. I've seen worse.`]) : 'A quiet one.';
    },
    dueWatches(now = new Date(), days = 3) {
      const lim = new Date(now); lim.setDate(lim.getDate() + days);
      return Store.list('watches').filter(w => w.status !== 'resolved' && w.expected_by && new Date(w.expected_by) <= lim);
    },
    /** Rules-mode chat answers. Returns a string or null (→ "ask me properly"). */
    answer(q, now = new Date()) {
      const t = q.trim().toLowerCase();
      if (!t) return null;
      if (/^(hi|hello|hey|yo|morning|evening)\b/.test(t)) return pick(['Hello you.', 'Hey.', 'Present.']) + ' ' + Rules.observation(now);
      if (/thank/.test(t)) return pick(['Anytime.', 'That\'s the job.', 'You\'re welcome. Now go do the thing.']);
      if (/today|what('s| is) on/.test(t)) {
        const td = Store.today();
        if (!td.length) return 'Nothing timed today. ' + (Store.tasks_open().length ? `${Store.tasks_open().length} open tasks if you're feeling productive.` : 'Genuinely free. Rare — enjoy it.');
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
        const tk = [...Store.tasks_open().filter(x => x.due).map(x => ({ title: x.title, due: x.due })), ...Store.list('assessments').filter(a => a.due_at && a.status !== 'graded').map(a => ({ title: a.title, due: a.due_at }))].sort((a, b) => new Date(a.due) - new Date(b.due));
        if (!tk.length) return 'No dated deadlines on file. Either you\'re organised or nothing\'s been captured yet. I know which I\'d bet on.';
        return 'Deadlines: ' + tk.slice(0, 5).map(x => `${x.title} — ${Rules.fmtWhen(x.due, now)}`).join(' · ');
      }
      if (/money|earn|pay|£|wage/.test(t)) {
        const rate = +Store.settings.rateHourly, last = Rules.lastPayday(now), next = Rules.nextPayday(now);
        const shifts = Store.list('shifts').filter(s => s.status !== 'cancelled');
        const period = last ? shifts.filter(s => new Date(s.starts_at) >= last && new Date(s.starts_at) < now) : [];
        const upcoming = shifts.filter(s => new Date(s.starts_at) >= now && (!next || new Date(s.starts_at) < next));
        const pe = Rules.payEstimate(period), ue = Rules.payEstimate(upcoming);
        if (!rate) return 'Add an hourly rate in Settings and I\'ll do the money.';
        const days = next ? Math.ceil((next - now) / 86400000) : null;
        return `Since last payday: ${period.length} shift${period.length === 1 ? '' : 's'}, ${pe.hours.toFixed(1)} h ≈ £${pe.gross.toFixed(0)} gross.${upcoming.length ? ` ${upcoming.length} more booked before payday (≈ £${ue.gross.toFixed(0)}).` : ''}${days != null ? ` Payday in ${days} day${days === 1 ? '' : 's'}.` : ''}`;
      }
      if (/payday/.test(t)) { const n = Rules.nextPayday(now); return n ? `Payday is ${n.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} — ${Math.ceil((n - now) / 86400000)} days.` : 'No payday configured yet.'; }
      if (/who are you|what are you|\beden\b/.test(t)) return 'EDEN. Your friend who happens to run your life. Rules mode for now — plug me into Claude and I get properly clever.';
      if (/add|remind|note/.test(t)) return null;
      return null;
    },
    /** Quick capture classifier: text → {table,row,label}. Heuristic v1; Layer 2/3 refine later. */
    classify(text, now = new Date()) {
      const t = text.trim(), low = t.toLowerCase();
      const when = Rules.parseWhen(t, now);
      const isShift = /\bshift\b|\bwork(ing)?\b|\brota\b|mcdonald|maccies/.test(low);
      const isKart = /\bkart|\btrack\b|bukc|race|practice|victoria/.test(low);
      const isUni = /lecture|seminar|lab\b|tutorial|module|exam|essay|coursework|assign|deadline|submit|library|revision/.test(low);
      const isNote = /^note[:\s]/i.test(t) || /^remember[:\s]/i.test(t);
      const isDeadline = /due|deadline|submit|hand in/.test(low);
      const section = isUni ? 'uni' : isKart ? 'kart' : isShift ? 'work' : 'personal';
      const title = Rules.cleanTitle(t);
      if (isNote) return { table: 'notes', row: { section, md: t.replace(/^(note|remember)[:\s]+/i, ''), title: null, tags: [] }, label: 'note' };
      if (isShift && when) { const end = when.end || new Date(when.start.getTime() + 4 * 3600000); return { table: 'shifts', row: { starts_at: when.start.toISOString(), ends_at: end.toISOString(), status: 'planned', source: 'manual', break_min: Rules.breakFor((end - when.start) / 3600000), location: Store.settings.employer || null }, label: 'shift' }; }
      if (isDeadline || (!when?.end && when && isUni)) return { table: 'tasks', row: { title, section, due: when ? when.start.toISOString() : null, status: 'open' }, label: 'task' };
      if (when) return { table: 'events', row: { kind: section, title, starts_at: when.start.toISOString(), ends_at: (when.end || new Date(when.start.getTime() + 3600000)).toISOString(), source: 'manual', status: 'planned' }, label: 'event' };
      return { table: 'tasks', row: { title, section, due: null, status: 'open' }, label: 'task' };
    },
    cleanTitle(t) {
      return t.replace(/\b(on|this|next)?\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/ig, '')
        .replace(/\b(today|tomorrow|tmrw|tonight)\b/ig, '')
        .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\s*([-–to]+\s*\d{1,2}(:\d{2})?\s*(am|pm)?)?\b/ig, '')
        .replace(/\s+\b(at|from|until|till|on|due|by)\b\s*$/i, '')
        .replace(/\s{2,}/g, ' ').replace(/^[\s,:-]+|[\s,:-]+$/g, '').trim() || t.trim();
    },
    parseWhen(t, now = new Date()) {
      const low = t.toLowerCase();
      let base = null;
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dm = low.match(/\b(next\s+)?(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/);
      const dateM = low.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
      if (/\btoday\b|\btonight\b/.test(low)) base = new Date(now);
      else if (/\btomorrow\b|\btmrw\b/.test(low)) { base = new Date(now); base.setDate(base.getDate() + 1); }
      else if (dateM) { const m = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(dateM[2]); base = new Date(now.getFullYear(), m, +dateM[1]); if (base < now && (now - base) > 30 * 86400000) base.setFullYear(base.getFullYear() + 1); }
      else if (dm) {
        const target = days.indexOf(dm[2]); base = new Date(now);
        let diff = (target - base.getDay() + 7) % 7; if (dm[1] && diff === 0) diff = 7;
        base.setDate(base.getDate() + diff);
      }
      const range = low.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(?:to\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
      const single = low.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b/);
      const hr = (h, m, ap, otherAp) => {
        h = +h; m = +(m || 0); const a = ap || otherAp;
        if (a === 'pm' && h < 12) h += 12; if (a === 'am' && h === 12) h = 0;
        if (!ap && !otherAp && h < 7) h += 12;
        return { h, m };
      };
      if (!base && (range || single)) base = new Date(now);
      if (!base) return null;
      const start = new Date(base); start.setSeconds(0, 0);
      let end = null;
      if (range) {
        const s = hr(range[1], range[2], range[3], range[6]), e = hr(range[4], range[5], range[6], range[3]);
        if (!range[6] && e.h <= s.h && e.h < 12) e.h += 12;
        start.setHours(s.h, s.m);
        end = new Date(start); end.setHours(e.h, e.m); if (end <= start) end.setDate(end.getDate() + 1);
      } else if (single) {
        const s = single[1] != null ? hr(single[1], single[2], single[3]) : hr(single[4], single[5], null);
        start.setHours(s.h, s.m);
      } else start.setHours(9, 0);
      return { start, end };
    },
  };

  window.Store = Store;
  window.Rules = Rules;
})();
