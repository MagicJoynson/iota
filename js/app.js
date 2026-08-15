/* ============================================================
   IOTA — app shell (Phase 1)
   Router · Ring · sections + hotbar · EDEN · settings · capture
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');

  const SECTIONS = {
    uni:  { name: 'University', color: '#8B7CFF', rgb: '139,124,255', tabs: ['today', 'modules', 'deadlines', 'notes'], tabNames: { today: 'Today', modules: 'Modules', deadlines: 'Deadlines', notes: 'Notes' } },
    work: { name: 'Work', color: '#2DD4BF', rgb: '45,212,191', tabs: ['shifts', 'earnings', 'requests', 'info'], tabNames: { shifts: 'Shifts', earnings: 'Earnings', requests: 'Requests', info: 'Info' } },
    kart: { name: 'Karting & Societies', short: 'Karting', color: '#FF8A4C', rgb: '255,138,76', tabs: ['mmu', 'racing', 'societies', 'events'], tabNames: { mmu: 'MMU Karting', racing: 'My Racing', societies: 'Societies', events: 'Events' } },
  };

  const ICONS = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    modules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="8" height="8" rx="2"/><rect x="13" y="4" width="8" height="8" rx="2"/><rect x="3" y="14" width="8" height="8" rx="2"/><rect x="13" y="14" width="8" height="8" rx="2"/></svg>',
    deadlines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h6M9 17h6"/></svg>',
    shifts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 15h3"/></svg>',
    earnings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 19h16M6 15l4-5 4 3 4-6"/></svg>',
    requests: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 15l2 2 4-4"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    mmu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12l3-7h12l3 7M3 12v7h18v-7M3 12h18"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/></svg>',
    racing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20V4h11l-2 4 2 4H5"/></svg>',
    societies: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14c3 0 5.5 2 5.5 5"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    ring: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M4.5 9.5A8 8 0 0 1 11 4.06M13 4.06A8 8 0 0 1 19.5 9.5M18.5 17.5A8 8 0 0 1 5.5 17.5"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  };

  // ------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

  // ------------------------------------------------------------
  // Router (hash-based so GitHub Pages sub-path just works)
  // ------------------------------------------------------------
  const orbs = new Set();      // live orbs on the current screen
  let lastTap = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  document.addEventListener('pointerdown', e => { lastTap = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });

  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  window.addEventListener('hashchange', render);

  function parseRoute() {
    const h = (location.hash || '#/').replace(/^#\/?/, '');
    const [a, b] = h.split('/');
    if (!a) return { screen: 'ring' };
    if (a === 'eden') return { screen: 'eden' };
    if (a === 'settings') return { screen: 'settings' };
    if (SECTIONS[a]) return { screen: 'section', sec: a, tab: SECTIONS[a].tabs.includes(b) ? b : SECTIONS[a].tabs[0] };
    return { screen: 'ring' };
  }

  let current = null; // {screen, sec, tab, el}
  function render() {
    const r = parseRoute();
    const sameSection = current && current.screen === 'section' && r.screen === 'section' && current.sec === r.sec;
    // Section tab switches re-render the tab body only (no full transition)
    if (sameSection) { current.tab = r.tab; renderTabBody(current.el, r.sec, r.tab); updateHotbar(current.el, r.sec, r.tab); return; }

    // tear down old
    for (const o of orbs) o.destroy(); orbs.clear();
    const old = current && current.el;
    if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 260); }

    document.body.dataset.section = r.screen === 'section' ? r.sec : '';
    let el;
    if (r.screen === 'ring') el = renderRing();
    else if (r.screen === 'eden') el = renderEden();
    else if (r.screen === 'settings') el = renderSettings();
    else el = renderSection(r.sec, r.tab);
    el.style.setProperty('--ox', lastTap.x + 'px');
    el.style.setProperty('--oy', lastTap.y + 'px');
    app.appendChild(el);
    current = { ...r, el };
    if (r.screen === 'ring') { document.title = 'Iota'; }
    else if (r.screen === 'section') document.title = `${SECTIONS[r.sec].name} · Iota`;
    else document.title = (r.screen === 'eden' ? 'EDEN' : 'Settings') + ' · Iota';
  }

  // ------------------------------------------------------------
  // Orb helpers
  // ------------------------------------------------------------
  function mountOrb(canvas, opts) {
    const o = new EdenOrb(canvas, opts);
    o.setUrgency(Rules.urgency());
    if (Rules.urgency() > 0.05 && !opts.state) o.setState('aware');
    orbs.add(o); o.start();
    return o;
  }
  /** Tap → onTap; hold ≥450 ms → onHold. Pointer-based, no ghost clicks. */
  function pressable(el, onTap, onHold) {
    let timer = 0, held = false, downAt = null;
    el.addEventListener('pointerdown', e => {
      held = false; downAt = { x: e.clientX, y: e.clientY };
      el.setPointerCapture?.(e.pointerId);
      timer = setTimeout(() => { held = true; navigator.vibrate?.(12); onHold?.(e); }, 450);
    });
    const cancel = () => { clearTimeout(timer); };
    el.addEventListener('pointermove', e => { if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 12) cancel(); });
    el.addEventListener('pointerup', e => { cancel(); if (!held) onTap?.(e); downAt = null; });
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  // ------------------------------------------------------------
  // The Ring
  // ------------------------------------------------------------
  const RING = { cx: 200, cy: 200, rOut: 190, rIn: 126, gap: 10 };
  const ARCS = [
    { key: 'uni',  from: 155, to: 265 },   // top-left, sweeping clockwise from bottom-left up to top
    { key: 'work', from: -85, to: 25 },    // top-right
    { key: 'kart', from: 35,  to: 145 },   // bottom
  ];
  const pt = (r, deg) => { const a = deg * Math.PI / 180; return [RING.cx + r * Math.cos(a), RING.cy + r * Math.sin(a)]; };
  function annulus(a1, a2, rIn, rOut) {
    const [x1, y1] = pt(rOut, a1), [x2, y2] = pt(rOut, a2), [x3, y3] = pt(rIn, a2), [x4, y4] = pt(rIn, a1);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${rOut} ${rOut} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${x3.toFixed(2)} ${y3.toFixed(2)} A${rIn} ${rIn} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
  }
  function arcPath(a1, a2, r, reverse) {
    const [x1, y1] = pt(r, reverse ? a2 : a1), [x2, y2] = pt(r, reverse ? a1 : a2);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} ${reverse ? 0 : 1} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  function renderRing() {
    const el = document.createElement('section');
    el.className = 'screen ring-screen';
    const s = Store.settings;
    const next = { uni: Store.nextFor('uni'), work: Store.nextFor('work'), kart: Store.nextFor('kart') };
    const soonest = Store.upcoming()[0];
    const nextKey = soonest ? soonest.kind : null;

    const arcsSvg = ARCS.map((a, i) => {
      const S = SECTIONS[a.key];
      const mid = (a.from + a.to) / 2;
      const midR = (RING.rIn + RING.rOut) / 2;
      const labelPath = arcPath(a.from + 4, a.to - 4, midR - 4.5, a.key === 'kart');
      const label = a.key === 'kart' ? 'KARTING & SOCIETIES' : S.name.toUpperCase();
      return `
      <g class="arc ${nextKey === a.key ? 'next' : ''} breathe d${i}" data-sec="${a.key}" role="link" tabindex="0" aria-label="${esc(S.name)}">
        <path class="arc-glow" d="${annulus(a.from, a.to, RING.rIn, RING.rOut)}" fill="none" stroke="${S.color}" stroke-width="10" filter="url(#glow-${a.key})"/>
        <path class="arc-body" d="${annulus(a.from, a.to, RING.rIn, RING.rOut)}" fill="url(#g-${a.key})" stroke="url(#e-${a.key})" stroke-width="1.6"/>
        <path d="${arcPath(a.from + 1.5, a.to - 1.5, RING.rOut - 2.5)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2" opacity=".8"/>
        <path d="${arcPath(a.from + 1.5, a.to - 1.5, RING.rIn + 2.5)}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
        <path id="lp-${a.key}" d="${labelPath}" fill="none"/>
        <text class="arc-label"><textPath href="#lp-${a.key}" startOffset="50%" text-anchor="middle">${label}</textPath></text>
      </g>`;
    }).join('');

    const defs = Object.entries(SECTIONS).map(([k, S]) => `
      <radialGradient id="g-${k}" cx="200" cy="200" r="190" gradientUnits="userSpaceOnUse">
        <stop offset="62%" stop-color="${S.color}" stop-opacity=".10"/>
        <stop offset="80%" stop-color="${S.color}" stop-opacity=".22"/>
        <stop offset="100%" stop-color="${S.color}" stop-opacity=".45"/>
      </radialGradient>
      <linearGradient id="e-${k}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="${S.color}" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/>
      </linearGradient>
      <filter id="glow-${k}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>`).join('');

    const badges = ARCS.map(a => {
      const n = next[a.key]; if (!n) return '';
      const mid = (a.from + a.to) / 2, [x, y] = pt(RING.rOut + 22, mid);
      const label = `${Rules.fmtWhen(n.starts_at)} ${n.title}`;
      return `<div class="arc-badge" style="left:${x / 4}%;top:${y / 4}%;color:${SECTIONS[a.key].color}">${esc(label.length > 24 ? label.slice(0, 23) + '…' : label)}</div>`;
    }).join('');

    el.innerHTML = `
      <div class="ring-top">
        <div class="brand">IOTA</div>
        <button class="profile-chip" data-go="#/settings" aria-label="Settings">${ICONS.gear}</button>
      </div>
      <div class="ring-wrap">
        <svg class="ring-svg" viewBox="0 0 400 400" aria-hidden="false">
          <defs>${defs}</defs>
          ${arcsSvg}
        </svg>
        <button class="orb-home orb-btn" aria-label="Open EDEN (hold to quick-capture)"><canvas></canvas></button>
        ${badges}
      </div>
      <div class="ring-bottom">
        <div class="greeting">${esc(Rules.greeting())}</div>
        ${soonest ? `<div class="next-up glass"><span class="dot" style="color:${SECTIONS[soonest.kind]?.color || '#fff'};background:currentColor"></span><span class="lbl">Next up</span><span class="txt">${esc(Rules.fmtWhen(soonest.starts_at))} · ${esc(soonest.title)}</span></div>`
                 : `<div class="next-up glass"><span class="dot" style="color:var(--text-3);background:currentColor"></span><span class="lbl">Next up</span><span class="txt">Nothing captured yet — hold the orb to add something.</span></div>`}
        <div class="eden-line"><b>EDEN</b><span>${esc(Rules.observation())}</span></div>
      </div>`;

    // Orb
    const canvas = $('.orb-home canvas', el);
    mountOrb(canvas, { size: 200 });
    pressable($('.orb-home', el), () => go('#/eden'), () => openCapture());

    // Arcs
    el.querySelectorAll('.arc').forEach(g => {
      const key = g.dataset.sec;
      g.addEventListener('click', () => go(`#/${key}`));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(`#/${key}`); } });
    });
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    return el;
  }

  // ------------------------------------------------------------
  // Section pages + hotbar
  // ------------------------------------------------------------
  function renderSection(sec, tab) {
    const S = SECTIONS[sec];
    const el = document.createElement('section');
    el.className = 'screen section-screen';
    el.innerHTML = `
      <header class="section-head">
        <button class="btn icon ghost back" aria-label="Back to the Ring" data-go="#/">${ICONS.back}</button>
        <h1><span class="kicker">Section</span>${esc(S.name)}</h1>
        <button class="btn icon ghost" aria-label="Quick add" data-capture>${ICONS.plus}</button>
      </header>
      <div class="scroll" data-body></div>
      <nav class="hotbar" aria-label="${esc(S.name)} tabs">
        ${S.tabs.slice(0, 2).map(t => tabBtn(sec, t)).join('')}
        <div class="socket"><button class="mini orb-btn" aria-label="Back to the Ring (hold for EDEN)"><canvas></canvas></button></div>
        ${S.tabs.slice(2).map(t => tabBtn(sec, t)).join('')}
      </nav>`;
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $('[data-capture]', el).addEventListener('click', () => openCapture(sec));
    el.querySelectorAll('.hotbar .tab').forEach(b => b.addEventListener('click', () => go(`#/${sec}/${b.dataset.tab}`)));
    const mini = $('.socket .mini', el);
    mountOrb($('canvas', mini), { size: 46, calm: 1 });
    pressable(mini, () => go('#/'), () => go('#/eden'));
    renderTabBody(el, sec, tab);
    updateHotbar(el, sec, tab);
    return el;
  }
  function tabBtn(sec, t) { return `<button class="tab" data-tab="${t}" role="tab">${ICONS[t]}<span>${esc(SECTIONS[sec].tabNames[t])}</span></button>`; }
  function updateHotbar(el, sec, tab) { el.querySelectorAll('.hotbar .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); }

  function rowHTML(x, opts = {}) {
    const when = x.starts_at ? Rules.fmtWhen(x.starts_at) : (x.due ? Rules.fmtWhen(x.due) : '');
    const sub = x.location || (x.ends_at && x.starts_at ? `${new Date(x.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}–${new Date(x.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : (x.section ? x.section : ''));
    return `<div class="row" data-table="${x._table || opts.table}" data-id="${x.id}">
      <span class="bar" style="background:${SECTIONS[x.kind || x.section]?.color || 'var(--text-3)'}"></span>
      <div class="t"><b>${esc(x.title || x.text || '')}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
      ${when ? `<div class="when">${esc(when)}</div>` : ''}
      ${opts.deletable !== false ? `<button class="del" aria-label="Delete">${ICONS.trash}</button>` : ''}
    </div>`;
  }
  function empty(ico, title, text, action) {
    return `<div class="card empty"><div class="ico">${ico}</div><h3>${esc(title)}</h3><p>${text}</p>${action ? `<button class="btn" data-capture-hint="${esc(action.hint || '')}">${esc(action.label)}</button>` : ''}</div>`;
  }

  function renderTabBody(el, sec, tab) {
    const body = $('[data-body]', el);
    let html = '';
    const now = new Date();

    if (sec === 'uni') {
      if (tab === 'today') {
        const td = Store.today().filter(x => x.kind === 'uni' || x.isTask);
        html += `<div class="tab-title">${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>`;
        html += termProgress();
        const w = Rules.dueWatches(now, 7).filter(x => /timetable/i.test(x.text));
        if (w.length) html += `<div class="card"><h3>Watching</h3><p class="sub">${esc(w[0].text)} — ${esc(new Date(w[0].expected_by).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }))}</p></div>`;
        if (!td.length) html += empty('🎓', 'Nothing timetabled today', 'Your MMU timetable lands <b>Tuesday 18 Aug</b>. Until then, hold the orb to capture anything uni-shaped.', { label: 'Add something', hint: 'Lecture ' });
        else {
          html += '<div class="timeline">' + td.map(x => {
            const live = new Date(x.starts_at) <= now && now < new Date(x.ends_at || x.starts_at);
            return `<div class="tl-item ${live ? 'now' : ''}">${rowHTML(x)}</div>`;
          }).join('') + '</div>';
        }
      } else if (tab === 'modules') {
        const ms = Store.list('modules');
        html += `<div class="tab-title">Modules</div>`;
        html += ms.length ? `<div class="list">${ms.map(m => `<div class="row"><span class="bar" style="background:${esc(m.colour || 'var(--accent)')}"></span><div class="t"><b>${esc(m.code ? m.code + ' · ' : '')}${esc(m.name)}</b><span>${esc([m.lecturer, m.room, m.credits ? m.credits + ' credits' : ''].filter(Boolean).join(' · '))}</span></div></div>`).join('')}</div>`
                         : empty('📚', 'No modules yet', 'Module cards (code, lecturer, room, credits, notes and assessments inside) arrive with the timetable import in Phase 3.');
      } else if (tab === 'deadlines') {
        const tk = Store.tasks_open().filter(t => t.section === 'uni').sort((a, b) => new Date(a.due || 8e15) - new Date(b.due || 8e15));
        const as = Store.list('assessments').filter(a => a.status !== 'graded');
        html += `<div class="tab-title">Deadlines & tasks</div>`;
        const rows = [...as.map(a => rowHTML({ ...a, _table: 'assessments', kind: 'uni', starts_at: a.due_at, location: a.weight_pct ? `${a.weight_pct}% · ${a.status.replace('_', ' ')}` : a.status.replace('_', ' ') }, { deletable: false })), ...tk.map(t => rowHTML({ ...t, _table: 'tasks' }))];
        html += rows.length ? `<div class="list">${rows.join('')}</div>` : empty('⏳', 'No deadlines on file', 'Coursework with weightings, status pipeline and the grade calculator come in Phase 3. Capture anything due now and it will carry over.', { label: 'Add a deadline', hint: 'Essay due ' });
      } else if (tab === 'notes') {
        const ns = Store.list('notes').filter(n => n.section === 'uni');
        html += `<div class="tab-title">Notes</div>`;
        html += ns.length ? `<div class="list">${ns.map(n => rowHTML({ ...n, _table: 'notes', title: n.title || n.md, kind: 'uni', location: n.title ? n.md.slice(0, 80) : '' })).join('')}</div>` : empty('📝', 'No notes yet', 'Per-module markdown notes with search and revision mode arrive in Phase 3. Quick notes captured now are kept.', { label: 'Jot a note', hint: 'Note: ' });
      }
    }

    if (sec === 'work') {
      const s = Store.settings;
      const shifts = Store.list('shifts').filter(x => x.status !== 'cancelled').sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const up = shifts.filter(x => new Date(x.ends_at) >= now);
      const rate = +s.rateHourly;
      const shiftRow = x => rowHTML({ ...x, _table: 'shifts', kind: 'work', title: x.role ? `Shift · ${x.role}` : 'Shift', location: `${Rules.fmtRange(x.starts_at, x.ends_at)}${rate ? ' · ≈ £' + Rules.payEstimate([x]).gross.toFixed(0) : ''}${x.location ? ' · ' + x.location : ''}` });
      if (tab === 'shifts') {
        html += `<div class="tab-title">Upcoming shifts</div>`;
        html += up.length ? `<div class="list">${up.map(shiftRow).join('')}</div>` : empty('🕔', 'No shifts yet', `Tell Claude your rota in chat and it lands here within the minute, or hold the orb: <i>"Shift Sat 12–8"</i>.`, { label: 'Add a shift', hint: 'Shift ' });
        const past = shifts.filter(x => new Date(x.ends_at) < now).reverse().slice(0, 6);
        if (past.length) html += `<div class="tab-title" style="margin-top:18px">Recent</div><div class="list">${past.map(shiftRow).join('')}</div>`;
      } else if (tab === 'earnings') {
        const last = Rules.lastPayday(now), next = Rules.nextPayday(now);
        const period = last ? shifts.filter(x => new Date(x.starts_at) >= last && new Date(x.starts_at) < now) : shifts.filter(x => new Date(x.starts_at).getMonth() === now.getMonth() && new Date(x.ends_at) < now);
        const booked = shifts.filter(x => new Date(x.starts_at) >= now && (!next || new Date(x.starts_at) < next));
        const pe = Rules.payEstimate(period), be = Rules.payEstimate(booked);
        html += `<div class="tab-title">${last ? 'Since last payday' : now.toLocaleDateString('en-GB', { month: 'long' })}</div>`;
        html += `<div class="stat-row">
          <div class="stat card"><div class="k">Shifts worked</div><div class="v">${period.length}</div></div>
          <div class="stat card"><div class="k">Hours</div><div class="v">${pe.hours.toFixed(1)}<small>h</small></div></div>
          <div class="stat card"><div class="k">Earned so far</div><div class="v">${rate ? '£' + pe.gross.toFixed(0) : '—'}</div></div>
          <div class="stat card"><div class="k">Booked to payday</div><div class="v">${rate ? '£' + be.gross.toFixed(0) : '—'}<small>${booked.length ? booked.length + ' shift' + (booked.length === 1 ? '' : 's') : ''}</small></div></div>
        </div>`;
        html += paydayCard(now);
        if (rate) html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>Rate</span><b style="color:var(--text)">£${rate.toFixed(2)}/h</b></div><div class="sub" style="display:flex;justify-content:space-between;margin-top:6px"><span>Pay</span><b style="color:var(--text)">${esc(s.payFrequency || '')}${s.payAnchor ? ' · Thursdays' : ''}</b></div><p class="sub" style="margin-top:10px">Gross estimates. Student income under the personal allowance means little or no tax — payslip reconcile arrives with the Payday Plan.</p></div>`;
        else html += `<div class="card"><h3>Set your hourly rate</h3><p class="sub">Earnings, projections and the Payday Plan all hang off it.</p><button class="btn" data-go="#/settings" style="margin-top:12px">Open settings</button></div>`;
      } else if (tab === 'requests') {
        html += `<div class="tab-title">Availability & requests</div>` + empty('🗓️', 'Nothing tracked yet', 'Availability, holiday requests and swap notes — clash-aware against lectures — arrive next. <b>"Can you do Friday?"</b> gets a yes / no / risky answer from EDEN.');
      } else if (tab === 'info') {
        const rates = Store.list('pay_rates');
        html += `<div class="tab-title">Work info</div>
          <div class="card"><h3>${esc(s.employer || 'Employer')}</h3>
            ${s.workAddress ? `<p class="sub">${esc(s.workAddress)}</p>` : ''}
            <p class="sub" style="margin-top:6px">${s.travelWorkMin ? `${esc(String(s.travelWorkMin))} min ${esc(s.travelMode || 'walk')} from home` : ''}${s.homeAddress ? ` · ${esc(s.homeAddress)}` : ''}</p>
          </div>
          <div class="card"><h3>Pay</h3>
            <div class="sub" style="display:flex;justify-content:space-between"><span>Rate</span><b style="color:var(--text)">${rate ? '£' + rate.toFixed(2) + '/h' : '—'}</b></div>
            <div class="sub" style="display:flex;justify-content:space-between;margin-top:6px"><span>Frequency</span><b style="color:var(--text)">${esc(s.payFrequency || '—')}</b></div>
            ${s.payAnchor ? `<div class="sub" style="display:flex;justify-content:space-between;margin-top:6px"><span>Anchor payday</span><b style="color:var(--text)">${esc(new Date(s.payAnchor + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))}</b></div>` : ''}
            ${rates.length ? `<div class="sub" style="margin-top:10px">Rate history</div><div class="list" style="margin-top:6px">${rates.map(r => `<div class="row"><div class="t"><b>£${(+r.hourly).toFixed(2)}/h</b><span>${esc(r.role || '')}${r.role ? ' · ' : ''}from ${esc(new Date(r.effective_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</span></div></div>`).join('')}</div>` : ''}
          </div>
          <div class="card"><h3>Kit & contacts</h3><p class="sub">Uniform reminders, manager contact and "what to bring" — capture them as notes for now (<i>Note: work — …</i>).</p></div>
          <button class="btn ghost" data-go="#/settings">Edit in settings</button>`;
      }
    }

    if (sec === 'kart') {
      if (tab === 'mmu') {
        html += `<div class="tab-title">MMU Karting Society</div>
        <div class="card"><h3>Society hub</h3><p class="sub">Dashboard, events, membership tiers, committee contacts and the committee-only finance view — ported natively into Iota in Phase 4, reading the same Supabase tables. Until then, the live app is one tap away.</p>
        <a class="btn" href="https://magicjoynson.github.io/mmu-karting/" target="_blank" rel="noopener" style="margin-top:12px">Open MMU Karting ↗</a></div>`;
      } else if (tab === 'racing') {
        html += `<div class="tab-title">My Racing</div>` + empty('🏁', 'No sessions logged', 'Lap log, PB detection, the consistency analyser and the Track Playbook arrive in Phase 4. Hold the orb after a session to leave yourself a note in the meantime.', { label: 'Debrief note', hint: 'Note: track — ' });
        const s = Store.settings;
        if (s.trackAddress) html += `<div class="card"><h3>Victoria Karting</h3><p class="sub">${esc(s.trackAddress)} · ${esc(String(s.travelTrackMin || ''))} min ${esc(s.travelMode || 'walk')}${s.loadingMin ? ` + ${esc(String(s.loadingMin))} min loading on race days` : ''}</p></div>`;
      } else if (tab === 'societies') {
        const socs = Store.list('societies');
        html += `<div class="tab-title">Societies</div>`;
        html += socs.length ? socs.map(so => `<div class="card"><h3>${esc(so.name)} <span class="pill" ${so.status === 'prospective' ? 'style="background:rgba(255,255,255,.08);color:var(--text-2)"' : ''}>${esc(so.status)}</span></h3>${so.role ? `<p class="sub">${esc(so.role)}</p>` : ''}${so.notes ? `<p class="sub" style="margin-top:4px">${esc(so.notes)}</p>` : ''}${(so.links || []).map(l => `<a class="chip accent" style="margin-top:10px" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join(' ')}</div>`).join('')
                           : empty('✨', 'No societies yet', 'Cards for any society — schedule, renewals, role duties, links.');
        html += `<p class="field-note" style="padding:0 4px">Freshers' Fair 29–30 Sept — we'll update this list after.</p>`;
      } else if (tab === 'events') {
        const ev = Store.upcoming(now, 50).filter(x => x.kind === 'kart');
        html += `<div class="tab-title">Upcoming</div>`;
        html += ev.length ? `<div class="list">${ev.map(x => rowHTML(x)).join('')}</div>` : empty('🏎️', 'No karting events captured', 'Society events sync from the karting tables in Phase 4. Personal ones — practice, BUKC rounds — can be captured now.', { label: 'Add an event', hint: 'Karting ' });
      }
    }

    body.innerHTML = html;
    body.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    body.querySelectorAll('[data-capture-hint]').forEach(b => b.addEventListener('click', () => openCapture(sec, b.dataset.captureHint)));
    body.querySelectorAll('.row .del').forEach(b => b.addEventListener('click', e => {
      const row = e.currentTarget.closest('.row');
      Store.remove(row.dataset.table, row.dataset.id); toast('Removed'); renderTabBody(el, sec, tab);
    }));
  }

  function termProgress() {
    const s = Store.settings; if (!s.termStart) return '';
    const start = new Date(s.termStart), weeks = +s.termWeeks || 12;
    const wk = Math.floor((Date.now() - start) / (7 * 86400000)) + 1;
    if (wk < 1 || wk > weeks) return '';
    return `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>Semester</span><b style="color:var(--text)">Week ${wk} of ${weeks}</b></div>
      <div style="height:6px;border-radius:6px;background:rgba(255,255,255,.08);margin-top:10px;overflow:hidden"><div style="height:100%;width:${(wk / weeks * 100).toFixed(0)}%;background:var(--accent);border-radius:6px"></div></div></div>`;
  }
  function paydayCard(now) {
    const d = Rules.nextPayday(now); if (!d) return '';
    const days = Math.ceil((d - now) / 86400000);
    return `<div class="card"><div class="sub">Payday</div><div class="big-num">${days}<span style="font-size:16px;color:var(--text-2);margin-left:6px">day${days === 1 ? '' : 's'}</span></div><div class="sub" style="margin-top:4px">${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>`;
  }

  // ------------------------------------------------------------
  // EDEN chat
  // ------------------------------------------------------------
  const CHIPS = [['Today', 'What\'s on today?'], ['This week', 'How does this week look?'], ['Deadlines', 'Any deadlines?'], ['Add something', '__capture'], ['How\'s my money looking?', 'How\'s my money looking?']];
  function renderEden() {
    const el = document.createElement('section');
    el.className = 'screen eden-screen';
    el.innerHTML = `
      <div class="eden-head">
        <button class="btn icon ghost eden-back" aria-label="Back to the Ring" data-go="#/">${ICONS.back}</button>
        <div class="orb-mid"><canvas></canvas></div>
        <div class="name">EDEN</div>
        <div class="state" data-state>rules mode</div>
      </div>
      <div class="thread" data-thread></div>
      <div class="chips">${CHIPS.map(c => `<button class="chip" data-q="${esc(c[1])}">${esc(c[0])}</button>`).join('')}</div>
      <form class="composer glass" data-composer>
        <textarea rows="1" placeholder="Ask EDEN…" aria-label="Message EDEN"></textarea>
        <button class="send" type="submit" aria-label="Send">${ICONS.send}</button>
      </form>`;
    const canvas = $('.orb-mid canvas', el);
    let orb;
    orb = mountOrb(canvas, { size: 104 }); orb.setLeanTarget(0, 1);
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const thread = $('[data-thread]', el), ta = $('textarea', el), form = $('[data-composer]', el);
    const bubble = (who, text, meta) => {
      const m = document.createElement('div'); m.className = 'msg ' + who;
      m.innerHTML = esc(text) + (meta ? `<span class="meta">${esc(meta)}</span>` : '');
      thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m;
    };
    const setState = (s, label) => { orb?.setState(s); $('[data-state]', el).textContent = label; };
    // opening line
    setTimeout(() => { bubble('eden', Rules.observation()); orb?.ripple(); const b = Store.list('briefings')[0]; if (b && b.date === new Date().toISOString().slice(0, 10)) setTimeout(() => { bubble('eden', b.md, b.kind + ' briefing'); orb?.ripple(); }, 500); const w = Rules.dueWatches(new Date(), 3); if (w.length) setTimeout(() => { bubble('eden', 'Watching: ' + w.map(x => x.text).join(' · ') + '.', 'promise watcher'); }, b ? 900 : 500); }, 250);

    ta.addEventListener('focus', () => setState('listening', 'listening'));
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });
    ta.addEventListener('blur', () => setState(Rules.urgency() > .05 ? 'aware' : 'idle', 'rules mode'));
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

    async function ask(q) {
      if (!q.trim()) return;
      bubble('me', q);
      setState('thinking', 'thinking');
      await new Promise(r => setTimeout(r, 420 + Math.random() * 300));
      const a = Rules.answer(q);
      setState('speaking', 'rules mode'); orb?.ripple();
      if (a) bubble('eden', a);
      else {
        const m = bubble('eden', 'That one\'s above my offline pay grade. Copy the prompt and ask me properly in Claude — I\'ll be there — or capture it and I\'ll file it.', 'live answers arrive in Phase 5');
        const acts = document.createElement('div'); acts.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
        acts.innerHTML = `<button class="chip accent" data-act="prompt">Ask me properly →</button><button class="chip" data-act="capture">Capture it</button>`;
        m.appendChild(acts);
        $('[data-act=prompt]', acts).addEventListener('click', async () => {
          const prompt = `You are EDEN, the assistant inside Alex's Iota app. Context: ${Store.upcoming().slice(0, 8).map(x => `${x.title} @ ${new Date(x.starts_at).toLocaleString('en-GB')}`).join('; ') || 'nothing scheduled'}. Open tasks: ${Store.tasks_open().map(t => t.title).join('; ') || 'none'}.\n\nAlex asks: ${q}`;
          try { await navigator.clipboard.writeText(prompt); toast('Prompt copied — paste it into Claude'); } catch (_) { toast('Could not copy'); }
        });
        $('[data-act=capture]', acts).addEventListener('click', () => openCapture(null, q));
      }
      setTimeout(() => setState(Rules.urgency() > .05 ? 'aware' : 'idle', 'rules mode'), 1400);
    }
    form.addEventListener('submit', e => { e.preventDefault(); const q = ta.value; ta.value = ''; ta.style.height = 'auto'; ask(q); });
    el.querySelectorAll('.chips .chip').forEach(c => c.addEventListener('click', () => { const q = c.dataset.q; if (q === '__capture') openCapture(); else ask(q); }));
    return el;
  }

  // ------------------------------------------------------------
  // Settings
  // ------------------------------------------------------------
  function renderSettings() {
    const el = document.createElement('section');
    el.className = 'screen settings-screen';
    const s = Store.settings;
    const f = (k, label, type = 'text', extra = '') => `<div><label for="f-${k}">${label}</label><input id="f-${k}" data-k="${k}" type="${type}" value="${esc(s[k] ?? '')}" ${extra}></div>`;
    const sel = (k, label, opts) => `<div><label for="f-${k}">${label}</label><select id="f-${k}" data-k="${k}">${opts.map(o => `<option value="${o[0]}" ${s[k] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
    const one = a => `<div class="field">${a}</div>`;
    const two = (a, b) => `<div class="field"><div class="row2">${a}${b}</div></div>`;
    const synced = Store.syncedAt ? new Date(Store.syncedAt).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : 'never';
    el.innerHTML = `
      <header class="section-head">
        <button class="btn icon ghost back" aria-label="Back" data-go="#/">${ICONS.back}</button>
        <h1><span class="kicker">Iota</span>Settings</h1>
      </header>
      <div class="scroll" style="padding-bottom:40px">
        <div class="setting-group"><h3>Account</h3>
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div><b>${esc(SB.user?.email || 'Not signed in')}</b><br><span class="sub">Synced ${esc(synced)}${Store.pending ? ` · ${Store.pending} pending` : ''}</span></div>
            <div style="display:flex;gap:8px"><button class="btn ghost" data-sync>Sync</button><button class="btn ghost" data-signout style="color:var(--danger)">Sign out</button></div>
          </div>
        </div>
        <div class="setting-group"><h3>You</h3>${one(f('name', 'Name'))}${one(f('homeAddress', 'Home'))}</div>
        <div class="setting-group"><h3>Work</h3>
          ${one(f('employer', 'Employer'))}
          ${one(f('workAddress', 'Work address'))}
          ${two(f('rateHourly', 'Hourly rate (£)', 'number', 'step="0.01" inputmode="decimal"'), sel('payFrequency', 'Paid', [['fortnightly', 'Fortnightly'], ['weekly', 'Weekly'], ['monthly', 'Monthly']]))}
          ${two(f('payAnchor', 'A recent payday (weekly/fortnightly)', 'date'), f('payDayOfMonth', 'Day of month (monthly)', 'number', 'min="1" max="31" inputmode="numeric"'))}
        </div>
        <div class="setting-group"><h3>Places & travel</h3>
          ${one(f('campusAddress', 'Campus'))}
          ${one(f('trackAddress', 'Track'))}
          ${two(sel('travelMode', 'Usual mode', [['walk', 'Walk'], ['bus', 'Bus'], ['cycle', 'Cycle'], ['drive', 'Drive']]), f('loadingMin', 'Loading time (race days, min)', 'number'))}
          ${two(f('travelCampusMin', 'To campus (min)', 'number'), f('travelWorkMin', 'To work (min)', 'number'))}
          ${one(f('travelTrackMin', 'To the track (min)', 'number'))}
          <p class="field-note">EDEN's "leave by" nudges are event start minus these.</p>
        </div>
        <div class="setting-group"><h3>Term dates</h3>
          ${two(f('termStart', 'Term starts', 'date'), f('termWeeks', 'Weeks', 'number'))}
        </div>
        <div class="setting-group"><h3>Appearance</h3>
          <div class="field"><label for="f-auroraIntensity">Aurora intensity</label><input id="f-auroraIntensity" data-k="auroraIntensity" type="range" min="0.2" max="1" step="0.05" value="${s.auroraIntensity}"></div>
          <div class="field"><label style="display:flex;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" data-k="reduceMotion" ${s.reduceMotion ? 'checked' : ''} style="width:20px;height:20px"> Reduce motion (freezes aurora & breathing; orb goes still)</label></div>
        </div>
        <div class="setting-group"><h3>EDEN · Layer 3 (optional)</h3>
          ${one(f('apiKey', 'Anthropic API key', 'password', 'autocomplete="off" placeholder="sk-ant-… (stays on this device)"'))}
          <p class="field-note">Off by default. Live answers land in Phase 5; the key never leaves this browser's localStorage.</p>
        </div>
        <div class="setting-group"><h3>Data</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" data-export>Export JSON</button>
            <button class="btn ghost" data-reset style="color:var(--danger)">Clear local cache</button>
          </div>
          <p class="field-note">Everything lives in the <code>iota</code> schema in Supabase, locked to your account. This device keeps a cached copy for offline reads; offline writes queue and sync when you're back.</p>
        </div>
        <div class="setting-group"><h3>About</h3>
          <div class="card" style="display:flex;gap:14px;align-items:center"><img src="./assets/brand-512.png" alt="" width="64" height="64" style="border-radius:16px"><div><b>Iota</b> · v0.2<br><span class="sub">The smallest thing that runs everything. EDEN at the centre — she's the friend who happens to run your life.</span></div></div>
        </div>
      </div>`;
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    el.querySelectorAll('[data-k]').forEach(inp => {
      const ev = inp.type === 'range' || inp.type === 'checkbox' ? 'input' : 'change';
      inp.addEventListener(ev, () => {
        let v = inp.type === 'checkbox' ? inp.checked : inp.value;
        if (inp.type === 'number' && v !== '') v = +v;
        if (inp.type === 'range') v = +v;
        Store.setSetting(inp.dataset.k, v); applyAppearance();
      });
    });
    $('[data-export]', el).addEventListener('click', async () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `iota-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $('[data-reset]', el).addEventListener('click', () => { if (confirm('Clear the cached copy on this device? (Your data in Supabase is untouched.)')) { Store.clearLocal(); toast('Local cache cleared'); Store.sync().then(() => render()); } });
    $('[data-sync]', el).addEventListener('click', async () => { toast('Syncing…'); const ok = await Store.sync(); toast(ok ? 'Synced' : 'Sync failed'); render(); });
    $('[data-signout]', el).addEventListener('click', async () => { await SB.signOut(); Store.clearLocal(); location.hash = '#/'; boot(); });
    return el;
  }
  function applyAppearance() {
    const s = Store.settings;
    document.documentElement.style.setProperty('--aurora-intensity', s.auroraIntensity);
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
  }

  // ------------------------------------------------------------
  // Quick capture (long-press orb anywhere)
  // ------------------------------------------------------------
  const cap = $('#capture'), capForm = $('#captureForm'), capInput = $('#captureInput'), capHint = $('#captureHint');
  let capSection = null;
  function openCapture(section = null, prefill = '') {
    capSection = section; cap.hidden = false; capInput.value = prefill; capHint.textContent = 'EDEN will file it as a task, event, shift or note.';
    setTimeout(() => { capInput.focus(); capInput.setSelectionRange(capInput.value.length, capInput.value.length); }, 60);
  }
  function closeCapture() { cap.hidden = true; capInput.blur(); }
  cap.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeCapture(); });
  capInput.addEventListener('input', () => {
    const t = capInput.value.trim(); if (!t) { capHint.textContent = 'EDEN will file it as a task, event, shift or note.'; return; }
    const c = Rules.classify(t);
    const when = c.row.starts_at || c.row.due;
    capHint.textContent = `→ ${c.label}${when ? ' · ' + Rules.fmtWhen(when) : ''}${c.row.kind || c.row.section ? ' · ' + (SECTIONS[c.row.kind || c.row.section]?.name || 'personal') : ''}`;
  });
  capInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); capForm.requestSubmit(); } if (e.key === 'Escape') closeCapture(); });
  capForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = capInput.value.trim(); if (!text) return;
    const c = Rules.classify(text);
    // if opened from a section and the classifier picked "personal", bias to that section
    if (capSection && (c.row.kind === 'personal' || c.row.section === 'personal')) { if ('kind' in c.row) c.row.kind = capSection; if ('section' in c.row) c.row.section = capSection; }
    const row = Store.insert(c.table, c.row);
    Store.insert('captures', { text, filed_as: c.table, row_id: row.id });
    closeCapture();
    toast(`Filed as ${c.label}${c.row.starts_at || c.row.due ? ' · ' + Rules.fmtWhen(c.row.starts_at || c.row.due) : ''}`);
    render();
  });

  // ------------------------------------------------------------
  // Login
  // ------------------------------------------------------------
  function renderLogin() {
    const el = document.createElement('section');
    el.className = 'screen login-screen';
    el.innerHTML = `
      <div class="login-wrap">
        <div class="login-orb"><canvas></canvas></div>
        <div class="brand" style="font-family:var(--font-display);font-weight:300;letter-spacing:.42em;font-size:16px;color:var(--text-2);padding-left:.42em;text-align:center;margin-top:10px">IOTA</div>
        <form class="glass login-card" autocomplete="on">
          <h2>Sign in</h2>
          <p class="sub">Same account as the MMU Karting app.</p>
          <div class="field"><label for="li-email">Email</label><input id="li-email" name="email" type="email" inputmode="email" autocomplete="username" required></div>
          <div class="field"><label for="li-pass">Password</label><input id="li-pass" name="password" type="password" autocomplete="current-password" required></div>
          <div class="login-err" data-err hidden></div>
          <button class="btn primary" type="submit" style="width:100%">Continue</button>
        </form>
      </div>`;
    mountOrb($('.login-orb canvas', el), { size: 120 });
    const form = $('form', el), err = $('[data-err]', el);
    try { const last = localStorage.getItem('iota.lastEmail'); if (last) $('#li-email', el).value = last; } catch (_) {}
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true;
      const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        await SB.signIn($('#li-email', el).value.trim(), $('#li-pass', el).value);
        try { localStorage.setItem('iota.lastEmail', $('#li-email', el).value.trim()); } catch (_) {}
        await Store.sync();
        boot();
      } catch (ex) { err.textContent = ex.message || 'Could not sign in'; err.hidden = false; btn.disabled = false; btn.textContent = 'Continue'; }
    });
    return el;
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  const refreshOrbs = () => { for (const o of orbs) { o.setUrgency(Rules.urgency()); if (o.state === 'idle' || o.state === 'aware') o.setState(Rules.urgency() > .05 ? 'aware' : 'idle'); } };
  Store.on(type => { refreshOrbs(); if (type === 'sync' && current && current.screen !== 'eden') render(); if (type === 'error' && Store.lastError) toast('Sync problem: ' + Store.lastError); });
  applyAppearance();

  function boot() {
    for (const o of orbs) o.destroy(); orbs.clear();
    app.innerHTML = ''; current = null;
    if (!SB.session) { app.appendChild(renderLogin()); return; }
    render();
    Store.sync().then(ok => { if (!ok && !Store.syncedAt) toast('Offline — showing cached data'); });
  }
  boot();
  SB.onAuth(s => { if (!s && current !== null) { toast('Signed out — please sign in again'); boot(); } });
  // Splash: hold the brand art for a beat, then reveal
  setTimeout(() => $('#splash').classList.add('gone'), sessionStorage.getItem('iota.booted') ? 150 : 1100);
  sessionStorage.setItem('iota.booted', '1');
  // Re-evaluate urgency every minute (drives orb 'aware' + Ring badges); resync every 5 min when visible
  setInterval(() => { refreshOrbs(); if (current?.screen === 'ring') render(); }, 60000);
  setInterval(() => { if (!document.hidden && SB.session) Store.sync(); }, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && SB.session && Store.syncedAt && Date.now() - new Date(Store.syncedAt) > 60000) Store.sync(); });
  // PWA
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
