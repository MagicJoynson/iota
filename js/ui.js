/* ============================================================
   Iota — UI kit: icons, EDEN's mark, the day dial, rows, sheets,
   toasts with undo, markdown, formatting. Shared by app.js + hubs.js.
   ============================================================ */
(function () {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---- icons: one hand-drawn set, 24-grid, 1.6 stroke ----
  const P = (d, extra = '') => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const I = {
    today: P('<circle cx="12" cy="12" r="8.5"/><path d="M12 12V6.8M12 12l3.2 2"/>'),
    tasks: P('<path d="M4 7.2l1.8 1.8L9 5.8M4 16.2l1.8 1.8L9 14.8M12.5 7.5H20M12.5 16.5H20"/>'),
    calendar: P('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'),
    areas: P('<path d="M12 3.8l8.2 4.4L12 12.6 3.8 8.2 12 3.8z"/><path d="M3.8 12.3L12 16.7l8.2-4.4M3.8 16.3L12 20.7l8.2-4.4"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    search: P('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    right: P('<path d="M9.5 6l6 6-6 6"/>'),
    left: P('<path d="M14.5 6l-6 6 6 6"/>'),
    down: P('<path d="M6 9.5l6 6 6-6"/>'),
    settings: P('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    trash: P('<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.8 12.2c.1 1 .9 1.8 1.9 1.8h5.6c1 0 1.8-.8 1.9-1.8L17.5 7M9.5 7V4.5h5V7"/>'),
    out: P('<path d="M9 5H6.5A2.5 2.5 0 0 0 4 7.5v10A2.5 2.5 0 0 0 6.5 20h10a2.5 2.5 0 0 0 2.5-2.5V15M13 4h7v7M20 4l-9 9"/>'),
    clock: P('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    moon: P('<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z"/>'),
    x: P('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    send: P('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    mail: P('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
    file: P('<path d="M7 3.5h6.5L18.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13 3.5V9h5.5"/>'),
    wallet: P('<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17M15.5 14.5h2"/>'),
    db: P('<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v11c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-11M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>'),
    book: P('<path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v13H7.5A2.5 2.5 0 0 1 5 17.5v-13z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H17M17 7h2v13"/>'),
    users: P('<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.4-3.2 2.7-5.2 5.5-5.2s5.1 2 5.5 5.2M15.5 5.6a3 3 0 0 1 0 5.8M17 14.5c2 .6 3.3 2.4 3.5 5"/>'),
    briefcase: P('<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>'),
    folder: P('<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10z"/>'),
    target: P('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'),
    chart: P('<path d="M4 20h16M7 16v-4M11.5 16V8M16 16v-6"/>'),
    plane: P('<path d="M10.5 13.5L4 11l1.2-1.6 7.3.9 4.2-4.6a1.8 1.8 0 0 1 2.6 2.6l-4.6 4.2.9 7.3L14 21l-2.5-6.5-3 3v2.3l-1.2.9-1-3-3-1 .9-1.2h2.3l3-3z"/>'),
    info: P('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>'),
    sync: P('<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1M17.5 3.5v3.6h-3.6M6.5 20.5v-3.6h3.6"/>'),
    key: P('<circle cx="8" cy="15.5" r="3.8"/><path d="M10.8 12.8L19.5 4M16.5 7l2.5 2.5M14 9.5l2 2"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
    flag: P('<path d="M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11"/>'),
    note: P('<path d="M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>'),
    jp: P('<path d="M4.5 6.5h11M10 4v2.5M6.5 6.5c.5 5 3.5 8.5 8 10.5M14 6.5c-1 4.5-4 8.5-9 10.5M14.5 20l3-7.5 3 7.5M15.5 17.5h4"/>'),
    flagk: P('<path d="M5.5 21V4.5h13v8h-13"/><path d="M9.8 4.5v8M14.2 4.5v8M5.5 8.5h13"/>'),
    logout: P('<path d="M9.5 20H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4h3M15 16l4-4-4-4M19 12H9.5"/>'),
    dots: P('<circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/>'),
  };
  const icon = (k, cls = '') => I[k] ? (cls ? I[k].replace('class="i"', `class="i ${cls}"`) : I[k]) : '';
  const TICK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5"/></svg>';

  // ---- EDEN's mark: the Iota ring reduced to a glyph. Three section arcs around a core. ----
  const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [12 + r * Math.cos(a), 12 + r * Math.sin(a)]; };
  const arcD = (r, a1, a2) => { const [x1, y1] = pt(r, a1), [x2, y2] = pt(r, a2); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
  // University top-left, Work top-right, Personal bottom — the original Ring's geometry.
  const MARK_ARCS = [['uni', 248, 350], ['work', 10, 112], ['personal', 128, 232]];
  const MARK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="arcs">${MARK_ARCS.map(([k, a, b]) => `<path class="a ${k}" d="${arcD(9.2, a, b)}"/>`).join('')}</g><circle class="core" cx="12" cy="12" r="3.3"/></svg>`;
  const mark = (cls = '', aware = '') => `<span class="mark ${cls}" ${aware ? `data-aware="${aware}"` : ''} role="img" aria-label="EDEN">${MARK_SVG}</span>`;

  // ---- formatting ----
  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (d, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('en-GB', o);
  const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const relDay = (d, now = new Date()) => { const a = new Date(dayKey(d) + 'T00:00:00'), b = new Date(dayKey(now) + 'T00:00:00'); const n = Math.round((a - b) / 86400000); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 1 && n < 7 ? fmtDay(d, { weekday: 'long' }) : fmtDay(d, { weekday: 'long', day: 'numeric', month: 'short' }); };
  const until = (d, now = new Date()) => { const m = Math.round((new Date(d) - now) / 60000); if (m < 1) return 'now'; if (m < 60) return `in ${m} min`; const h = Math.floor(m / 60), r = m % 60; if (h < 24) return `in ${h}h${r ? ' ' + r + 'm' : ''}`; const days = Math.round(m / 1440); return `in ${days} day${days === 1 ? '' : 's'}`; };
  const gbp = (n, dp = 0) => '£' + (+n).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

  // ---- sections ----
  const SECTIONS = {
    uni: { name: 'University', icon: 'book', tabs: [['today', 'Today'], ['modules', 'Modules'], ['deadlines', 'Deadlines'], ['societies', 'Societies']] },
    work: { name: 'Work', icon: 'briefcase', tabs: [['tasks', 'Projects'], ['shifts', 'Shifts'], ['earnings', 'Earnings'], ['requests', 'Time off'], ['info', 'Info']] },
    personal: { name: 'Personal', icon: 'folder', tabs: [['money', 'Money'], ['admin', 'Admin'], ['targets', 'Targets']] },
  };
  const kindName = k => k === 'kart' ? 'Karting' : (SECTIONS[k]?.name || 'Personal');
  const kindVar = k => `var(--${k === 'kart' ? 'uni' : ['uni', 'work', 'personal'].includes(k) ? k : 'personal'})`;
  const MOD = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';

  // ---- the day dial: the Ring, made functional. 24h face, commitments as arcs, needle at now. ----
  function dial(now = new Date(), opts = {}) {
    const C = 100, R = 84, start = new Date(now); start.setHours(0, 0, 0, 0);
    const ang = d => ((new Date(d) - start) / 86400000) * 360;
    const p = (r, a) => { const t = (a - 90) * Math.PI / 180; return [C + r * Math.cos(t), C + r * Math.sin(t)]; };
    const arc = (r, a1, a2) => { a1 = Math.max(0, a1); a2 = Math.min(359.9, a2); if (a2 <= a1) return ''; const [x1, y1] = p(r, a1), [x2, y2] = p(r, a2); return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const items = Store.allTimed().filter(x => !x.isTask && x.ends_at && new Date(x.ends_at) > start && new Date(x.starts_at) < end);
    const dues = Store.allTimed().filter(x => x.isTask && new Date(x.starts_at) >= start && new Date(x.starts_at) < end);
    let ticks = '';
    for (let h = 0; h < 24; h++) { const a = h * 15, major = h % 6 === 0; const [x1, y1] = p(major ? 94 : 96, a), [x2, y2] = p(99, a); ticks += `<line class="tick ${major ? 'major' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }
    const labels = opts.labels ? [['0', 0], ['6', 90], ['12', 180], ['18', 270]].map(([t, a]) => { const [x, y] = p(56, a); return `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle">${t}</text>`; }).join('') : '';
    const arcs = items.map(x => `<path class="arc" d="${arc(R, ang(x.starts_at) + .6, ang(x.ends_at) - .6)}" stroke="${kindVar(x.kind)}" stroke-width="11"><title>${esc(x.title)} ${fmtTime(x.starts_at)}</title></path>`).join('');
    const dots = dues.map(x => { const [cx, cy] = p(72, ang(x.starts_at)); return `<circle class="due" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6"><title>Due ${fmtTime(x.starts_at)} · ${esc(x.title)}</title></circle>`; }).join('');
    const an = ang(now), [nx, ny] = p(R - 6, an);
    const centre = opts.centre ? `<text x="${C}" y="${C + (opts.sub ? -2 : 6)}" text-anchor="middle" style="font-size:${opts.big ? 22 : 20}px;font-weight:700;fill:var(--ink);letter-spacing:-.02em">${esc(opts.centre)}</text>${opts.sub ? `<text x="${C}" y="${C + 16}" text-anchor="middle" style="font-size:10.5px;font-weight:500;fill:var(--ink-2)">${esc(opts.sub)}</text>` : ''}` : '';
    return `<svg class="dial" viewBox="0 0 200 200" role="img" aria-label="Today as a 24-hour dial: ${items.length} commitments${dues.length ? ', ' + dues.length + ' due' : ''}">
      <circle class="face" cx="${C}" cy="${C}" r="${R}" stroke-width="11" opacity=".55"/>
      <path class="past" d="${arc(R, 0, an)}" stroke-width="11"/>
      ${ticks}${labels}${arcs}${dots}
      <line class="needle" x1="${C}" y1="${C}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"/>
      ${centre ? `<circle cx="${C}" cy="${C}" r="${opts.big ? 46 : 40}" fill="var(--bg)"/>${centre}` : `<circle class="hub" cx="${C}" cy="${C}" r="3.2"/>`}
    </svg>`;
  }

  // ---- task row ----
  const SRC_ICON = { Gmail: 'mail', Drive: 'file', Calendar: 'calendar', 'Bank feed': 'wallet', Notion: 'file', Supabase: 'db', Memory: 'note', Iota: 'info', manual: 'note' };
  function checkHTML(t) { return `<button class="check p${Tasks.pr(t)}" data-check="${t.id}" aria-label="Complete: ${esc(t.title)}">${TICK}</button>`; }
  function taskRow(t, opts = {}) {
    const now = opts.now || new Date();
    const sec = Tasks.sectionOf(t), area = Tasks.area(t), m = Tasks.mins(t);
    const due = Tasks.dueLabel(t, now), dc = Tasks.dueClass(t, now);
    const meta = [
      `<span><i class="dot ${sec}"></i>${esc(area)}</span>`,
      t.due_kind === 'hard' && t.due ? `<span class="tag hard">Deadline</span>` : '',
      m ? `<span class="tnum">${Tasks.fmtMins(m)}</span>` : '',
      opts.showSource && t.source ? `<span class="src">${icon(SRC_ICON[t.source] || 'note', 'i-sm')}${esc(t.source)}</span>` : '',
    ].filter(Boolean).join('<i class="sep"></i>');
    const done = t.status === 'done';
    return `<div class="row-wrap" data-task="${t.id}"><div class="row task ${done ? 'done' : ''} ${opts.sel === t.id ? 'sel' : ''}" data-open="${t.id}" tabindex="-1">
      <div class="lead">${checkHTML(t)}</div>
      <div class="body"><div class="title"><span class="strike">${esc(t.title)}</span></div><div class="meta">${meta}</div></div>
      <div class="trail ${dc}">${done && t.done_at ? esc(fmtDay(t.done_at, { day: 'numeric', month: 'short' })) : esc(due)}</div>
    </div></div>`;
  }
  function eventRow(x, now = new Date()) {
    const live = new Date(x.starts_at) <= now && now < new Date(x.ends_at || x.starts_at);
    const past = new Date(x.ends_at || x.starts_at) < now;
    const sub = [x.location, x.isTask ? (x._table === 'assessments' ? 'Assessment due' : 'Due') : null].filter(Boolean).join(' · ');
    return `<button class="row timed ${live ? 'live' : ''} ${past ? 'past' : ''} ${x.isTask ? 'task' : ''}" style="--c:${kindVar(x.kind)}" data-ev="${x._table}:${x.id}">
      <span class="time">${fmtTime(x.starts_at)}${x.ends_at && !x.isTask && x.ends_at !== x.starts_at ? `<small>${fmtTime(x.ends_at)}</small>` : ''}</span>
      <span class="bar"></span>
      <span class="body"><span class="title" style="display:block">${esc(x.title)}</span>${sub ? `<span class="meta">${esc(sub)}</span>` : ''}</span>
      <span class="trail">${live ? '<b>Now</b>' : ''}</span>
    </button>`;
  }

  // ---- toast with undo ----
  let toastT, lastUndo = null;
  function toast(msg, opts = {}) {
    let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = `<span>${esc(msg)}</span>${opts.undo ? `<button data-undo>Undo <kbd>${MOD}Z</kbd></button>` : ''}`;
    lastUndo = opts.undo || null;
    t.querySelector('[data-undo]')?.addEventListener('click', () => { const u = lastUndo; lastUndo = null; t.classList.remove('show'); u?.(); });
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('show'); lastUndo = null; }, opts.undo ? 5000 : 2400);
  }
  function undo() { if (lastUndo) { const u = lastUndo; lastUndo = null; $('#toast')?.classList.remove('show'); u(); return true; } return false; }

  // ---- sheets (bottom sheet on phone, dialog on desktop) ----
  function sheet(html, opts = {}) {
    const el = document.createElement('div'); el.className = 'sheet ' + (opts.cls || '');
    el.innerHTML = `<div class="scrim" data-close></div><div class="panel" role="dialog" aria-modal="true" ${opts.label ? `aria-label="${esc(opts.label)}"` : ''}><div class="grip"></div>${html}</div>`;
    const prevFocus = document.activeElement;
    const close = () => { el.remove(); document.removeEventListener('keydown', onKey, true); opts.onClose?.(); prevFocus?.focus?.(); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    el.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.body.appendChild(el);
    return { el, panel: $('.panel', el), close };
  }

  function haptic() { try { navigator.vibrate?.(8); } catch (_) {} }

  /** Tiny safe markdown for EDEN: bold, italic, code, links, lists, line breaks. */
  function md(src) {
    let t = esc(src || '');
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\w)/g, '$1<i>$2</i>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
    t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const lines = t.split(/\r?\n/); let out = '', inList = false;
    for (const ln of lines) {
      const m = ln.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (m) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + m[1] + '</li>'; continue; }
      if (inList) { out += '</ul>'; inList = false; }
      if (ln.trim() === '') { out += '<span class="br"></span>'; continue; }
      out += (out && !out.endsWith('</ul>') && !out.endsWith('</span>') ? '<br>' : '') + ln.replace(/^#+\s*/, '');
    }
    if (inList) out += '</ul>';
    return out;
  }

  const empty = (title, text, action) => `<div class="empty"><h3>${esc(title)}</h3><p>${text}</p>${action ? `<button class="btn" ${action.attr || ''}>${esc(action.label)}</button>` : ''}</div>`;

  window.UI = { MOD, $, $$, esc, I, icon, TICK, mark, dial, fmtTime, fmtDay, dayKey, relDay, until, gbp, SECTIONS, kindName, kindVar, taskRow, eventRow, checkHTML, toast, undo, sheet, haptic, md, empty, SRC_ICON };
})();
