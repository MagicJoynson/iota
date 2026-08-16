/* ============================================================
   IOTA — app shell (Phase 1)
   Router · Ring · sections + hotbar · EDEN · settings · capture
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  /** Tiny safe markdown for chat bubbles: bold, italic, code, links, dash lists, line breaks. HTML is escaped first. */
  function md(src) {
    let t = esc(src || '');
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\w)/g, '$1<i>$2</i>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>');
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

  const SECTIONS = {
    uni:  { name: 'University', color: '#8B7CFF', rgb: '139,124,255', tabs: ['today', 'modules', 'deadlines', 'societies'], tabNames: { today: 'Today', modules: 'Modules', deadlines: 'Deadlines', societies: 'Societies' } },
    work: { name: 'Work', color: '#2DD4BF', rgb: '45,212,191', tabs: ['shifts', 'earnings', 'requests', 'info'], tabNames: { shifts: 'Shifts', earnings: 'Earnings', requests: 'Time off', info: 'Info' } },
    personal: { name: 'Personal', color: '#FF8A4C', rgb: '255,138,76', tabs: ['week', 'money', 'admin', 'targets'], tabNames: { week: 'Week', money: 'Money', admin: 'Admin', targets: 'Targets' } },
  };
  // v2: University tabs Today · Modules · Deadlines · Societies; the old Karting arc became Personal (Week · Money · Admin · Targets).
  // Society accents are their own hues (never the arc hues); events of kind 'kart' belong to the MMU Karting society (inside University).
  const KART_FALLBACK = '#4DA3FF';
  const isKartSoc = so => /kart/i.test(so.name || '');
  const kartSociety = () => Store.list('societies').find(isKartSoc) || null;
  const socColor = so => so?.colour || (so && isKartSoc(so) ? KART_FALLBACK : '#C7CBE0');
  /** Colour for an item kind: arc hue, or the karting society's accent for kind 'kart'. */
  function kindColor(k) { if (k === 'kart') return socColor(kartSociety()) || KART_FALLBACK; return SECTIONS[k]?.color || '#C7CBE0'; }
  function kindName(k) { if (k === 'kart') return kartSociety()?.name || 'Karting'; return SECTIONS[k]?.name || 'Personal'; }
  const hexRgb = h => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h || ''); return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : '199,203,224'; };

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
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M7 14h3M12 14h5M7 18h5"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 11h18"/></svg>',
    targets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
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
    // v2 redirects: the unified calendar lives in Personal › Week; the old Karting arc lives in University › Societies.
    if (a === 'calendar') { if (b === 'grid' || b === 'list') { calState.view = b; saveCal(); } return { screen: 'redirect', to: '#/personal/week' }; }
    if (a === 'kart') return { screen: 'redirect', to: '#/uni/societies' };
    if (a === 'society' && b) return { screen: 'society', id: b };
    if (a === 'module' && b) return { screen: 'module', id: b };
    if (SECTIONS[a]) return { screen: 'section', sec: a, tab: SECTIONS[a].tabs.includes(b) ? b : SECTIONS[a].tabs[0] };
    return { screen: 'ring' };
  }

  let current = null; // {screen, sec, tab, el}
  function render() {
    const r = parseRoute();
    if (r.screen === 'redirect') { history.replaceState(null, '', r.to); render(); return; }
    const sameSection = current && current.screen === 'section' && r.screen === 'section' && current.sec === r.sec;
    // Section tab switches re-render the tab body only (no full transition)
    if (sameSection) { current.tab = r.tab; renderTabBody(current.el, r.sec, r.tab); updateHotbar(current.el, r.sec, r.tab); return; }

    // tear down old
    for (const o of orbs) o.destroy(); orbs.clear();
    const old = current && current.el;
    if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 260); }

    document.body.dataset.section = r.screen === 'section' ? r.sec : (r.screen === 'society' || r.screen === 'module') ? 'uni' : '';
    document.body.dataset.screen = r.screen;
    document.body.style.removeProperty('--accent'); document.body.style.removeProperty('--accent-rgb');
    let el;
    if (r.screen === 'ring') el = renderRing();
    else if (r.screen === 'eden') el = renderEden();
    else if (r.screen === 'settings') el = renderSettings();
    else if (r.screen === 'society') el = renderSociety(r.id);
    else if (r.screen === 'module') el = renderModule(r.id);
    else el = renderSection(r.sec, r.tab);
    el.style.setProperty('--ox', lastTap.x + 'px');
    el.style.setProperty('--oy', lastTap.y + 'px');
    app.appendChild(el);
    current = { ...r, el };
    if (r.screen === 'ring') { document.title = 'Iota'; }
    else if (r.screen === 'section') document.title = `${SECTIONS[r.sec].name} · Iota`;
    else if (r.screen === 'society') document.title = `${Store.get('societies', r.id)?.name || 'Society'} · Iota`;
    else if (r.screen === 'module') document.title = `${Store.get('modules', r.id)?.name || 'Module'} · Iota`;
    else document.title = (r.screen === 'eden' ? 'EDEN' : 'Settings') + ' · Iota';
  }
  /** Tint the current screen with a society/module accent (body-level so hotbar, pills, kicker all follow). */
  function tint(hex) { if (!hex) return; document.body.style.setProperty('--accent', hex); document.body.style.setProperty('--accent-rgb', hexRgb(hex)); }

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
    { key: 'personal', from: 35,  to: 145 },   // bottom
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
    const soonest = Store.upcoming()[0];
    const nextKey = soonest ? (soonest.kind === 'kart' ? 'uni' : soonest.kind) : null;

    const arcsSvg = ARCS.map((a, i) => {
      const S = SECTIONS[a.key];
      const midR = (RING.rIn + RING.rOut) / 2;
      const labelPath = arcPath(a.from + 4, a.to - 4, midR - 4.5, a.key === 'personal');
      const label = S.name.toUpperCase();
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
      </div>
      <div class="ring-bottom">
        <div class="greeting">${esc(Rules.greeting())}</div>
        ${soonest ? `<button class="next-up glass" data-go="#/personal/week" aria-label="Open your week"><span class="dot" style="color:${kindColor(soonest.kind)};background:currentColor"></span><span class="lbl">Next up</span><span class="txt">${esc(Rules.fmtWhen(soonest.starts_at))} · ${esc(soonest.title)}</span><span class="chev">›</span></button>`
                 : `<button class="next-up glass" data-go="#/personal/week" aria-label="Open your week"><span class="dot" style="color:var(--text-3);background:currentColor"></span><span class="lbl">Next up</span><span class="txt">Nothing coming up — open your week or hold the orb.</span><span class="chev">›</span></button>`}
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
      <span class="bar" style="background:${x.kind || x.section ? kindColor(x.kind || x.section) : 'var(--text-3)'}"></span>
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
        const notes = Store.list('notes').filter(n => n.section === 'uni');
        const orphan = notes.filter(n => !n.module_id || !ms.some(m => m.id === n.module_id));
        html += `<div class="tab-title">Modules</div>`;
        html += `<label class="search glass"><span>${ICONS.search}</span><input type="search" data-note-search placeholder="Search notes across every module" autocomplete="off"></label><div data-note-results></div>`;
        html += ms.length ? `<div class="list">${ms.map(m => {
          const n = notes.filter(x => x.module_id === m.id).length, a = Store.list('assessments').filter(x => x.module_id === m.id && x.status !== 'graded').length;
          return `<button class="row link" data-go="#/module/${m.id}"><span class="bar" style="background:${esc(m.colour || 'var(--accent)')}"></span><div class="t"><b>${esc(m.code ? m.code + ' · ' : '')}${esc(m.name)}</b><span>${esc([m.lecturer, m.credits ? m.credits + ' credits' : '', n ? n + ' note' + (n === 1 ? '' : 's') : '', a ? a + ' open assessment' + (a === 1 ? '' : 's') : ''].filter(Boolean).join(' · ') || 'Tap to open the hub')}</span></div><span class="chev">›</span></button>`;
        }).join('')}</div>`
                         : empty('📚', 'No modules yet', 'Each module gets its own hub — info, sessions, assessments and notes in one place. They arrive with the timetable on <b>Tuesday 18 Aug</b>; tell EDEN a module and she creates it.', { label: 'Jot a note meanwhile', hint: 'Note: ' });
        if (orphan.length) html += `<div class="tab-title" style="margin-top:18px">Unfiled notes</div><div class="list">${orphan.map(n => rowHTML({ ...n, _table: 'notes', title: n.title || n.md, kind: 'uni', location: n.title ? n.md.slice(0, 80) : '' })).join('')}</div><p class="field-note" style="padding:8px 4px 0">Notes without a module. Once modules exist, open a hub and file them there.</p>`;
      } else if (tab === 'societies') {
        const socs = Store.list('societies');
        html += `<div class="tab-title">Societies</div>`;
        html += socs.length ? `<div class="list">${socs.map(so => {
          const col = socColor(so);
          const nx = isKartSoc(so) ? Store.nextFor('kart') : null;
          const role = so.status === 'committee' ? (so.role || 'Committee') : so.status;
          return `<button class="row link soc" data-go="#/society/${so.id}" style="--k:${col}"><span class="dot"></span><div class="t"><b>${esc(so.name)}</b><span>${nx ? `Next: ${esc(Rules.fmtWhen(nx.starts_at))} · ${esc(nx.title)}` : esc(so.notes || '')}</span></div><span class="pill" style="background:color-mix(in srgb, ${col} 18%, transparent);color:${col}">${esc(role)}</span><span class="chev">›</span></button>`;
        }).join('')}</div>` : empty('✨', 'No societies yet', 'Each society becomes a card that opens into its own mini-hub — events, membership, role duties, links, notes.');
        html += `<p class="field-note" style="padding:10px 4px 0">Freshers' Fair 29–30 Sept — football and badminton get looked at then. Society events show in your Week in each society's colour.</p>`;
      } else if (tab === 'deadlines') {
        const tk = Store.tasks_open().filter(t => t.section === 'uni').sort((a, b) => new Date(a.due || 8e15) - new Date(b.due || 8e15));
        const as = Store.list('assessments').filter(a => a.status !== 'graded');
        html += `<div class="tab-title">Deadlines & tasks</div>`;
        const rows = [...as.map(a => rowHTML({ ...a, _table: 'assessments', kind: 'uni', starts_at: a.due_at, location: a.weight_pct ? `${a.weight_pct}% · ${a.status.replace('_', ' ')}` : a.status.replace('_', ' ') }, { deletable: false })), ...tk.map(t => rowHTML({ ...t, _table: 'tasks' }))];
        html += rows.length ? `<div class="list">${rows.join('')}</div>` : empty('⏳', 'No deadlines on file', 'Coursework with weightings, status pipeline and the grade calculator come in Phase 3. Capture anything due now and it will carry over.', { label: 'Add a deadline', hint: 'Essay due ' });
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
        const pp = Rules.payPeriods(now);
        const fmtD = x => x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const fmtS = x => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        if (pp) {
          const cur = shifts.filter(x => Rules.inPeriod(x, pp.current)), done = cur.filter(x => new Date(x.ends_at) <= now), todo = cur.filter(x => new Date(x.ends_at) > now);
          const nxt = shifts.filter(x => Rules.inPeriod(x, pp.following));
          const d = Rules.payEstimate(done), all = Rules.payEstimate(cur), n = Rules.payEstimate(nxt);
          html += `<div class="tab-title">Paid ${esc(fmtD(pp.current.payday))} · ${esc(fmtS(pp.current.start))} – ${esc(fmtS(pp.current.end))}</div>`;
          html += `<div class="stat-row">
            <div class="stat card"><div class="k">Shifts</div><div class="v">${cur.length}<small>${todo.length ? todo.length + ' to go' : (cur.length ? 'all worked' : '')}</small></div></div>
            <div class="stat card"><div class="k">Hours worked</div><div class="v">${d.hours.toFixed(1)}<small>of ${all.hours.toFixed(1)} h</small></div></div>
            <div class="stat card"><div class="k">Earned so far</div><div class="v">${rate ? '£' + d.gross.toFixed(0) : '—'}</div></div>
            <div class="stat card"><div class="k">This payslip</div><div class="v">${rate ? '£' + all.gross.toFixed(0) : '—'}<small>gross</small></div></div>
          </div>`;
          html += paydayCard(now);
          html += earningsChart(now);
          if (nxt.length) html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>Then ${esc(fmtD(pp.following.payday))}</span><b style="color:var(--text)">${nxt.length} shift${nxt.length === 1 ? '' : 's'} booked · ${rate ? '≈ £' + n.gross.toFixed(0) : n.hours.toFixed(1) + ' h'}</b></div><p class="sub" style="margin-top:6px">${esc(fmtS(pp.following.start))} – ${esc(fmtS(pp.following.end))}</p></div>`;
        } else {
          const month = shifts.filter(x => new Date(x.starts_at).getMonth() === now.getMonth() && new Date(x.ends_at) < now);
          const pe = Rules.payEstimate(month);
          html += `<div class="tab-title">${now.toLocaleDateString('en-GB', { month: 'long' })}</div><div class="stat-row"><div class="stat card"><div class="k">Shifts worked</div><div class="v">${month.length}</div></div><div class="stat card"><div class="k">Hours</div><div class="v">${pe.hours.toFixed(1)}<small>h</small></div></div></div>`;
        }
        if (rate) html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>Rate</span><b style="color:var(--text)">£${rate.toFixed(2)}/h</b></div><div class="sub" style="display:flex;justify-content:space-between;margin-top:6px"><span>Pay</span><b style="color:var(--text)">${esc(s.payFrequency || '')}${s.payAnchor ? ' · Thursdays' : ''}</b></div><p class="sub" style="margin-top:10px">Each Thursday payslip covers the fortnight ending the Sunday before it. Gross estimates (hours minus unpaid breaks × rate); student income under the personal allowance means little or no tax — payslip reconcile arrives with the Payday Plan.</p></div>`;
        else html += `<div class="card"><h3>Set your hourly rate</h3><p class="sub">Earnings, projections and the Payday Plan all hang off it.</p><button class="btn" data-go="#/settings" style="margin-top:12px">Open settings</button></div>`;
      } else if (tab === 'requests') {
        const items = Store.list('time_off').filter(t => t.status !== 'cancelled').sort((a, b) => a.starts_on.localeCompare(b.starts_on));
        const fmtD = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const STATUS = { needed: ['Need to ask', 'var(--warn)'], asked: ['Asked', 'var(--work)'], approved: ['Approved', 'var(--ok)'], declined: ['Declined', 'var(--danger)'] };
        html += `<div class="tab-title">Time off to book</div>`;
        html += `<p class="field-note" style="padding:0 4px 10px">Exams, karting rounds, trips — anything work mustn't rota you for. Tap the status to move it along; EDEN nags you before the ask-by date.</p>`;
        if (!items.length) html += empty('🗓️', 'Nothing to book off yet', 'Add a date range and an "ask by" date and it shows here — and in EDEN\'s reminders. Or just tell her: <i>"book me off 3–5 Oct for BUKC"</i>.', { label: 'Add time off', hint: '__timeoff' });
        else html += `<div class="list">${items.map(t => {
          const clashes = Rules.timeOffClashes(t);
          const st = STATUS[t.status] || [t.status, 'var(--text-3)'];
          const range = t.starts_on === t.ends_on ? fmtD(t.starts_on) : `${fmtD(t.starts_on)} – ${fmtD(t.ends_on)}`;
          const askBy = t.ask_by ? ` · ask by ${new Date(t.ask_by + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : '';
          return `<div class="row timeoff" data-id="${t.id}">
            <span class="bar" style="background:${['uni', 'work', 'kart', 'personal'].includes(t.reason) ? kindColor(t.reason) : 'var(--text-3)'}"></span>
            <div class="t"><b>${esc(t.title)}</b><span>${esc(range)}${t.status === 'needed' ? esc(askBy) : ''}${clashes.length ? `<span style="color:var(--danger)">${clashes.length} shift${clashes.length === 1 ? '' : 's'} clash — currently rota'd</span>` : ''}</span></div>
            <button class="pill status" data-status="${t.id}" style="background:color-mix(in srgb, ${st[1]} 18%, transparent);color:${st[1]}">${esc(st[0])}</button>
            <button class="del" aria-label="Delete">${ICONS.trash}</button>
          </div>`;
        }).join('')}</div><button class="btn" data-capture-hint="__timeoff" style="margin-top:12px">${ICONS.plus} Add time off</button>`;
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

    if (sec === 'personal') {
      if (tab === 'week') {
        html += rightNowCard(now) + capacityStrip(now) + `<div data-calendar></div>`;
      } else if (tab === 'money') {
        html += moneyTab(now);
      } else if (tab === 'admin') {
        html += adminTab(now);
      } else if (tab === 'targets') {
        html += targetsTab(now);
      }
    }

    body.innerHTML = html;
    if (sec === 'personal' && tab === 'week') { const calEl = $('[data-calendar]', body); mountCalendar(calEl); body.querySelectorAll('.cap-day').forEach(b => b.addEventListener('click', () => { calEl.showDay(b.dataset.day); calEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); })); }
    const search = $('[data-note-search]', body);
    if (search) {
      const out = $('[data-note-results]', body), ms = Store.list('modules');
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        if (!q) { out.innerHTML = ''; return; }
        const hits = Store.list('notes').filter(n => (n.title || '').toLowerCase().includes(q) || (n.md || '').toLowerCase().includes(q)).slice(0, 12);
        out.innerHTML = hits.length ? `<div class="list" style="margin-bottom:14px">${hits.map(n => { const m = ms.find(x => x.id === n.module_id); return `<button class="row link" data-go="${m ? '#/module/' + m.id : '#/uni/modules'}"><span class="bar" style="background:${esc(m?.colour || 'var(--accent)')}"></span><div class="t"><b>${esc(n.title || n.md.slice(0, 60))}</b><span>${esc(m ? (m.code || m.name) + ' · ' : '')}${esc(n.md.slice(0, 90))}</span></div></button>`; }).join('')}</div>` : `<p class="field-note" style="padding:0 4px 12px">No notes match “${esc(search.value.trim())}”.</p>`;
        out.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
      });
    }
    body.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    body.querySelectorAll('[data-watch-done]').forEach(b => b.addEventListener('click', () => { Store.update('watches', b.dataset.watchDone, { status: 'resolved' }); toast('Resolved'); renderTabBody(el, sec, tab); }));
    body.querySelectorAll('[data-capture-hint]').forEach(b => b.addEventListener('click', () => b.dataset.captureHint === '__timeoff' ? openTimeOff(() => renderTabBody(el, sec, tab)) : openCapture(sec, b.dataset.captureHint)));
    body.querySelectorAll('.row .del').forEach(b => b.addEventListener('click', e => {
      const row = e.currentTarget.closest('.row');
      if (row.classList.contains('timeoff')) { Store.update('time_off', row.dataset.id, { status: 'cancelled' }); toast('Removed'); renderTabBody(el, sec, tab); return; }
      Store.remove(row.dataset.table, row.dataset.id); toast('Removed'); renderTabBody(el, sec, tab);
    }));
    body.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); const t = Store.get('time_off', b.dataset.status); if (!t) return;
      const order = ['needed', 'asked', 'approved', 'declined']; const nx = order[(order.indexOf(t.status) + 1) % order.length];
      Store.update('time_off', t.id, { status: nx }); toast(nx === 'needed' ? 'Back to: need to ask' : nx === 'asked' ? 'Marked as asked' : nx === 'approved' ? 'Approved — nice' : 'Declined'); renderTabBody(el, sec, tab);
    }));
  }


  /** Earnings by payday — hand-rolled SVG bars: worked (solid) vs still-to-work (hatched), current payday highlighted. */
  function earningsChart(now) {
    const hist = Rules.payHistory(now, 6); if (!hist.length) return '';
    const rate = +Store.settings.rateHourly || 0;
    const past = hist.filter(h => h.isPast && h.shifts > 0);
    const max = Math.max(1, ...hist.map(h => h.grossTotal));
    const W = 340, H = 150, padL = 8, padR = 8, padT = 22, padB = 30, bw = (W - padL - padR) / hist.length;
    const y = v => padT + (H - padT - padB) * (1 - v / max);
    const fmtP = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const bars = hist.map((h, i) => {
      const x = padL + i * bw + bw * 0.18, w = bw * 0.64;
      const yW = y(h.grossWorked), yT = y(h.grossTotal), y0 = y(0);
      const col = h.isCurrent ? 'var(--work)' : h.isFuture ? 'rgba(45,212,191,.55)' : 'rgba(244,246,251,.55)';
      const label = h.grossTotal > 0 ? `£${Math.round(h.grossTotal)}` : '';
      return `<g>
        ${h.grossTotal > h.grossWorked ? `<rect x="${x}" y="${yT}" width="${w}" height="${Math.max(0, yW - yT)}" rx="4" fill="url(#hatch)" stroke="${col}" stroke-width="1"/>` : ''}
        ${h.grossWorked > 0 ? `<rect x="${x}" y="${yW}" width="${w}" height="${Math.max(0, y0 - yW)}" rx="4" fill="${col}"/>` : ''}
        ${h.grossTotal === 0 ? `<rect x="${x}" y="${y0 - 2}" width="${w}" height="2" rx="1" fill="rgba(255,255,255,.12)"/>` : ''}
        ${label ? `<text x="${x + w / 2}" y="${yT - 6}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${h.isCurrent ? 'var(--text)' : 'var(--text-2)'}">${label}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 14}" text-anchor="middle" font-size="9.5" fill="${h.isCurrent ? 'var(--work)' : 'var(--text-3)'}" ${h.isCurrent ? 'font-weight="700"' : ''}>${esc(fmtP(h.payday))}</text>
        ${h.isCurrent ? `<text x="${x + w / 2}" y="${H - 3}" text-anchor="middle" font-size="8.5" letter-spacing=".08em" fill="var(--work)">NEXT</text>` : h.isFuture ? `<text x="${x + w / 2}" y="${H - 3}" text-anchor="middle" font-size="8.5" letter-spacing=".08em" fill="var(--text-3)">THEN</text>` : ''}
      </g>`;
    }).join('');
    const avg = past.length ? past.reduce((a, h) => a + h.grossTotal, 0) / past.length : 0;
    const best = past.length ? past.reduce((a, h) => h.grossTotal > a.grossTotal ? h : a, past[0]) : null;
    const ytd = hist.filter(h => h.payday.getFullYear() === now.getFullYear() && !h.isFuture).reduce((a, h) => a + (h.isCurrent ? h.grossWorked : h.grossTotal), 0);
    const hrsAvg = past.length ? past.reduce((a, h) => a + h.hoursTotal, 0) / past.length : 0;
    return `<div class="card chart-card">
      <div class="sub" style="display:flex;justify-content:space-between;align-items:baseline"><b style="color:var(--text)">Pay by payday</b><span>gross · ${rate ? '£' + rate.toFixed(2) + '/h' : 'set rate'}</span></div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gross pay per payday">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(45,212,191,.10)"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(45,212,191,.55)" stroke-width="1.5"/></pattern></defs>
        <line x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}" stroke="rgba(255,255,255,.12)"/>
        ${bars}
      </svg>
      <div class="legend"><span><i style="background:var(--work)"></i>worked</span><span><i style="background:url(#hatch);border:1px solid rgba(45,212,191,.6);background:repeating-linear-gradient(45deg,rgba(45,212,191,.55) 0 1.5px,transparent 1.5px 5px)"></i>still to work</span><span><i style="background:rgba(244,246,251,.55)"></i>past payslips</span></div>
      <div class="kpis">
        <div><span>Avg payslip</span><b>${past.length ? '£' + avg.toFixed(0) : '—'}</b><small>${past.length ? hrsAvg.toFixed(1) + ' h avg' : 'no history yet'}</small></div>
        <div><span>Best</span><b>${best ? '£' + best.grossTotal.toFixed(0) : '—'}</b><small>${best ? fmtP(best.payday) : ''}</small></div>
        <div><span>Paid ${now.getFullYear()}</span><b>£${ytd.toFixed(0)}</b><small>earned so far</small></div>
      </div>
    </div>`;
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
  // Unified calendar (Next Up → here). List or grid; filter by section.
  // ------------------------------------------------------------
  const KINDS = [['uni', 'University'], ['work', 'Work'], ['kart', 'Karting'], ['personal', 'Personal']];
  const KIND_COLOR = k => kindColor(k);
  const calState = (() => { try { return JSON.parse(localStorage.getItem('iota.cal') || '{}'); } catch (_) { return {}; } })();
  calState.view = calState.view || 'list';
  calState.filter = Array.isArray(calState.filter) && calState.filter.length ? calState.filter : KINDS.map(k => k[0]);
  const saveCal = () => localStorage.setItem('iota.cal', JSON.stringify(calState));
  const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

  /** The unified calendar, mounted inside a host element (Personal › Week). */
  function mountCalendar(el) {
    const now = new Date();
    calState.month = calState.month || dayKey(now).slice(0, 7);
    el.innerHTML = `
      <div class="cal-head"><div class="tab-title" style="margin:0">Everything</div><div class="seg" role="tablist"><button data-view="list" role="tab">List</button><button data-view="grid" role="tab">Grid</button></div></div>
      <div class="filters" data-filters style="padding-left:0;padding-right:0">
        <button class="fkey all" data-kind="*">All</button>
        ${KINDS.map(([k, n]) => `<button class="fkey" data-kind="${k}" style="--k:${KIND_COLOR(k)}"><span class="dot"></span>${n}</button>`).join('')}
      </div>
      <div class="cal-body" data-body></div>`;
    el.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => { calState.view = b.dataset.view; saveCal(); paint(); }));
    el.querySelectorAll('.fkey').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.kind;
      if (k === '*') calState.filter = KINDS.map(x => x[0]);
      else if (calState.filter.length === KINDS.length) calState.filter = [k];                    // from "all" → solo this one
      else if (calState.filter.includes(k)) { calState.filter = calState.filter.filter(x => x !== k); if (!calState.filter.length) calState.filter = KINDS.map(x => x[0]); }
      else calState.filter.push(k);
      saveCal(); paint();
    }));
    const body = $('[data-body]', el);
    const items = () => Store.allTimed().filter(x => calState.filter.includes(x.kind || 'personal'));

    function paint() {
      el.querySelectorAll('.seg button').forEach(b => b.classList.toggle('active', b.dataset.view === calState.view));
      const all = calState.filter.length === KINDS.length;
      el.querySelectorAll('.fkey').forEach(b => b.classList.toggle('active', b.dataset.kind === '*' ? all : (!all && calState.filter.includes(b.dataset.kind))));
      body.innerHTML = calState.view === 'grid' ? gridHTML() : listHTML();
      wire();
    }

    function itemRow(x, showTime = true) {
      const when = x.isTask ? `due ${Rules.fmtRange(x.starts_at)}` : Rules.fmtRange(x.starts_at, x.ends_at);
      const sub = [x.isTask ? (x._table === 'assessments' ? 'assessment' : 'task') : null, x.location].filter(Boolean).join(' · ');
      return `<div class="row cal-item" data-table="${x._table}" data-id="${x.id}">
        <span class="bar" style="background:${KIND_COLOR(x.kind)}"></span>
        <div class="t"><b>${esc(x.title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
        ${showTime ? `<div class="when">${esc(when)}</div>` : ''}
      </div>`;
    }
    function listHTML() {
      const from = new Date(now); from.setHours(0, 0, 0, 0);
      const list = items().filter(x => new Date(x.ends_at || x.starts_at) >= from);
      if (!list.length) return empty('🗓️', 'Nothing coming up', 'Nothing in the selected sections. Hold the orb to add something, or tell Claude.');
      const groups = new Map();
      for (const x of list) { const k = dayKey(x.starts_at); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
      let html = '';
      for (const [k, arr] of groups) {
        const d = new Date(k + 'T00:00:00');
        const diff = Math.round((d - from) / 86400000);
        const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
        html += `<div class="day-head ${diff === 0 ? 'today' : ''}"><span>${esc(label)}</span><span class="sub">${diff > 1 ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) === label ? '' : `in ${diff} days` : ''}</span></div><div class="list">${arr.map(x => itemRow(x)).join('')}</div>`;
      }
      return html;
    }
    function gridHTML() {
      const [y, m] = calState.month.split('-').map(Number);
      const first = new Date(y, m - 1, 1), last = new Date(y, m, 0);
      const startPad = (first.getDay() + 6) % 7; // Monday first
      const byDay = new Map();
      for (const x of items()) { const k = dayKey(x.starts_at); if (k.startsWith(calState.month)) { if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(x); } }
      const sel = calState.selDay && calState.selDay.startsWith(calState.month) ? calState.selDay : (dayKey(now).startsWith(calState.month) ? dayKey(now) : null);
      let cells = '';
      for (let i = 0; i < startPad; i++) cells += '<div class="cell pad"></div>';
      for (let d = 1; d <= last.getDate(); d++) {
        const k = `${calState.month}-${String(d).padStart(2, '0')}`;
        const arr = byDay.get(k) || [];
        const kinds = [...new Set(arr.map(x => x.kind || 'personal'))];
        cells += `<button class="cell ${k === dayKey(now) ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-day="${k}"><span class="n">${d}</span><span class="dots">${kinds.slice(0, 4).map(kd => `<i style="background:${KIND_COLOR(kd)}"></i>`).join('')}</span></button>`;
      }
      const selItems = sel ? (byDay.get(sel) || []) : [];
      const selD = sel ? new Date(sel + 'T00:00:00') : null;
      return `
        <div class="cal-nav"><button class="btn icon ghost" data-nav="-1" aria-label="Previous month">${ICONS.back}</button><h2>${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><button class="btn icon ghost" data-nav="1" aria-label="Next month" style="transform:scaleX(-1)">${ICONS.back}</button></div>
        <div class="dow">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="grid">${cells}</div>
        ${sel ? `<div class="day-head" style="margin-top:14px"><span>${esc(selD.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))}</span></div>${selItems.length ? `<div class="list">${selItems.map(x => itemRow(x)).join('')}</div>` : `<p class="field-note" style="padding:6px 4px">Nothing on.</p>`}` : ''}`;
    }
    function wire() {
      body.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => { const [y, m] = calState.month.split('-').map(Number); const d = new Date(y, m - 1 + (+b.dataset.nav), 1); calState.month = dayKey(d).slice(0, 7); saveCal(); paint(); }));
      body.querySelectorAll('.cell[data-day]').forEach(b => b.addEventListener('click', () => { calState.selDay = b.dataset.day; saveCal(); paint(); }));
      body.querySelectorAll('.cal-item').forEach(r => r.addEventListener('click', () => openDetail(r.dataset.table, r.dataset.id)));
    }
    function openDetail(table, id) {
      const x = Store.get(table, id); if (!x) return;
      const kind = table === 'shifts' ? 'work' : (x.kind || x.section || 'uni');
      const title = table === 'shifts' ? (x.role ? `Shift · ${x.role}` : 'Shift') : x.title;
      const start = x.starts_at || x.due || x.due_at, end = x.ends_at;
      const sheet = document.createElement('div'); sheet.className = 'sheet';
      sheet.innerHTML = `<div class="sheet-backdrop" data-close></div>
        <div class="sheet-panel glass">
          <div class="sheet-grip"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span class="dot" style="width:10px;height:10px;border-radius:50%;background:${KIND_COLOR(kind)};box-shadow:0 0 10px ${KIND_COLOR(kind)}"></span><span class="pill" style="background:rgba(255,255,255,.08);color:var(--text-2)">${esc(kindName(kind))}</span></div>
          <h2 style="font-size:20px;margin-bottom:6px">${esc(title)}</h2>
          <p class="sub" style="color:var(--text-2)">${esc(new Date(start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))} · ${esc(x.isTask || table === 'tasks' || table === 'assessments' ? 'due ' + Rules.fmtRange(start) : Rules.fmtRange(start, end))}${x.location ? ` · ${esc(x.location)}` : ''}</p>
          ${table === 'shifts' ? `<p class="sub" style="color:var(--text-2);margin-top:6px">${esc(String(x.break_min || 0))} min unpaid break${+Store.settings.rateHourly ? ` · ≈ £${Rules.payEstimate([x]).gross.toFixed(2)} gross` : ''}</p>` : ''}
          ${x.notes ? `<p style="margin-top:10px">${esc(x.notes)}</p>` : ''}
          <div class="sheet-row" style="margin-top:16px">
            <span class="hint">${esc(x.source === 'claude' ? 'Added via Claude' : x.source || '')}</span>
            <div style="display:flex;gap:8px">${table !== 'assessments' ? `<button class="btn ghost" data-del style="color:var(--danger)">Delete</button>` : ''}<button class="btn" data-close>Close</button></div>
          </div>
        </div>`;
      document.body.appendChild(sheet);
      sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => sheet.remove()));
      sheet.querySelector('[data-del]')?.addEventListener('click', () => { Store.remove(table, id); sheet.remove(); toast('Removed'); paint(); });
    }
    paint();
    el.showDay = k => { calState.view = 'grid'; calState.month = k.slice(0, 7); calState.selDay = k; saveCal(); paint(); };
    return el;
  }

  // ------------------------------------------------------------
  // Personal arc — Week helpers, Money / Admin / Targets (v1 shells with real numbers where they exist)
  // ------------------------------------------------------------
  /** Hours committed per day (events + shifts) for the next N days. */
  function dayLoads(now, days = 14) {
    const out = []; const items = Store.allTimed().filter(x => !x.isTask && x.ends_at);
    for (let i = 0; i < days; i++) {
      const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); const e = new Date(d); e.setDate(e.getDate() + 1);
      let hrs = 0; const what = [];
      for (const x of items) { const a = Math.max(new Date(x.starts_at), d), b = Math.min(new Date(x.ends_at), e); if (b > a) { hrs += (b - a) / 3600000; what.push(x); } }
      const due = Store.allTimed().filter(x => x.isTask && dayKey(x.starts_at) === dayKey(d)).length;
      out.push({ key: dayKey(d), date: d, hours: hrs, due, what });
    }
    return out;
  }
  function capacityStrip(now) {
    const loads = dayLoads(now, 14);
    if (!loads.some(l => l.hours || l.due)) return '';
    return `<div class="card capacity"><div class="sub" style="display:flex;justify-content:space-between"><b style="color:var(--text)">Next 14 days</b><span>hours committed</span></div>
      <div class="cap-grid">${loads.map(l => { const lvl = l.hours >= 9 ? 4 : l.hours >= 6 ? 3 : l.hours >= 3 ? 2 : l.hours > 0 ? 1 : 0; return `<button class="cap-day lvl${lvl} ${l.key === dayKey(now) ? 'today' : ''}" data-day="${l.key}" aria-label="${esc(l.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }))}: ${l.hours.toFixed(1)} hours"><span class="d">${'MTWTFSS'[(l.date.getDay() + 6) % 7]}</span><span class="n">${l.date.getDate()}</span><span class="h">${l.hours ? l.hours.toFixed(0) + 'h' : (l.due ? '•' : '')}</span></button>`; }).join('')}</div>
      <p class="field-note" style="padding:8px 0 0">Tap a heavy day to see what's stacking. Free-slot tinting from the energy layer comes later.</p></div>`;
  }
  function rightNowCard(now) {
    const up = Store.upcoming(now, 5).filter(x => !x.isTask);
    const live = up.find(x => new Date(x.starts_at) <= now && new Date(x.ends_at || x.starts_at) > now);
    const nx = up.find(x => new Date(x.starts_at) > now);
    const tasks = Store.tasks_open().sort((a, b) => new Date(a.due || 8e15) - new Date(b.due || 8e15));
    let head, sub;
    if (live) { head = `${esc(live.title)} — now`; sub = `Until ${Rules.fmtRange(live.ends_at)}.` + (nx ? ` Then ${esc(nx.title)} ${esc(Rules.fmtWhen(nx.starts_at, now))}.` : ''); }
    else if (nx) {
      const mins = Math.round((new Date(nx.starts_at) - now) / 60000), buf = Rules.leaveBufferFor(nx), free = mins - buf;
      const h = Math.floor(free / 60), m = free % 60;
      head = free <= 0 ? `Time to move for ${esc(nx.title)}` : `${h ? h + 'h ' : ''}${m}m free`;
      sub = free <= 0 ? `${buf} min ${esc(Store.settings.travelMode || 'walk')} — you should be leaving.` : `${esc(nx.title)} ${esc(Rules.fmtWhen(nx.starts_at, now))}${buf && free <= 180 ? `, leave in ${free} min` : ''}.` + (tasks[0] ? ` Could do: <b>${esc(tasks[0].title)}</b>.` : ' Nothing on the list.');
    } else { head = 'Nothing timed ahead'; sub = tasks.length ? `${tasks.length} open task${tasks.length === 1 ? '' : 's'} — top: <b>${esc(tasks[0].title)}</b>.` : 'Genuinely free. Rare.'; }
    return `<div class="card rightnow"><div class="sub">Right now</div><h3>${head}</h3><p class="sub" style="margin-top:4px">${sub}</p></div>`;
  }
  function moneyTab(now) {
    const s = Store.settings, rate = +s.rateHourly || 0, pp = Rules.payPeriods(now);
    let html = `<div class="tab-title">Money</div>`;
    if (pp && rate) {
      const shifts = Store.list('shifts').filter(x => x.status !== 'cancelled');
      const cur = Rules.payEstimate(shifts.filter(x => Rules.inPeriod(x, pp.current))), nxt = Rules.payEstimate(shifts.filter(x => Rules.inPeriod(x, pp.following)));
      const days = Math.ceil((pp.current.payday - now) / 86400000);
      html += `<div class="card money-hero"><div class="sub">Incoming</div><div class="big-num">£${cur.gross.toFixed(0)}<span style="font-size:14px;color:var(--text-2);margin-left:8px">gross · ${esc(pp.current.payday.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }))} · ${days} day${days === 1 ? '' : 's'}</span></div><p class="sub" style="margin-top:6px">Then ≈ £${nxt.gross.toFixed(0)} on ${esc(pp.following.payday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}. Estimates from Work — “safe to spend” lands when payslips, bills and pots are in.</p></div>`;
    } else html += `<div class="card"><h3>No pay set up</h3><p class="sub">Add your rate and a payday in Settings and the money view starts working.</p><button class="btn" data-go="#/settings" style="margin-top:12px">Open settings</button></div>`;
    html += `<div class="card"><h3>Payslips</h3><p class="sub">Vault of real payslips, reconciled against the shift estimates. Photograph or paste one to EDEN and she files it — arriving in the next Money pass.</p></div>
      <div class="card"><h3>Bills & subscriptions</h3><p class="sub">Rent, phone, Spotify, insurance — £/month and the persuasive £/year. Coming with payslips.</p></div>
      <div class="card"><h3>Pots & Payday Plan</h3><p class="sub">Split each payday and student-loan drop into named pots. Coming with payslips.</p></div>
      ${studentFinanceCard(now)}`;
    return html;
  }
  function studentFinanceCard(now) {
    const sf = Store.settings.studentFinance;
    if (!sf || !Array.isArray(sf.drops) || !sf.drops.length) return `<div class="card"><h3>Student loan</h3><p class="sub">Tell EDEN when your maintenance-loan payments land and they get their own countdown here.</p></div>`;
    const fmtD = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const gbp = n => '£' + (+n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const next = sf.drops.find(d => new Date(d.date + 'T23:59:59') >= now);
    const days = next ? Math.ceil((new Date(next.date + 'T00:00:00') - now) / 86400000) : null;
    const STATUS = { awaiting_confirmation: ['Awaiting confirmation', 'var(--warn)'], scheduled: ['Scheduled', 'var(--accent)'], paid: ['Paid', 'var(--ok)'], blocked: ['Blocked', 'var(--danger)'] };
    return `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><h3>Student loan</h3><span>${esc(sf.kind || 'maintenance loan')}${sf.year ? ' · ' + esc(sf.year) : ''}</span></div>
      ${next ? `<div class="big-num" style="margin-top:6px">${days}<span style="font-size:14px;color:var(--text-2);margin-left:8px">day${days === 1 ? '' : 's'} to ${gbp(next.amount)}</span></div><p class="sub" style="margin-top:4px">${esc(fmtD(next.date))}${next.status === 'awaiting_confirmation' ? ' — pays once MMU confirms you\'re registered' : ''}</p>` : `<p class="sub">All drops for the year have landed.</p>`}
      <div class="list" style="margin-top:12px">${sf.drops.map(d => { const st = STATUS[d.status] || [d.status || '', 'var(--text-3)']; const past = new Date(d.date + 'T23:59:59') < now; return `<div class="row"><span class="bar" style="background:${past ? 'var(--text-3)' : st[1]}"></span><div class="t"><b>${gbp(d.amount)}</b><span>${esc(fmtD(d.date))}</span></div><span class="pill" style="background:color-mix(in srgb, ${st[1]} 18%, transparent);color:${st[1]}">${esc(st[0])}</span></div>`; }).join('')}</div>
      <p class="field-note" style="padding:8px 0 0">${sf.total ? `${gbp(sf.total)} for the year from ${esc(sf.provider || 'Student Finance')}. ` : ''}These dwarf paydays — the Payday Plan splits each one into pots when Money lands.</p></div>`;
  }
  function adminTab(now) {
    let html = `<div class="tab-title">Life admin</div>`;
    const ws = Store.list('watches').filter(w => w.status !== 'resolved').sort((a, b) => new Date(a.expected_by || 8e15) - new Date(b.expected_by || 8e15));
    html += `<div class="card"><h3>Watching</h3><p class="sub">Promises EDEN is keeping an eye on. Tap the tick when it's happened.</p>${ws.length ? `<div class="list" style="margin-top:10px">${ws.map(w => { const late = w.expected_by && new Date(w.expected_by + 'T23:59:59') < now; return `<div class="row"><span class="bar" style="background:${late ? 'var(--danger)' : 'var(--accent)'}"></span><div class="t"><b style="white-space:normal">${esc(w.text)}</b><span>${w.expected_by ? (late ? 'overdue — expected ' : 'expected ') + esc(new Date(w.expected_by + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })) : 'no date'}</span></div><button class="pill status" data-watch-done="${w.id}" style="background:rgba(110,231,183,.16);color:var(--ok)">Done</button></div>`; }).join('')}</div>` : `<p class="field-note" style="padding:8px 0 0">Nothing being watched. Tell EDEN “watch for…” and it lands here.</p>`}</div>`;
    const rn = Store.list('renewals').sort((a, b) => new Date(a.expires_on || 8e15) - new Date(b.expires_on || 8e15));
    html += `<div class="card"><h3>Expiry & renewals</h3><p class="sub">Railcard, passport, licence, insurance, memberships.</p>${rn.length ? `<div class="list" style="margin-top:10px">${rn.map(r => { const d = r.expires_on ? new Date(r.expires_on + 'T00:00:00') : null; const days = d ? Math.ceil((d - now) / 86400000) : null; return `<div class="row"><span class="bar" style="background:${days != null && days <= 30 ? 'var(--warn)' : 'var(--accent)'}"></span><div class="t"><b>${esc(r.name)}</b><span>${d ? esc(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) + (days != null ? ` · ${days < 0 ? 'expired' : days + ' days'}` : '') : ''}${r.notes ? ' · ' + esc(r.notes) : ''}</span></div></div>`; }).join('')}</div>` : `<p class="field-note" style="padding:8px 0 0">None on file yet — tell EDEN “my railcard expires 3 March” and it appears here with a lead-time nudge.</p>`}</div>`;
    const pn = Store.list('notes').filter(n => n.section === 'personal');
    if (pn.length) html += `<div class="card"><h3>Personal notes</h3><div class="list" style="margin-top:10px">${pn.slice(0, 10).map(n => rowHTML({ ...n, _table: 'notes', title: n.title || n.md, kind: 'personal', location: n.title ? n.md.slice(0, 80) : '' })).join('')}</div></div>`;
    html += `<div class="card"><h3>Documents, contacts, decisions</h3><p class="sub">Document vault (tenancy, contract, payslips), key contacts with tap-to-call, decision memory and the milestone archive — next Admin pass.</p></div>`;
    return html;
  }
  function targetsTab(now) {
    let html = `<div class="tab-title">Targets</div>`;
    const from = new Date(now); from.setDate(from.getDate() - 30);
    const items = Store.allTimed().filter(x => !x.isTask && x.ends_at && new Date(x.starts_at) >= from && new Date(x.starts_at) <= now);
    const hrs = { uni: 0, work: 0, personal: 0 };
    for (const x of items) { const k = x.kind === 'kart' ? 'uni' : (x.kind in hrs ? x.kind : 'personal'); hrs[k] += Rules.hours(x.starts_at, x.ends_at); }
    const tot = hrs.uni + hrs.work + hrs.personal;
    html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><b style="color:var(--text)">Life balance</b><span>last 30 days · ${tot.toFixed(0)} h</span></div>
      ${tot ? `<div class="balance">${['uni', 'work', 'personal'].map(k => `<div class="brow"><span class="k">${esc(SECTIONS[k].name)}</span><div class="track"><div style="width:${(hrs[k] / tot * 100).toFixed(0)}%;background:${SECTIONS[k].color}"></div></div><span class="v">${hrs[k].toFixed(0)} h</span></div>`).join('')}</div><p class="field-note" style="padding:8px 0 0">Society hours count as University. Untimed study doesn't show yet — the focus timer will fix that.</p>` : `<p class="field-note" style="padding:8px 0 0">Nothing timed in the last month.</p>`}</div>`;
    html += `<div class="card"><h3>Weekly targets</h3><p class="sub">A small set you choose — “3 focus blocks”, “£0 takeaway” — reviewed by the Sunday briefing. Coming with the Sunday review.</p></div>
      <div class="card"><h3>Semester goals</h3><p class="sub">Grade targets per module (feeds the calculator), a savings target, and an hours cap on work in assessment weeks — EDEN warns when you're over. Coming with the module hubs.</p></div>`;
    return html;
  }

  // ------------------------------------------------------------
  // Society mini-hub (University › Societies › tap). Society-tinted, own back control.
  // ------------------------------------------------------------
  const socTabState = {};
  function renderSociety(id) {
    const so = Store.get('societies', id);
    const el = document.createElement('section');
    el.className = 'screen section-screen society-screen';
    if (!so) { el.innerHTML = `<header class="section-head"><button class="btn icon ghost back" data-go="#/uni/societies">${ICONS.back}</button><h1>Society</h1></header><div class="scroll">${empty('✨', 'Not found', 'That society isn\'t in your list any more.')}</div>`; el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go))); return el; }
    const col = socColor(so); tint(col);
    const kart = isKartSoc(so);
    const tabs = kart ? [['club', 'Club'], ['racing', 'My Racing'], ['events', 'Events']] : [['about', 'About'], ['events', 'Events']];
    socTabState[id] = socTabState[id] || tabs[0][0];
    el.innerHTML = `
      <header class="section-head">
        <button class="btn icon ghost back" aria-label="Back to societies" data-go="#/uni/societies">${ICONS.back}</button>
        <h1><span class="kicker">Society · ${esc(so.status === 'committee' ? (so.role || 'Committee') : so.status)}</span>${esc(so.name)}</h1>
        <button class="btn icon ghost" aria-label="Quick add" data-capture>${ICONS.plus}</button>
      </header>
      <div class="seg soc-seg" role="tablist">${tabs.map(t => `<button data-stab="${t[0]}" role="tab">${esc(t[1])}</button>`).join('')}</div>
      <div class="scroll" data-body style="padding-bottom:40px"></div>`;
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $('[data-capture]', el).addEventListener('click', () => openCapture('kart', kart ? 'Karting ' : so.name + ' '));
    const body = $('[data-body]', el), now = new Date(), s = Store.settings;
    const paint = () => {
      const t = socTabState[id];
      el.querySelectorAll('[data-stab]').forEach(b => b.classList.toggle('active', b.dataset.stab === t));
      let html = '';
      if (t === 'club') {
        html += `<div class="card"><h3>Society hub</h3><p class="sub">Dashboard, events, membership tiers, committee contacts and the committee-only finance view — ported natively here next, reading the same Supabase tables. Until then the live app is one tap away.</p>
          <a class="btn" href="https://magicjoynson.github.io/mmu-karting/" target="_blank" rel="noopener" style="margin-top:12px">Open MMU Karting ↗</a></div>`;
        html += `<div class="card"><h3>Season</h3><p class="sub">BUKC rounds, practice days and socials show under Events and in your Week in this colour. Kart spend (fuel, tyres, entries) is tracked in Personal › Money tagged <i>karting</i>, and rolls up here once Money lands.</p></div>`;
        if (so.notes) html += `<div class="card"><p class="sub">${esc(so.notes)}</p></div>`;
      } else if (t === 'racing') {
        html += empty('🏁', 'No sessions logged', 'Lap log, PB detection, the consistency analyser, Track Playbook and readiness pack all live here. Hold the orb after a session to leave yourself a debrief note in the meantime.', { label: 'Debrief note', hint: 'Note: track — ' });
        if (s.trackAddress) html += `<div class="card"><h3>Victoria Karting</h3><p class="sub">${esc(s.trackAddress)} · ${esc(String(s.travelTrackMin || ''))} min ${esc(s.travelMode || 'walk')}${s.loadingMin ? ` + ${esc(String(s.loadingMin))} min loading on race days` : ''}</p></div>`;
        const tn = Store.list('notes').filter(n => n.section === 'kart');
        if (tn.length) html += `<div class="tab-title" style="margin-top:14px">Track notes</div><div class="list">${tn.map(n => rowHTML({ ...n, _table: 'notes', title: n.title || n.md, kind: 'kart', location: n.title ? n.md.slice(0, 80) : '' })).join('')}</div>`;
      } else if (t === 'about') {
        html += `<div class="card"><h3>${esc(so.status === 'prospective' ? 'Prospective' : so.status === 'committee' ? 'Committee' : 'Member')}</h3>${so.role ? `<p class="sub">${esc(so.role)}</p>` : ''}${so.notes ? `<p class="sub" style="margin-top:4px">${esc(so.notes)}</p>` : ''}${so.renewal_date ? `<p class="sub" style="margin-top:6px">Membership renews ${esc(new Date(so.renewal_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</p>` : ''}</div>`;
        html += `<div class="card"><h3>Hub</h3><p class="sub">Events, membership and renewal, role duties, links and notes — and, for committee roles, the receipt-to-claim drafter. Fills in once you've joined.</p></div>`;
      } else if (t === 'events') {
        const ev = kart ? Store.upcoming(now, 50).filter(x => x.kind === 'kart') : [];
        html += ev.length ? `<div class="list">${ev.map(x => rowHTML(x)).join('')}</div>` : empty('🗓️', 'No upcoming events', kart ? 'Society events sync from the karting tables in the native port. Practice, BUKC rounds and socials can be captured now.' : 'Nothing captured for this society yet.', { label: 'Add an event', hint: kart ? 'Karting ' : so.name + ' ' });
      }
      const links = (so.links || []);
      if (links.length && t !== 'racing') html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">${links.map(l => `<a class="chip accent" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`;
      body.innerHTML = html;
      body.querySelectorAll('[data-capture-hint]').forEach(b => b.addEventListener('click', () => openCapture('kart', b.dataset.captureHint)));
      body.querySelectorAll('.row .del').forEach(b => b.addEventListener('click', e => { const row = e.currentTarget.closest('.row'); Store.remove(row.dataset.table, row.dataset.id); toast('Removed'); paint(); }));
    };
    el.querySelectorAll('[data-stab]').forEach(b => b.addEventListener('click', () => { socTabState[id] = b.dataset.stab; paint(); }));
    paint();
    return el;
  }

  // ------------------------------------------------------------
  // Module hub (University › Modules › tap): Info · Sessions · Assessments · Notes in one place.
  // ------------------------------------------------------------
  function renderModule(id) {
    const m = Store.get('modules', id);
    const el = document.createElement('section');
    el.className = 'screen section-screen module-screen';
    if (!m) { el.innerHTML = `<header class="section-head"><button class="btn icon ghost back" data-go="#/uni/modules">${ICONS.back}</button><h1>Module</h1></header><div class="scroll">${empty('📚', 'Not found', 'That module isn\'t on file any more.')}</div>`; el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go))); return el; }
    if (m.colour) tint(m.colour);
    const now = new Date();
    el.innerHTML = `
      <header class="section-head">
        <button class="btn icon ghost back" aria-label="Back to modules" data-go="#/uni/modules">${ICONS.back}</button>
        <h1><span class="kicker">${esc(m.code || 'Module')}</span>${esc(m.name)}</h1>
        <button class="btn icon ghost" aria-label="Add a note" data-note>${ICONS.plus}</button>
      </header>
      <div class="scroll" data-body style="padding-bottom:40px"></div>`;
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const body = $('[data-body]', el);
    const paint = () => {
      const sessions = Store.list('events').filter(e => e.module_id === id && e.status !== 'cancelled').sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const upS = sessions.filter(e => new Date(e.ends_at || e.starts_at) >= now), pastS = sessions.filter(e => new Date(e.ends_at || e.starts_at) < now);
      const missed = pastS.filter(e => e.status === 'missed').length;
      const as = Store.list('assessments').filter(a => a.module_id === id).sort((a, b) => new Date(a.due_at || 8e15) - new Date(b.due_at || 8e15));
      const graded = as.filter(a => a.status === 'graded' && a.mark != null && a.weight_pct);
      const wSum = graded.reduce((x, a) => x + +a.weight_pct, 0);
      const avg = wSum ? graded.reduce((x, a) => x + +a.mark * +a.weight_pct, 0) / wSum : null;
      const notes = Store.list('notes').filter(n => n.module_id === id);
      const links = m.links || [];
      let html = `<div class="card"><h3>Info</h3><div class="kv">${[['Lecturer', m.lecturer], ['Room', m.room], ['Credits', m.credits]].filter(x => x[1]).map(x => `<div><span>${x[0]}</span><b>${esc(String(x[1]))}</b></div>`).join('') || '<p class="sub">Lecturer, room, credits and links fill in from the timetable or from EDEN.</p>'}</div>${links.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${links.map(l => `<a class="chip accent" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}</div>`;
      html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><h3>Sessions</h3><span>${sessions.length ? `${pastS.length} done${missed ? ` · ${missed} missed` : ''} · ${upS.length} to come` : 'none yet'}</span></div>${upS.length ? `<div class="list" style="margin-top:10px">${upS.slice(0, 6).map(e => rowHTML({ ...e, _table: 'events' }, { deletable: false })).join('')}</div>` : `<p class="field-note" style="padding:8px 0 0">Timetable slots for this module show here with attendance and catch-up debt.</p>`}</div>`;
      html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><h3>Assessments</h3><span>${avg != null ? `avg ${avg.toFixed(0)}% of ${wSum}% marked` : (as.length ? `${as.length} on file` : 'none yet')}</span></div>${as.length ? `<div class="list" style="margin-top:10px">${as.map(a => `<div class="row"><span class="bar" style="background:${a.status === 'graded' ? 'var(--ok)' : a.status === 'submitted' ? 'var(--text-3)' : 'var(--accent)'}"></span><div class="t"><b>${esc(a.title)}</b><span>${a.weight_pct ? a.weight_pct + '% · ' : ''}${esc(String(a.status).replace('_', ' '))}${a.mark != null ? ` · ${a.mark}%` : ''}</span></div>${a.due_at ? `<div class="when">${esc(Rules.fmtWhen(a.due_at))}</div>` : ''}</div>`).join('')}</div>` : `<p class="field-note" style="padding:8px 0 0">Weightings, status pipeline, workback milestones and marks → the 2:1/First calculator.</p>`}</div>`;
      html += `<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><h3>Notes</h3><button class="chip accent" data-note>${ICONS.plus} New</button></div>${notes.length ? `<div class="list" style="margin-top:10px">${notes.map(n => rowHTML({ ...n, _table: 'notes', title: n.title || n.md, kind: 'uni', location: [n.week ? 'wk ' + n.week : '', n.title ? n.md.slice(0, 80) : ''].filter(Boolean).join(' · ') })).join('')}</div>` : `<p class="field-note" style="padding:8px 0 0">Per-week markdown notes for this module. Photo attachments, revision mode and flashcards come later.</p>`}</div>`;
      body.innerHTML = html;
      body.querySelectorAll('.row .del').forEach(b => b.addEventListener('click', e => { const row = e.currentTarget.closest('.row'); Store.remove(row.dataset.table, row.dataset.id); toast('Removed'); paint(); }));
      el.querySelectorAll('[data-note]').forEach(b => { b.onclick = () => openNote(m, paint); });
    };
    paint();
    return el;
  }
  /** Note sheet scoped to a module. */
  function openNote(m, onDone) {
    const sheet = document.createElement('div'); sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-backdrop" data-close></div>
      <form class="sheet-panel glass" autocomplete="off">
        <div class="sheet-grip"></div>
        <div class="sheet-title">Note · ${esc(m.code || m.name)}</div>
        <div class="field"><div class="row2"><div><label>Title</label><input name="title" placeholder="e.g. Lecture 3 — pricing"></div><div><label>Week</label><input name="week" type="number" min="1" max="52" inputmode="numeric"></div></div></div>
        <div class="field"><label>Note</label><textarea name="md" rows="5" required placeholder="Markdown is fine."></textarea></div>
        <div class="sheet-row"><span class="hint">Saved to this module.</span><button class="btn primary" type="submit">Save</button></div>
      </form>`;
    document.body.appendChild(sheet);
    const f = sheet.querySelector('form');
    sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => sheet.remove()));
    f.addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries()); if (!d.md.trim()) return; Store.insert('notes', { section: 'uni', module_id: m.id, title: d.title.trim() || null, week: d.week ? +d.week : null, md: d.md.trim(), tags: [] }); sheet.remove(); toast('Note saved'); onDone?.(); });
    setTimeout(() => f.title.focus(), 60);
  }

  // ------------------------------------------------------------
  // EDEN chat
  // ------------------------------------------------------------
  const CHIPS = [['Today', 'What\'s on today?'], ['This week', 'How does this week look?'], ['Deadlines', 'Any deadlines?'], ['Add something', '__capture'], ['How\'s my money looking?', 'How\'s my money looking?']];
  let edenDeep = sessionStorage.getItem('iota.eden.deep') === '1';
  function renderEden() {
    const el = document.createElement('section');
    el.className = 'screen eden-screen';
    const live = Eden.available;
    const modeLabel = () => live ? (edenDeep ? 'thinking harder · opus 5' : 'live · sonnet 5') : 'rules mode';
    el.innerHTML = `
      <div class="eden-head">
        <button class="btn icon ghost eden-back" aria-label="Back to the Ring" data-go="#/">${ICONS.back}</button>
        ${live ? `<button class="chip eden-deep ${edenDeep ? 'accent' : ''}" data-deep aria-pressed="${edenDeep}">Think harder</button>` : ''}
        <div class="orb-mid"><canvas></canvas></div>
        <div class="name">EDEN</div>
        <div class="state" data-state>${esc(modeLabel())}</div>
      </div>
      <div class="thread" data-thread></div>
      <div class="chips">${CHIPS.map(c => `<button class="chip" data-q="${esc(c[1])}">${esc(c[0])}</button>`).join('')}</div>
      <form class="composer glass" data-composer>
        <textarea rows="1" placeholder="${live ? 'Talk to EDEN…' : 'Ask EDEN…'}" aria-label="Message EDEN"></textarea>
        <button class="send" type="submit" aria-label="Send">${ICONS.send}</button>
      </form>`;
    const canvas = $('.orb-mid canvas', el);
    let orb;
    orb = mountOrb(canvas, { size: 104 }); orb.setLeanTarget(0, 1);
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    const thread = $('[data-thread]', el), ta = $('textarea', el), form = $('[data-composer]', el);
    const bubble = (who, text, meta) => {
      const m = document.createElement('div'); m.className = 'msg ' + who;
      m.innerHTML = (who === 'eden' ? md(text) : esc(text)) + (meta ? `<span class="meta">${esc(meta)}</span>` : '');
      thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m;
    };
    const setState = (s, label) => { orb?.setState(s); $('[data-state]', el).textContent = label; };
    const idle = () => setState(Rules.urgency() > .05 ? 'aware' : 'idle', modeLabel());
    $('[data-deep]', el)?.addEventListener('click', e => { edenDeep = !edenDeep; sessionStorage.setItem('iota.eden.deep', edenDeep ? '1' : '0'); e.currentTarget.classList.toggle('accent', edenDeep); e.currentTarget.setAttribute('aria-pressed', edenDeep); idle(); });

    // Pinned: today's briefing at the top. Then the last few live turns (auto-pruned after 12h), else the rules opener.
    const b0 = Rules.todaysBriefing('morning');
    if (b0) { const pb = bubble('eden', b0.md, 'morning briefing · pinned'); pb.classList.add('pinned'); }
    const hist = live ? Eden.history.slice(-6) : [];
    if (hist.length) { for (const m of hist) bubble(m.role === 'user' ? 'me' : 'eden', m.content); }
    setTimeout(() => { if (!hist.length && !b0) { bubble('eden', Rules.observation()); orb?.ripple(); } const w = Rules.dueWatches(new Date(), 3); if (w.length && !hist.length) setTimeout(() => { bubble('eden', 'Watching: ' + w.map(x => x.text).join(' · ') + '.', 'promise watcher'); }, 400); }, 250);

    ta.addEventListener('focus', () => setState('listening', 'listening'));
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; });
    ta.addEventListener('blur', () => idle());
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

    let busy = false;
    async function ask(q) {
      if (!q.trim() || busy) return;
      bubble('me', q);
      setState('thinking', live ? (edenDeep ? 'thinking hard…' : 'thinking…') : 'thinking');
      if (live) {
        busy = true; $('.send', form).disabled = true;
        try {
          let live_ = null;
          const res = await Eden.ask(q, { deep: edenDeep,
            onText: t => { if (!live_) { live_ = bubble('eden', ''); live_.classList.add('typing'); setState('speaking', modeLabel()); orb?.ripple(); } live_.innerHTML = md(t); thread.scrollTop = thread.scrollHeight; },
            onEvent: ev => { if (ev.type === 'tool') { if (live_) { live_.classList.remove('typing'); live_ = null; } const m = document.createElement('div'); m.className = 'msg act'; m.textContent = Eden.labelFor(ev); thread.appendChild(m); thread.scrollTop = thread.scrollHeight; } } });
          setState('speaking', modeLabel());
          const last = res.parts?.length ? res.parts[res.parts.length - 1] : res.text; if (live_) { live_.innerHTML = md(last); live_.classList.remove('typing'); } else bubble('eden', last);
          if (res.actions.length && current?.screen === 'eden') Store.emit('change');
        } catch (e) {
          setState('speaking', modeLabel());
          const msg = e.status === 401 ? 'That API key was rejected — check it in Settings.' : /credit|billing/i.test(e.message || '') ? 'Anthropic says the account has no credit — top up in the Console and I\'m back.' : e.status === 429 ? 'Rate-limited for a moment. Try again in a few seconds.' : e.status === 400 && /model/i.test(e.message || '') ? 'Model not available on that key yet — try again shortly.' : `Live mode hiccup (${e.message || 'network'}). Falling back to rules.`;
          bubble('eden', msg, 'error');
          const a = Rules.answer(q); if (a) bubble('eden', a, 'rules mode');
        } finally { busy = false; $('.send', form).disabled = false; }
        setTimeout(idle, 1400);
        return;
      }
      await new Promise(r => setTimeout(r, 420 + Math.random() * 300));
      const a = Rules.answer(q);
      setState('speaking', 'rules mode'); orb?.ripple();
      if (a) bubble('eden', a);
      else {
        const m = bubble('eden', 'That one\'s above my offline pay grade. Add an API key in Settings and I answer these live — or capture it and I\'ll file it.', 'live mode is off');
        const acts = document.createElement('div'); acts.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
        acts.innerHTML = `<button class="chip accent" data-act="settings">Turn on live mode</button><button class="chip" data-act="capture">Capture it</button>`;
        m.appendChild(acts);
        $('[data-act=settings]', acts).addEventListener('click', () => go('#/settings'));
        $('[data-act=capture]', acts).addEventListener('click', () => openCapture(null, q));
      }
      setTimeout(idle, 1400);
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
          <div class="card account-card">
            <div class="who"><b>${esc(SB.user?.email || 'Not signed in')}</b><br><span class="sub">Synced ${esc(synced)}${Store.pending ? ` · ${Store.pending} pending` : ''}</span></div>
            <div class="acts"><button class="btn ghost" data-sync>Sync</button><button class="btn ghost" data-signout style="color:var(--danger)">Sign out</button></div>
          </div>
          <details class="pw-change"><summary class="sub">Change password</summary>
            <form data-pwform autocomplete="off" style="margin-top:8px">
              <div class="field"><div class="row2"><div><label for="pw1">New password</label><input id="pw1" name="pw1" type="password" autocomplete="new-password" minlength="8" required></div><div><label for="pw2">Again</label><input id="pw2" name="pw2" type="password" autocomplete="new-password" minlength="8" required></div></div></div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="field-note" style="padding:0" data-pwmsg>At least 8 characters. Same login as the karting app.</span><button class="btn" type="submit">Update</button></div>
            </form>
          </details>
        </div>
        ${s.bases ? `<div class="setting-group"><h3>Base</h3><div class="seg" data-bases>${Object.entries(s.bases).map(([k, b]) => `<button data-base="${k}" class="${s.activeBase === k ? 'active' : ''}">${esc(b.label || k)}</button>`).join('')}</div><p class="field-note">Switches home, employer, work address and travel times in one go.${s.moveBackDate ? ` Move back to Manchester pencilled for ${esc(s.moveBackDate)}.` : ''}</p></div>` : ''}
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
          <p class="field-note">With a key, EDEN answers live (Sonnet 5; "Think harder" uses Opus 5) and can add/move/delete things for you. The key never leaves this browser's localStorage. Get one at console.anthropic.com → API Keys.</p>
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b>Live usage</b><br><span class="sub">${Eden.usage.calls} calls · ${(Eden.usage.in + Eden.usage.cin + Eden.usage.cw).toLocaleString()} in · ${Eden.usage.out.toLocaleString()} out · ≈ ${Eden.usage.usd.toFixed(3)} (~£${(Eden.usage.usd * 0.78).toFixed(2)})</span></div><div style="display:flex;gap:6px"><button class="btn ghost" data-eden-clear>Clear chat</button><button class="btn ghost" data-eden-reset>Reset</button></div></div>
        </div>
        <div class="setting-group"><h3>Data</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" data-export>Export JSON</button>
            <button class="btn ghost" data-reset style="color:var(--danger)">Clear local cache</button>
          </div>
          <p class="field-note">Everything lives in the <code>iota</code> schema in Supabase, locked to your account. This device keeps a cached copy for offline reads; offline writes queue and sync when you're back.</p>
        </div>
        <div class="setting-group"><h3>About</h3>
          <div class="card" style="display:flex;gap:14px;align-items:center"><img src="./assets/brand-512.png" alt="" width="64" height="64" style="border-radius:16px"><div><b>Iota</b> · v0.7<br><span class="sub">The smallest thing that runs everything. EDEN at the centre — she's the friend who happens to run your life.</span></div></div>
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
    el.querySelectorAll('[data-base]').forEach(b => b.addEventListener('click', () => { window.applyBase(b.dataset.base); toast('Base: ' + b.textContent); render(); }));
    $('[data-eden-clear]', el).addEventListener('click', () => { Eden.clearHistory(); toast('EDEN chat history cleared'); });
    $('[data-eden-reset]', el).addEventListener('click', () => { Eden.resetUsage(); toast('Usage counter reset'); render(); });
    $('[data-sync]', el).addEventListener('click', async () => { toast('Syncing…'); const ok = await Store.sync(); toast(ok ? 'Synced' : 'Sync failed'); render(); });
    $('[data-signout]', el).addEventListener('click', async () => { await SB.signOut(); Store.clearLocal(); location.hash = '#/'; boot(); });
    const pwf = $('[data-pwform]', el), pwmsg = $('[data-pwmsg]', el);
    pwf.addEventListener('submit', async e => {
      e.preventDefault(); const a = pwf.pw1.value, b = pwf.pw2.value;
      if (a.length < 8) { pwmsg.textContent = 'Needs at least 8 characters.'; return; }
      if (a !== b) { pwmsg.textContent = 'Those two don\'t match.'; return; }
      const btn = $('button[type=submit]', pwf); btn.disabled = true; pwmsg.textContent = 'Updating…';
      try { await SB.changePassword(a); pwf.reset(); pwmsg.textContent = 'Password changed. It applies to the karting app too.'; toast('Password changed'); }
      catch (ex) { pwmsg.textContent = ex.message || 'Could not change password.'; }
      finally { btn.disabled = false; }
    });
    return el;
  }
  /** Switch the active base (Sheffield summer / Manchester term): copies that base's values into the flat settings. */
  window.applyBase = function (name) {
    const s = Store.settings, b = s.bases && s.bases[name]; if (!b) return false;
    Store.setSetting('activeBase', name);
    for (const k of ['homeAddress', 'employer', 'workAddress', 'travelMode', 'travelWorkMin', 'travelCampusMin', 'travelTrackMin']) if (b[k] != null) Store.setSetting(k, b[k]);
    return true;
  };
  function applyAppearance() {
    const s = Store.settings;
    document.documentElement.style.setProperty('--aurora-intensity', s.auroraIntensity);
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
  }

  // ------------------------------------------------------------
  // Quick capture (long-press orb anywhere)
  // ------------------------------------------------------------
  /** Time-off request sheet. */
  function openTimeOff(onDone) {
    const sheet = document.createElement('div'); sheet.className = 'sheet';
    const today = new Date().toLocaleDateString('en-CA');
    sheet.innerHTML = `<div class="sheet-backdrop" data-close></div>
      <form class="sheet-panel glass" autocomplete="off">
        <div class="sheet-grip"></div>
        <div class="sheet-title">Time off to book</div>
        <div class="field"><label>What</label><input name="title" required placeholder="e.g. BUKC Round 1, exam, home for the weekend"></div>
        <div class="field"><div class="row2"><div><label>From</label><input name="starts_on" type="date" required min="${today}"></div><div><label>To</label><input name="ends_on" type="date" required min="${today}"></div></div></div>
        <div class="field"><div class="row2"><div><label>Ask by</label><input name="ask_by" type="date"></div><div><label>Reason</label><select name="reason"><option value="kart">Karting</option><option value="uni">Uni</option><option value="personal" selected>Personal</option><option value="holiday">Holiday</option><option value="other">Other</option></select></div></div></div>
        <div class="field"><label>Note (optional)</label><input name="notes" placeholder="who to ask, why, anything useful"></div>
        <div class="sheet-row"><span class="hint">Shows in EDEN's reminders before the ask-by date.</span><button class="btn primary" type="submit">Add</button></div>
      </form>`;
    document.body.appendChild(sheet);
    const f = sheet.querySelector('form');
    f.starts_on.addEventListener('change', () => { if (!f.ends_on.value || f.ends_on.value < f.starts_on.value) f.ends_on.value = f.starts_on.value; });
    sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => sheet.remove()));
    f.addEventListener('submit', e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries());
      if (!d.title.trim() || !d.starts_on) return;
      if (!d.ends_on || d.ends_on < d.starts_on) d.ends_on = d.starts_on;
      Store.insert('time_off', { title: d.title.trim(), starts_on: d.starts_on, ends_on: d.ends_on, ask_by: d.ask_by || null, reason: d.reason || 'personal', status: 'needed', notes: d.notes || null });
      sheet.remove(); toast('Added — EDEN will remind you to ask'); onDone?.();
    });
    setTimeout(() => f.title.focus(), 60);
  }
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
    capHint.textContent = `→ ${c.label}${when ? ' · ' + Rules.fmtWhen(when) : ''}${c.row.kind || c.row.section ? ' · ' + kindName(c.row.kind || c.row.section) : ''}`;
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
  // Splash: EDEN wakes up (thinking → idle), then the Ring fades in beneath her
  const splashOrb = new EdenOrb($('#splashOrb'), { size: 260, state: 'thinking' }); splashOrb.start();
  const splashMs = sessionStorage.getItem('iota.booted') ? 500 : 1700;
  setTimeout(() => splashOrb.setState('speaking'), Math.max(200, splashMs - 500));
  setTimeout(() => { $('#splash').classList.add('gone'); setTimeout(() => splashOrb.destroy(), 800); }, splashMs);
  sessionStorage.setItem('iota.booted', '1');
  // Re-evaluate urgency every minute (drives orb 'aware' + Ring badges); resync every 5 min when visible
  setInterval(() => { refreshOrbs(); if (current?.screen === 'ring') render(); }, 60000);
  setInterval(() => { if (!document.hidden && SB.session) Store.sync(); }, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && SB.session && Store.syncedAt && Date.now() - new Date(Store.syncedAt) > 60000) Store.sync(); });
  // PWA
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
