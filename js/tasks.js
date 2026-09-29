/* ============================================================
   Iota — Tasks engine + EDEN's voice (Layer 1)
   Scoring, "what's next", grouping, the natural-language quick-add
   parser, and the line pools EDEN speaks from when no Claude layer
   has written anything better.
   ============================================================ */
(function () {
  'use strict';
  const H = 3600000, D = 86400000;
  const AREAS = {
    'Uni': 'uni', 'Coursework': 'uni', 'Career': 'uni', 'Year abroad': 'uni', 'Societies': 'uni', 'Japanese': 'uni',
    'Karting': 'kart',
    "McDonald's": 'work', 'FallingHippo': 'work', 'usBox': 'work', 'Skein': 'work', 'Clients': 'work',
    'Money': 'personal', 'Admin': 'personal', 'Security': 'personal', 'Life': 'personal', 'Writing': 'personal', 'Streaming': 'personal', 'Health': 'personal',
  };
  const SECTION_AREA = { uni: 'Uni', work: 'Work', personal: 'Life', kart: 'Karting' };

  const pr = t => +(t.priority || 4);
  const area = t => t.area || SECTION_AREA[t.section] || 'Life';
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
    const wakeStart = Math.max(new Date(s).setHours(8, 0, 0, 0), now.getTime()), wakeEnd = new Date(s).setHours(23, 0, 0, 0);
    let busy = 0;
    for (const x of Store.allTimed().filter(x => !x.isTask && x.ends_at)) { const a = Math.max(new Date(x.starts_at), wakeStart), b = Math.min(new Date(x.ends_at), wakeEnd); if (b > a) busy += (b - a) / 60000; }
    const free = Math.max(0, (wakeEnd - wakeStart) / 60000 - busy);
    return { taskMin, free, count: due.length };
  }

  // ------------------------------------------------------------
  // Quick-add parser: "Email Vicky re formations tmrw 3pm p2 #fallinghippo 15m !"
  // ------------------------------------------------------------
  const AREA_KEYS = Object.keys(AREAS).reduce((m, k) => (m[k.toLowerCase().replace(/[^a-z]/g, '')] = k, m), {});
  Object.assign(AREA_KEYS, { fh: 'FallingHippo', uni: 'Uni', work: "McDonald's", mcd: "McDonald's", maccies: "McDonald's", kart: 'Karting', karting: 'Karting', money: 'Money', admin: 'Admin', abroad: 'Year abroad', jp: 'Japanese', essay: 'Coursework', cw: 'Coursework' });
  function parse(text, now = new Date()) {
    let t = ' ' + text + ' ';
    const out = { priority: null, area: null, due: null, due_kind: null, duration_min: null, tokens: [] };
    t = t.replace(/\s(p[1-4])(?=\s)/i, (_, p) => { out.priority = +p[1]; out.tokens.push({ k: 'p' + p[1], label: 'P' + p[1] }); return ' '; });
    t = t.replace(/\s(!{1,3})(?=\s)/, (_, b) => { out.priority = out.priority || Math.max(1, 3 - b.length + 1); out.tokens.push({ k: 'p' + out.priority, label: 'P' + out.priority }); return ' '; });
    t = t.replace(/\s#([\w'-]+)(?=\s)/, (_, a) => { const key = a.toLowerCase().replace(/[^a-z]/g, ''); out.area = AREA_KEYS[key] || (a[0].toUpperCase() + a.slice(1)); out.tokens.push({ k: 'area', label: out.area }); return ' '; });
    t = t.replace(/\s(\d+(?:\.\d+)?)\s?(h|hr|hrs|hours?)(?:\s?(\d+)\s?m(?:in)?s?)?(?=\s)/i, (_, h, __, m) => { out.duration_min = Math.round(+h * 60 + (+m || 0)); out.tokens.push({ k: 'dur', label: fmtMins(out.duration_min) }); return ' '; });
    if (!out.duration_min) t = t.replace(/\s(\d{1,3})\s?(m|min|mins|minutes)(?=\s)/i, (_, m) => { out.duration_min = +m; out.tokens.push({ k: 'dur', label: fmtMins(+m) }); return ' '; });
    t = t.replace(/\s(hard|deadline)(?=\s)/i, () => { out.due_kind = 'hard'; return ' '; });
    const w = Rules.parseWhen(t, now);
    if (w) {
      const hasTime = /\d\s*(am|pm)|\d:\d\d|\bat\s+\d/i.test(t);
      const d = new Date(w.start); if (!hasTime) d.setHours(18, 0, 0, 0);
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
      if (h < 5) out.push(`${name} is at ${timeStr(nx.starts_at)}. Sleep would help.`);
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

  window.Tasks = { AREAS, BUCKETS, score, ranked, open, next, reason, dueLabel, dueClass, fmtMins, bucket, parse, dayLoad, area, sectionOf, pr, mins, freeWindow, brief, doneLine, say, nextEvent, shortName };
})();
