/* ============================================================
   IOTA 1.0 — app shell
   Router · Today · Tasks · Calendar · EDEN · Areas · Settings ·
   quick add · command palette · login · boot
   ============================================================ */
(function () {
  'use strict';
  const { MOD, $, $$, esc, icon, mark, dial, fmtTime, fmtDay, dayKey, relDay, until, SECTIONS, kindName, kindVar, taskRow, eventRow, toast, sheet, haptic, md, empty, TICK } = UI;
  const app = $('#app');
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
  const isDesk = () => matchMedia('(min-width: 900px)').matches;
  const isWide = () => matchMedia('(min-width: 1180px)').matches;

  // ------------------------------------------------------------
  // Routing
  // ------------------------------------------------------------
  function parseRoute() {
    const h = (location.hash || '#/').replace(/^#\/?/, '');
    const [a, b, c] = h.split('/');
    if (!a || a === 'today') return { screen: 'today', nav: 'today' };
    if (a === 'tasks') return { screen: 'tasks', view: b || null, nav: 'tasks' };
    if (a === 'task' && b) return { screen: 'tasks', sel: b, nav: 'tasks' };
    if (a === 'calendar') return { screen: 'calendar', nav: 'calendar' };
    if (a === 'eden') return { screen: 'eden', nav: 'eden' };
    if (a === 'areas') return { screen: 'areas', nav: 'areas' };
    if (a === 'settings') return { screen: 'settings', pane: b || null, nav: 'settings' };
    if (a === 'area' && b) { const d = Tasks.areaDef(decodeURIComponent(b)); if (!d) return { redirect: '#/areas' }; return { screen: 'area', key: d.key, nav: 'area:' + d.slug, group: d.group }; }
    if (a === 'personal' && b === 'week') return { redirect: '#/calendar' };
    if (a === 'kart') return { redirect: '#/uni/societies' };
    if (a === 'society' && b) return { screen: 'society', id: b, nav: 'uni' };
    if (a === 'module' && b === 'past' && c) return { screen: 'pastmodule', id: c, nav: 'uni' };
    if (a === 'module' && b) { const m = Store.get('modules', b); if (m && m.status === 'completed') return { redirect: '#/module/past/' + b }; return { screen: 'module', id: b, nav: 'uni' }; }
    if (SECTIONS[a]) { const tabs = SECTIONS[a].tabs.map(t => t[0]); return { screen: 'hub', sec: a, tab: tabs.includes(b) ? b : tabs[0], nav: a }; }
    return { screen: 'today', nav: 'today' };
  }
  const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
  window.addEventListener('hashchange', () => render({ enter: true }));

  // ------------------------------------------------------------
  // Shell
  // ------------------------------------------------------------
  let route = null, shellBuilt = false;
  function awareSection(now = new Date()) {
    const nx = Store.upcoming(now, 5).find(x => !x.isTask && new Date(x.starts_at) > now);
    return nx && (new Date(nx.starts_at) - now) < 2 * 3600000 ? (nx.kind === 'kart' ? 'uni' : nx.kind) : '';
  }
  function statusHTML() {
    const st = Store.status, pend = Store.pending;
    const label = !SB.session ? 'Offline mode' : st === 'online' ? (pend ? `${pend} to sync` : 'Synced') : st === 'unreachable' ? 'Server unreachable' : st === 'offline' ? 'Offline' : 'Connecting';
    return `<span class="st ${SB.session ? st : 'offline'}" title="${esc(Store.syncedAt ? 'Last synced ' + new Date(Store.syncedAt).toLocaleString('en-GB') : 'Not synced yet')}"><i></i>${esc(label)}</span>`;
  }
  function buildShell() {
    app.innerHTML = `<div class="shell">
      <nav class="side" aria-label="Iota">
        <div class="brand">${mark('', awareSection())}<span>Iota</span><span data-status class="st-wrap" style="margin-left:auto"></span></div>
        <div class="quick"><button class="btn" data-add>${icon('plus', 'i-sm')}New task<kbd>N</kbd></button><button class="btn" data-palette style="flex:0 0 auto;width:auto" aria-label="Search">${icon('search', 'i-sm')}<kbd>${MOD} K</kbd></button></div>
        <a href="#/" data-nav="today">${icon('today')}Today</a>
        <a href="#/tasks" data-nav="tasks">${icon('tasks')}Tasks<span class="count" data-count-tasks></span></a>
        <a href="#/calendar" data-nav="calendar">${icon('calendar')}Calendar</a>
        <a href="#/eden" data-nav="eden">${mark('mono', '')}EDEN</a>
        <h6>Areas</h6>
        <div class="side-areas" data-side-areas></div>
        <div class="foot"><a href="#/settings" data-nav="settings">${icon('settings')}Settings</a></div>
      </nav>
      <main class="main" id="main" tabindex="-1"></main>
      <nav class="tabbar" aria-label="Iota">
        <a href="#/" data-nav="today">${icon('today')}<span>Today</span></a>
        <a href="#/tasks" data-nav="tasks">${icon('tasks')}<span>Tasks</span></a>
        <a href="#/eden" data-nav="eden" class="eden-tab" aria-label="EDEN (hold to add a task)">${mark('', awareSection())}<span>EDEN</span></a>
        <a href="#/calendar" data-nav="calendar">${icon('calendar')}<span>Calendar</span></a>
        <a href="#/areas" data-nav="areas">${icon('areas')}<span>Areas</span></a>
      </nav>
    </div>`;
    $$('[data-add]', app).forEach(b => b.addEventListener('click', () => openQuickAdd()));
    $('[data-side-areas]', app).addEventListener('click', e => { const b = e.target.closest('[data-sg-toggle]'); if (!b) return; e.preventDefault(); const k = b.dataset.sgToggle; sideOpen[k] = !(sideOpen[k] ?? true); LS.set('iota.sideOpen', sideOpen); updateShell(); });
    $$('[data-palette]', app).forEach(b => b.addEventListener('click', () => openPalette()));
    // hold EDEN tab → quick add
    const et = $('.tabbar .eden-tab', app); let holdT = 0, held = false;
    et.addEventListener('pointerdown', () => { held = false; holdT = setTimeout(() => { held = true; haptic(); openQuickAdd(); }, 450); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => et.addEventListener(e, () => clearTimeout(holdT)));
    et.addEventListener('click', e => { if (held) e.preventDefault(); });
    et.addEventListener('contextmenu', e => e.preventDefault());
    shellBuilt = true;
  }
  // Sidebar areas: three collapsible groups, each with its finer areas and open counts.
  const sideOpen = LS.get('iota.sideOpen', {});
  function openCounts(now = new Date()) { const c = {}; for (const t of Tasks.open(now)) { const a = Tasks.area(t); c[a] = (c[a] || 0) + 1; } return c; }
  function sideAreasHTML() {
    const cnt = openCounts(), defs = Tasks.areaDefs().filter(d => !d.hidden);
    return Tasks.GROUPS.map(([g, name]) => {
      const items = defs.filter(d => d.group === g), open = sideOpen[g] ?? true;
      const total = Tasks.open().filter(t => { const s = Tasks.sectionOf(t); return g === 'uni' ? s === 'uni' || s === 'kart' : s === g; }).length;
      return `<div class="sg ${open ? 'open' : ''}">
        <div class="sg-h"><a href="#/${g}" data-nav="${g}"><i class="dot ${g}"></i>${name}${!open && total ? `<span class="count">${total}</span>` : ''}</a><button class="sg-t" data-sg-toggle="${g}" aria-expanded="${open}" aria-label="${open ? 'Collapse' : 'Expand'} ${name}">${icon('down', 'i-sm')}</button></div>
        ${open ? `<div class="sg-items">${items.map(d => `<a href="#/area/${d.slug}" data-nav="area:${d.slug}">${esc(d.name)}${cnt[d.key] ? `<span class="count">${cnt[d.key]}</span>` : ''}</a>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
  }
  function updateShell() {
    const nav = route.nav === 'hub' ? route.sec : route.nav;
    const sa = $('[data-side-areas]', app); if (sa) sa.innerHTML = sideAreasHTML();
    $$('[data-nav]', app).forEach(a => { const k = a.dataset.nav; const on = k === nav || (k === 'areas' && (['uni', 'work', 'personal', 'settings'].includes(nav) || String(nav).startsWith('area:'))) || (k === route.group && String(nav).startsWith('area:') && sideOpen[k] === false); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const n = Tasks.open().length; const c = $('[data-count-tasks]', app); if (c) c.textContent = n || '';
    const s = $('[data-status]', app); if (s) s.innerHTML = statusHTML();
    const aw = awareSection(); $$('.tabbar .mark, .side .brand .mark', app).forEach(m => { if (aw) m.dataset.aware = aw; else delete m.dataset.aware; });
  }

  const SCREENS = {};
  function render(opts = {}) {
    const r = parseRoute();
    if (r.redirect) { history.replaceState(null, '', r.redirect); return render(opts); }
    const prevScreen = route && route.screen;
    route = r;
    if (!shellBuilt) buildShell();
    updateShell();
    const main = $('#main');
    const scr = SCREENS[r.screen] || SCREENS.today;
    const keepScroll = !opts.enter && prevScreen === r.screen;
    const y = window.scrollY;
    main.innerHTML = '';
    const page = document.createElement('div');
    page.className = 'page' + (r.screen === 'today' || r.screen === 'tasks' || r.screen === 'calendar' ? ' wide' : '') + (r.screen === 'area' ? ' area-page' : '') + (r.screen === 'settings' ? ' settings-page' : '') + (opts.enter && prevScreen !== r.screen ? ' page-enter' : '');
    main.appendChild(page);
    scr(page, r);
    if (keepScroll) window.scrollTo(0, y); else if (opts.enter) window.scrollTo(0, 0);
    document.title = ({ today: 'Today', tasks: 'Tasks', calendar: 'Calendar', eden: 'EDEN', areas: 'Areas', settings: 'Settings', area: Tasks.areaDef(r.key || '')?.name, hub: SECTIONS[r.sec]?.name, module: Store.get('modules', r.id)?.name, pastmodule: Store.get('modules', r.id)?.name, society: Store.get('societies', r.id)?.name }[r.screen] || 'Iota') + ' · Iota';
  }
  // Re-render on data change, but never under the user's cursor.
  let rrT = 0, animating = 0;
  function softRender() {
    clearTimeout(rrT);
    rrT = setTimeout(() => {
      if (!route || animating) return softRender();
      if (route.screen === 'settings' && (window.__iotaQuiet || 0) > Date.now()) { updateShell(); return; }
      const a = document.activeElement;
      if (a && $('#main')?.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; // typing — leave it
      if (route.screen === 'eden') { updateShell(); return; }
      render();
    }, 60);
  }

  // ------------------------------------------------------------
  // Task actions
  // ------------------------------------------------------------
  function completeTask(id, rowEl) {
    const t = Store.get('tasks', id); if (!t) return;
    if (t.status === 'done') { Store.update('tasks', id, { status: 'open', done_at: null }); toast('Back on the list'); return; }
    haptic();
    const commit = () => {
      Store.update('tasks', id, { status: 'done', done_at: new Date().toISOString() });
      toast(Tasks.doneLine(t), { undo: () => { Store.update('tasks', id, { status: 'open', done_at: null }); } });
    };
    const wrap = rowEl?.closest('.row-wrap');
    document.body.classList.add('suppress-hover');
    setTimeout(() => { const off = () => { document.body.classList.remove('suppress-hover'); removeEventListener('pointermove', off); }; addEventListener('pointermove', off); }, 1100);
    if (!wrap || matchMedia('(prefers-reduced-motion: reduce)').matches || Store.settings.reduceMotion) { commit(); return; }
    animating++;
    wrap.querySelector('.row')?.classList.add('done');
    rowEl.closest('.nextup')?.querySelector('.check')?.classList.add('on');
    setTimeout(() => { wrap.classList.add('gone'); }, 620);
    setTimeout(() => { animating--; commit(); }, 900);
  }
  function snoozeOptions(now = new Date()) {
    const hm = (v, dh) => { const [h, m] = String(v || dh).split(':').map(Number); return [isNaN(h) ? +dh.split(':')[0] : h, m || 0]; };
    const [eh, em] = hm(Store.settings.snoozeEvening, '18:00'), [mh, mm] = hm(Store.settings.snoozeMorning, '09:00');
    const at = (d, h, m = 0) => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x; };
    const sat = new Date(now); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7)); sat.setHours(10, 0, 0, 0);
    const mon = new Date(now); mon.setDate(mon.getDate() + ((8 - mon.getDay()) % 7 || 7)); mon.setHours(9, 0, 0, 0);
    const opts = [];
    if (now < at(0, eh, em) && now.getHours() >= 5) opts.push(['This evening', at(0, eh, em)]);
    opts.push(['Tomorrow', at(now.getHours() < 5 ? 0 : 1, mh, mm)], ['Saturday', sat], ['Next week', mon]);
    mon.setHours(mh, mm);
    return opts;
  }
  function snoozeTask(id, until) {
    const t = Store.get('tasks', id); if (!t) return;
    const prev = t.snoozed_until || null;
    Store.update('tasks', id, { snoozed_until: until ? until.toISOString() : null });
    toast(until ? `Snoozed until ${relDay(until)} ${fmtTime(until)}` : 'Unsnoozed', { undo: () => Store.update('tasks', id, { snoozed_until: prev }) });
  }
  function deleteTask(id) {
    const t = Store.get('tasks', id); if (!t) return;
    Store.remove('tasks', id);
    toast('Deleted', { undo: () => Store.restore('tasks', t) });
  }
  /** Wire task rows inside a container: tick, open, swipe. */
  function wireTaskRows(root, onOpen) {
    $$('[data-check]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); completeTask(b.dataset.check, b.closest('.row')); }));
    $$('[data-open]', root).forEach(r => r.addEventListener('click', e => { if (e.target.closest('a,button')) return; onOpen ? onOpen(r.dataset.open) : openTask(r.dataset.open); }));
    if (!matchMedia('(pointer: coarse)').matches) return;
    $$('.row-wrap', root).forEach(w => {
      const row = w.querySelector('.row'); if (!row || row.classList.contains('done')) return;
      let x0 = 0, y0 = 0, dx = 0, on = false, locked = null;
      row.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; on = true; locked = null; }, { passive: true });
      row.addEventListener('touchmove', e => {
        if (!on) return; const t = e.touches[0]; const ddx = t.clientX - x0, ddy = t.clientY - y0;
        if (locked === null && (Math.abs(ddx) > 8 || Math.abs(ddy) > 8)) locked = Math.abs(ddx) > Math.abs(ddy) * 1.3 ? 'x' : 'y';
        if (locked !== 'x') return;
        dx = Math.max(-120, Math.min(120, ddx)); row.style.transition = 'none'; row.style.transform = `translateX(${dx}px)`;
        row.style.background = dx > 60 ? 'color-mix(in srgb, var(--ok) 12%, var(--bg))' : dx < -60 ? 'var(--fill-2)' : '';
      }, { passive: true });
      row.addEventListener('touchend', () => {
        if (!on) return; on = false; row.style.transition = ''; row.style.transform = ''; row.style.background = '';
        const id = w.dataset.task;
        if (dx > 70) completeTask(id, row);
        else if (dx < -70) { const o = snoozeOptions()[0]; snoozeTask(id, o[1]); }
      });
    });
  }

  // ------------------------------------------------------------
  // Task detail (pane on wide screens, sheet elsewhere)
  // ------------------------------------------------------------
  const EFFORTS = [0, 5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 360, 900];
  function detailHTML(t) {
    const now = new Date(), d = t.due ? new Date(t.due) : null;
    const defs = Tasks.areaDefs(), cur = Tasks.area(t);
    const areaOpts = Tasks.GROUPS.map(([g, n]) => `<optgroup label="${n}">${defs.filter(d => d.group === g && (!d.hidden || d.key === cur)).map(d => `<option value="${esc(d.key)}" ${d.key === cur ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</optgroup>`).join('');
    const reason = Tasks.reason(t, now);
    return `<div class="detail" data-detail="${t.id}">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="padding-top:4px">${UI.checkHTML(t).replace('class="check', `class="check ${t.status === 'done' ? 'on' : ''}`)}</div>
        <textarea class="dt" rows="1" data-f="title" aria-label="Title">${esc(t.title)}</textarea>
      </div>
      <dl class="props">
        <dt>Priority</dt><dd><div class="pchoice" role="radiogroup" aria-label="Priority">${[1, 2, 3, 4].map(p => `<button role="radio" aria-checked="${Tasks.pr(t) === p}" class="${Tasks.pr(t) === p ? 'on' : ''}" data-p="${p}"><span class="check p${p}" aria-hidden="true"></span>P${p}</button>`).join('')}</div></dd>
        <dt>Due</dt><dd><input type="date" data-f="date" value="${d ? dayKey(d) : ''}" aria-label="Due date"><input type="time" data-f="time" value="${d ? fmtTime(d) : ''}" aria-label="Due time"><label class="toggle" style="margin-left:4px"><input type="checkbox" data-f="hard" ${t.due_kind === 'hard' ? 'checked' : ''}>Hard deadline</label></dd>
        <dt>Effort</dt><dd><select data-f="effort" aria-label="Effort">${EFFORTS.map(m => `<option value="${m}" ${(+t.duration_min || 0) === m ? 'selected' : ''}>${m ? Tasks.fmtMins(m) : '—'}</option>`).join('')}${t.duration_min && !EFFORTS.includes(+t.duration_min) ? `<option selected value="${t.duration_min}">${Tasks.fmtMins(+t.duration_min)}</option>` : ''}</select></dd>
        <dt>Area</dt><dd><select data-f="area" aria-label="Area">${areaOpts}</select><span class="note" style="display:inline-flex;align-items:center;gap:6px;margin-left:4px"><i class="dot ${Tasks.sectionOf(t)}"></i>${esc(SECTIONS[Tasks.sectionOf(t) === 'kart' ? 'uni' : Tasks.sectionOf(t)]?.name || 'Personal')}</span></dd>
        ${t.source || t.link ? `<dt>From</dt><dd>${t.link ? `<a class="link" href="${esc(t.link)}" target="_blank" rel="noopener" style="display:inline-flex;gap:6px;align-items:center">${icon(UI.SRC_ICON[t.source] || 'out', 'i-sm')}${esc(t.source || 'Link')}${icon('out', 'i-sm')}</a>` : `<span class="note">${esc(t.source)}</span>`}</dd>` : ''}
        ${t.snoozed_until && new Date(t.snoozed_until) > now ? `<dt>Snoozed</dt><dd><span class="note">until ${esc(relDay(t.snoozed_until))} ${esc(fmtTime(t.snoozed_until))}</span><button class="btn sm ghost" data-unsnooze>Wake</button></dd>` : ''}
      </dl>
      ${reason || t.notes ? `<div class="eden-note">${mark()}<div>${reason ? `<p>${esc(reason)}</p>` : ''}${t.notes ? `<p>${esc(t.notes)}</p>` : ''}</div></div>` : ''}
      <div class="field" style="margin-top:14px" data-notes-wrap hidden><label for="dn-${t.id}">Notes</label><textarea id="dn-${t.id}" rows="4" data-f="notes" placeholder="Anything future-you needs">${esc(t.notes || '')}</textarea></div>
      <button class="link" data-edit-notes style="margin-top:12px">${t.notes ? 'Edit notes' : 'Add a note'}</button>
      <div class="acts">
        <button class="btn primary" data-done>${icon('check', 'i-sm')}${t.status === 'done' ? 'Reopen' : 'Complete'}</button>
        <button class="btn" data-snooze aria-expanded="false">${icon('moon', 'i-sm')}Snooze</button>
        <button class="btn ghost danger" data-del style="margin-left:auto">${icon('trash', 'i-sm')}Delete</button>
      </div>
      <div class="snooze-menu" data-snooze-menu hidden>${snoozeOptions().map(([l, d], i) => `<button class="chip" data-sn="${i}">${esc(l)} <span class="n">${esc(fmtDay(d, { weekday: 'short' }))} ${esc(fmtTime(d))}</span></button>`).join('')}</div>
    </div>`;
  }
  function wireDetail(root, id, onDone) {
    const t = () => Store.get('tasks', id);
    const f = k => $(`[data-f="${k}"]`, root);
    const ta = f('title');
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; fit(); ta.addEventListener('input', fit);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ta.blur(); } });
    ta.addEventListener('change', () => { const v = ta.value.trim(); if (v && v !== t().title) Store.update('tasks', id, { title: v }); });
    $$('[data-p]', root).forEach(b => b.addEventListener('click', () => { Store.update('tasks', id, { priority: +b.dataset.p }); $$('[data-p]', root).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); const c = $('[data-check]', root); c.className = c.className.replace(/p\d/, 'p' + b.dataset.p); }));
    const saveDue = () => {
      const dv = f('date').value, tv = f('time').value;
      if (!dv) { Store.update('tasks', id, { due: null, due_kind: null }); return; }
      const d = new Date(`${dv}T${tv || '18:00'}:00`);
      Store.update('tasks', id, { due: d.toISOString(), due_kind: f('hard').checked ? 'hard' : 'soft' });
      if (!tv) f('time').value = '18:00';
    };
    f('date').addEventListener('change', saveDue); f('time').addEventListener('change', saveDue); f('hard').addEventListener('change', saveDue);
    f('effort').addEventListener('change', () => Store.update('tasks', id, { duration_min: +f('effort').value || null }));
    f('area').addEventListener('change', () => { const a = f('area').value; Store.update('tasks', id, { area: a, section: Tasks.AREAS[a] || t().section || 'personal' }); });
    f('notes').addEventListener('change', () => Store.update('tasks', id, { notes: f('notes').value.trim() || null }));
    $('[data-edit-notes]', root).addEventListener('click', e => { $('[data-notes-wrap]', root).hidden = false; e.currentTarget.hidden = true; const n = f('notes'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    $('[data-check]', root).addEventListener('click', () => { completeTask(id); onDone?.(); });
    $('[data-done]', root).addEventListener('click', () => { completeTask(id); onDone?.(); });
    $('[data-del]', root).addEventListener('click', () => { deleteTask(id); onDone?.(); });
    $('[data-unsnooze]', root)?.addEventListener('click', () => { snoozeTask(id, null); onDone?.(); });
    const menu = $('[data-snooze-menu]', root);
    $('[data-snooze]', root).addEventListener('click', e => { menu.hidden = !menu.hidden; e.currentTarget.setAttribute('aria-expanded', !menu.hidden); });
    const opts = snoozeOptions();
    $$('[data-sn]', root).forEach(b => b.addEventListener('click', () => { snoozeTask(id, opts[+b.dataset.sn][1]); onDone?.(); }));
  }
  function openTask(id) {
    if (isWide() && route?.screen === 'tasks') { go('#/task/' + id); return; }
    const t = Store.get('tasks', id); if (!t) return;
    const s = sheet(detailHTML(t), { cls: 'detail-sheet', label: t.title, onClose: () => softRender() });
    wireDetail(s.panel, id, () => s.close());
  }

  // ------------------------------------------------------------
  // TODAY
  // ------------------------------------------------------------
  function termLabel(now = new Date()) {
    const s = Store.settings.termStart || '2026-10-05';
    const start = new Date(s + 'T00:00:00'), diff = (now - start) / 86400000;
    if (diff < 0 && diff >= -8) return 'Freshers\' week';
    if (diff < 0) return '';
    const wk = Math.floor(diff / 7) + 1, weeks = +Store.settings.termWeeks || 11;
    return wk <= weeks ? `Teaching week ${wk}` : '';
  }
  SCREENS.today = (page) => {
    const now = new Date();
    const top = Tasks.next(now);
    const ranked = Tasks.ranked(now);
    const pri = ranked.filter(t => t !== top).slice(0, 6);
    const todayItems = Store.today().filter(x => !x.isTask);
    const NE = Tasks.nextEvent(now), live = NE.live, nx = NE.nx, then = NE.then;
    const brief = Rules.todaysBriefing('morning', now);
    const load = Tasks.dayLoad(now, now);
    const later = Store.upcoming(now, 400).filter(x => new Date(x.starts_at) > new Date(new Date(now).setHours(23, 59, 59)));
    const horizon = later.filter(x => (new Date(x.starts_at) - now) < 14 * 86400000);
    const seen = {}; for (const x of later) if (!x.isTask && (new Date(x.starts_at) - now) < 35 * 86400000) seen[x.title] = (seen[x.title] || 0) + 1;
    // One-offs and real deadlines only: the weekly timetable, shifts and routines already live in Calendar.
    const coming = horizon.filter(x => x.isTask ? (x.due_kind === 'hard' || x._table === 'assessments') : (x._table !== 'shifts' && seen[x.title] === 1)).slice(0, 7);
    const h = now.getHours();
    const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' });
    const sub = [now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }), termLabel(now)].filter(Boolean).join(' · ');
    const nextBlock = live ? { lbl: 'Now', when: 'Now', sub: `until ${fmtTime(live.ends_at)}`, x: live } : nx ? { lbl: 'Next', when: fmtTime(nx.starts_at), sub: dayKey(nx.starts_at) !== dayKey(now) ? relDay(nx.starts_at, now) : `Next, ${until(nx.starts_at, now)}`, x: nx } : null;
    const clash = nextBlock && nextBlock.x === nx ? NE.overlap.filter(x => x !== NE.alongside) : [];
    const dialPhone = dial(now, {});
    const scheduleHTML = todayItems.length ? `<div class="rows">${todayItems.map(x => eventRow(x, now)).join('')}</div>` : `<p class="note" style="padding:10px 0">Nothing timed today.</p>`;

    page.innerHTML = `<div class="today-grid"><div>
      <header>
        <h1 class="day-title">${esc(dayName)}</h1>
        <p class="day-sub">${esc(sub)}</p>
      </header>
      <div class="brief">${mark('', awareSection(now))}<div>
        <p>${brief ? md(brief.md) : Tasks.brief(now)}</p>
        <div class="src-line">${brief ? `Morning briefing, ${esc(fmtTime(brief.created_at || now))}` : 'From your calendar and task list'}<span class="phone-only">·</span><span class="phone-only">${statusHTML()}</span></div>
      </div></div>

      ${nextBlock ? `<div class="nowblock">
        <div>
          <div class="when"><span>${esc(nextBlock.when)}</span><small>${esc(nextBlock.sub)}</small></div>
          <div class="what"><i class="dot" style="--c:${kindVar(nextBlock.x.kind)};margin-right:8px;vertical-align:2px"></i>${esc(nextBlock.x.title)}</div>
          <div class="where">${esc([nextBlock.x.location, Rules.leaveBufferFor(nextBlock.x) && nextBlock.lbl === 'Next' && (new Date(nextBlock.x.starts_at) - now) < 3 * 3600000 ? `leave by ${fmtTime(new Date(new Date(nextBlock.x.starts_at) - Rules.leaveBufferFor(nextBlock.x) * 60000))}` : null].filter(Boolean).join(' · '))}</div>
          ${clash.length ? `<div class="clash">Overlaps <b>${esc(clash.map(x => x.title).join(', '))}</b></div>` : ''}
          ${then ? `<div class="then">Then <b>${esc(fmtTime(then.starts_at))}</b> ${esc(then.title)}</div>` : ''}
        </div>
        <div class="phone-dial">${dialPhone}</div>
      </div>` : ''}

      ${top ? `<section class="nextup section" aria-label="Do next">
        <div class="sh"><h2>Do next</h2><span class="meta">${esc(Tasks.areaName(top))}${Tasks.mins(top) ? ' · ' + Tasks.fmtMins(Tasks.mins(top)) : ''}</span></div>
        <div class="row-wrap" data-task="${top.id}"><div class="task-title row" style="display:flex;padding:0;min-height:0">${UI.checkHTML(top)}<span class="body"><span class="title" style="font-size:inherit;font-weight:inherit"><span class="strike">${esc(top.title)}</span></span></span></div></div>
        <p class="why">${esc(Tasks.reason(top, now) || top.notes || '')}</p>
        <div class="acts">
          <button class="btn primary" data-next-done>${icon('check', 'i-sm')}Done</button>
          <button class="btn" data-next-later>${icon('moon', 'i-sm')}Later</button>
          <button class="btn ghost" data-next-open>Details</button>
          ${top.link ? `<a class="btn ghost open-src" href="${esc(top.link)}" target="_blank" rel="noopener" aria-label="Open in ${esc(top.source || 'source')}">${icon('out', 'i-sm')}<span>Open ${esc(top.source || '')}</span></a>` : ''}
        </div>
      </section>` : ''}

      <section class="section" style="margin-top:34px">
        <div class="sh"><h2>Priorities</h2><span class="meta">${load.count ? `${Tasks.fmtMins(load.taskMin)} due today · ${Tasks.fmtMins(Math.round(load.free / 15) * 15)} free` : `${ranked.length} open`}</span><a class="more" href="#/tasks">All tasks ${icon('right', 'i-sm')}</a></div>
        ${pri.length ? `<div class="rows" data-rows>${pri.map(t => taskRow(t, { now })).join('')}</div>` : `<p class="note">Nothing else on the list.</p>`}
      </section>

      <section class="section rail-dup">
        <div class="sh"><h2>Schedule</h2><span class="meta">${todayItems.length ? `${todayItems.length} today` : ''}</span><a class="more" href="#/calendar">Calendar ${icon('right', 'i-sm')}</a></div>
        ${scheduleHTML}
      </section>

      ${coming.length ? `<section class="section">
        <div class="sh"><h2>Coming up</h2><span class="meta">next 14 days</span></div>
        <div class="rows">${coming.map(x => `<button class="row flat" data-ev="${x._table}:${x.id}"><span class="body"><span class="title" style="display:block">${esc(x.title)}</span><span class="meta"><span><i class="dot" style="--c:${kindVar(x.kind)}"></i>${x.isTask ? (x.due_kind === 'hard' || x._table === 'assessments' ? 'Deadline' : 'Due') : esc(x.location || kindName(x.kind))}</span></span></span><span class="trail">${esc(relDay(x.starts_at, now).replace(/day /, 'day, '))}<br><span style="color:var(--ink-3)">${esc(fmtTime(x.starts_at))}</span></span></button>`).join('')}</div>
      </section>` : ''}

      <section class="section phone-only">
        <div class="sh"><h2>Areas</h2></div>
        ${areaRows(now)}
      </section>
    </div>
    <aside class="today-rail" aria-label="Today at a glance">
      ${dial(now, { labels: true })}
      <div class="legend" style="margin-bottom:22px"><span><i class="dot uni"></i>University</span><span><i class="dot work"></i>Work</span><span><i class="dot personal"></i>Personal</span></div>
      <div class="sh" style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px"><h2 style="font-size:15px">Schedule</h2><a class="more link" href="#/calendar" style="margin-left:auto">Calendar</a></div>
      ${scheduleHTML}
    </aside></div>`;

    wireTaskRows(page);
    $$('[data-ev]', page).forEach(b => b.addEventListener('click', () => openItem(b.dataset.ev)));
    $$('[data-area]', page).forEach(b => b.addEventListener('click', () => go(b.dataset.area)));
    if (top) {
      const nu = $('.nextup', page);
      $('[data-next-done]', nu).addEventListener('click', () => completeTask(top.id, $('.row', nu)));
      $('[data-next-later]', nu).addEventListener('click', () => { const o = snoozeOptions()[0]; snoozeTask(top.id, o[1]); });
      $('[data-next-open]', nu).addEventListener('click', () => openTask(top.id));
    }
  };
  function areaRows(now = new Date()) {
    return `<div class="rows area-list">${Object.entries(SECTIONS).map(([k, S]) => {
      const nx = Store.upcoming(now, 60).find(x => (k === 'uni' ? ['uni', 'kart'].includes(x.kind) : x.kind === k) && new Date(x.ends_at || x.starts_at) > now);
      const nOpen = Tasks.open(now).filter(t => { const s = Tasks.sectionOf(t); return k === 'uni' ? s === 'uni' || s === 'kart' : s === k; }).length;
      return `<button class="row" data-area="#/${k}"><span class="lead"><i class="dot ${k}"></i></span><span class="body"><span class="title" style="display:block">${esc(S.name)}</span><span class="meta">${nx ? `<span>${esc(nx.isTask ? 'Due ' : '')}${esc(relDay(nx.starts_at, now))} ${esc(fmtTime(nx.starts_at))} · ${esc(nx.title)}</span>` : '<span>Nothing scheduled</span>'}</span></span><span class="trail">${nOpen ? `${nOpen} open` : ''}</span></button>`;
    }).join('')}</div>`;
  }

  // ------------------------------------------------------------
  // TASKS
  // ------------------------------------------------------------
  const tstate = LS.get('iota.tasksView', { view: 'next', area: '*' });
  const VIEWS = [['next', 'Next'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['all', 'By area'], ['done', 'Done']];
  SCREENS.tasks = (page, r) => {
    const now = new Date();
    if (r.view && VIEWS.some(v => v[0] === r.view)) tstate.view = r.view;
    LS.set('iota.tasksView', tstate);
    const all = Store.list('tasks');
    const openL = Tasks.open(now);
    const areaCounts = {}; for (const t of openL) { const a = Tasks.area(t); areaCounts[a] = (areaCounts[a] || 0) + 1; }
    const ORDER = Tasks.areaDefs().map(d => d.key), nameOf = k => Tasks.areaDef(k)?.name || k;
    const areaList = Object.entries(areaCounts).sort((a, b) => ((ORDER.indexOf(a[0]) + 1) || 99) - ((ORDER.indexOf(b[0]) + 1) || 99) || a[0].localeCompare(b[0]));
    const inArea = t => tstate.area === '*' || Tasks.area(t) === tstate.area;
    const soon = openL.filter(t => t.due && (new Date(t.due) - now) < 48 * 3600000).length;
    const sel = r.sel && isWide() ? r.sel : null;
    const selTask = sel ? Store.get('tasks', sel) : null;

    let body = '';
    const rowsOf = list => `<div class="rows" data-rows>${list.map(t => taskRow(t, { now, sel, showSource: true })).join('')}</div>`;
    if (tstate.view === 'next') {
      const list = Tasks.ranked(now).filter(inArea);
      body = list.length ? `<p class="note" style="margin:4px 0 6px">Ordered by EDEN: deadlines, priority, how long things take and what fits around your timetable.</p>${rowsOf(list.slice(0, 40))}${list.length > 40 ? `<p class="note" style="margin-top:12px">${list.length - 40} more in <a class="link" href="#/tasks/all">By area</a>.</p>` : ''}` : empty('Nothing here', tstate.area === '*' ? 'No open tasks. Enjoy it, or press N.' : `No open tasks in ${esc(nameOf(tstate.area))}.`);
    } else if (tstate.view === 'today') {
      const b = t => Tasks.bucket(t, now);
      const hot = openL.filter(inArea).filter(t => ['overdue', 'today'].includes(b(t))).sort((x, y) => Tasks.score(y, now) - Tasks.score(x, now));
      const load = Tasks.dayLoad(now, now);
      const sug = Tasks.ranked(now).filter(inArea).filter(t => !hot.includes(t)).slice(0, Math.max(3, 6 - hot.length));
      const over = load.taskMin > load.free;
      body = `<div class="load" style="margin:4px 0 8px"><span>${Tasks.fmtMins(load.taskMin) || '0m'} due today</span><span class="meter ${over ? 'over' : ''}"><i style="width:${Math.min(100, load.free ? load.taskMin / load.free * 100 : 100).toFixed(0)}%"></i></span><span>${Tasks.fmtMins(Math.round(load.free / 15) * 15) || 'no time'} free before ${String(+Store.settings.dayEndHour || 23).padStart(2, '0')}:00</span></div>`
        + (over ? `<p class="note" style="margin-bottom:6px">That's more than the day holds. Something moves — I'd move whatever isn't a hard deadline.</p>` : '')
        + (hot.length ? `<div class="group-h ${hot.some(t => b(t) === 'overdue') ? 'late' : ''}">Due today & overdue<span class="n">${hot.length}</span></div>${rowsOf(hot)}` : '')
        + (sug.length ? `<div class="group-h">Worth doing today<span class="n">${sug.length}</span></div>${rowsOf(sug)}` : '');
    } else if (tstate.view === 'upcoming') {
      const groups = {}; for (const t of openL.concat(all.filter(t => t.status === 'open' && t.snoozed_until && new Date(t.snoozed_until) > now)).filter(inArea)) { const k = Tasks.bucket(t, now); (groups[k] = groups[k] || []).push(t); }
      body = Tasks.BUCKETS.filter(([k]) => groups[k]?.length).map(([k, l]) => `<div class="group-h ${k === 'overdue' ? 'late' : ''}">${l}<span class="n">${groups[k].length}</span></div>${rowsOf(groups[k].sort((a, b) => (a.due ? new Date(a.due) : 8e15) - (b.due ? new Date(b.due) : 8e15) || Tasks.pr(a) - Tasks.pr(b)))}`).join('') || empty('Nothing upcoming', 'No open tasks match.');
    } else if (tstate.view === 'all') {
      const byArea = {}; for (const t of openL.filter(inArea)) (byArea[Tasks.area(t)] = byArea[Tasks.area(t)] || []).push(t);
      body = Object.entries(byArea).sort((a, b) => b[1].length - a[1].length).map(([a, list]) => `<div class="group-h"><i class="dot ${Tasks.sectionOf(list[0])}" style="align-self:center"></i><a class="link" style="color:inherit;font-size:inherit;font-weight:inherit" href="#/area/${Tasks.slug(a)}">${esc(nameOf(a))}</a><span class="n">${list.length}</span></div>${rowsOf(list.sort((x, y) => Tasks.score(y, now) - Tasks.score(x, now)))}`).join('') || empty('Nothing here', 'No open tasks.');
    } else if (tstate.view === 'done') {
      const done = all.filter(t => t.status === 'done' && inArea(t)).sort((a, b) => new Date(b.done_at || 0) - new Date(a.done_at || 0));
      body = done.length ? `<p class="note" style="margin:4px 0 6px">Tick again to put something back.</p>${rowsOf(done.slice(0, 60))}` : empty('Nothing finished yet', 'Completed tasks collect here, newest first.');
    }

    page.innerHTML = `
      <div class="head tasks-head"><div><h1>Tasks</h1><p class="sub">${openL.length} open${soon ? ` · ${soon} due in the next 48 hours` : ''}</p></div>
        <div class="acts"><button class="btn primary" data-add>${icon('plus', 'i-sm')}New task</button></div></div>
      <div class="tasks-layout ${selTask ? 'has-detail' : ''}">
        <div>
          <div class="seg-scroll" style="margin-bottom:10px"><div class="seg" role="tablist" aria-label="View">${VIEWS.map(([k, l]) => `<a href="#/tasks/${k}" role="tab" aria-selected="${tstate.view === k}" class="${tstate.view === k ? 'active' : ''}">${l}</a>`).join('')}</div></div>
          <div class="chips" role="group" aria-label="Filter by area" style="margin-bottom:6px">
            <button class="chip ${tstate.area === '*' ? 'on' : ''}" data-area-f="*">All <span class="n">${openL.length}</span></button>
            ${areaList.filter(([a], i) => tstate.allAreas || i < 8 || a === tstate.area).map(([a, n]) => `<button class="chip ${tstate.area === a ? 'on' : ''}" data-area-f="${esc(a)}"><i class="dot ${Tasks.AREAS[a] === 'kart' ? 'uni' : Tasks.AREAS[a] || 'personal'}"></i>${esc(nameOf(a))} <span class="n">${n}</span></button>`).join('')}
            ${areaList.length > 8 ? `<button class="chip" data-more-areas>${tstate.allAreas ? 'Fewer' : `${areaList.length - 8} more`}</button>` : ''}
          </div>
          ${body}
          <p class="note desk-only" style="margin-top:24px">Keys: <kbd>N</kbd> new · <kbd>J</kbd>/<kbd>K</kbd> move · <kbd>X</kbd> complete · <kbd>Enter</kbd> open · <kbd>${MOD} K</kbd> search</p>
        </div>
        ${selTask ? `<aside class="detail-pane" aria-label="Task detail"><div style="display:flex;justify-content:flex-end;margin-bottom:6px"><a class="btn icon ghost" href="#/tasks" aria-label="Close detail">${icon('x', 'i-sm')}</a></div>${detailHTML(selTask)}</aside>` : ''}
      </div>`;
    $('[data-add]', page).addEventListener('click', () => openQuickAdd({ area: tstate.area !== '*' ? tstate.area : null }));
    $$('[data-area-f]', page).forEach(b => b.addEventListener('click', () => { tstate.area = b.dataset.areaF; LS.set('iota.tasksView', tstate); render(); }));
    $('[data-more-areas]', page)?.addEventListener('click', () => { tstate.allAreas = !tstate.allAreas; LS.set('iota.tasksView', tstate); render(); });
    wireTaskRows(page);
    if (selTask) wireDetail($('.detail-pane', page), selTask.id, () => go('#/tasks'));
  };

  // keyboard: J/K/X/Enter in lists
  function focusRows() { return $$('#main .row.task'); }
  function moveFocus(d) {
    const rows = focusRows(); if (!rows.length) return;
    const i = rows.indexOf(document.activeElement.closest?.('.row.task'));
    const n = rows[Math.max(0, Math.min(rows.length - 1, i < 0 ? 0 : i + d))];
    n.focus(); n.scrollIntoView({ block: 'nearest' });
  }

  // ------------------------------------------------------------
  // CALENDAR
  // ------------------------------------------------------------
  const cal = LS.get('iota.cal2', { view: 'agenda', filter: ['uni', 'work', 'personal'], month: null, sel: null });
  const KINDS = [['uni', 'University'], ['work', 'Work'], ['personal', 'Personal']];
  const kindKey = k => k === 'kart' ? 'uni' : (['uni', 'work', 'personal'].includes(k) ? k : 'personal');
  SCREENS.calendar = (page) => {
    const now = new Date();
    cal.month = cal.month || dayKey(now).slice(0, 7);
    const items = Store.allTimed().filter(x => cal.filter.includes(kindKey(x.kind)) && (!x.isTask || cal.tasks || x.due_kind === 'hard' || x._table === 'assessments'));
    const strip = [...Array(7)].map((_, i) => { const d = new Date(now); d.setDate(d.getDate() + i); const k = dayKey(d); const kinds = [...new Set(items.filter(x => dayKey(x.starts_at) === k).map(x => x.kind))]; return `<button data-jump="${k}" class="${i === 0 ? 'today' : ''}"><span class="w">${'SMTWTFS'[d.getDay()]}</span><span class="n">${d.getDate()}</span><span class="load">${kinds.slice(0, 4).map(kd => `<i style="--c:${kindVar(kd)}"></i>`).join('')}</span></button>`; }).join('');
    let body = '';
    if (cal.view === 'agenda') {
      const from = new Date(now); from.setHours(0, 0, 0, 0);
      const to = new Date(from); to.setDate(to.getDate() + 28);
      const list = items.filter(x => new Date(x.ends_at || x.starts_at) >= from && new Date(x.starts_at) < to);
      const groups = new Map(); for (const x of list) { const k = dayKey(x.starts_at); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
      body = list.length ? [...groups.entries()].map(([k, arr]) => { const d = new Date(k + 'T12:00:00'); const lab = relDay(d, now); return `<div class="day-h ${k === dayKey(now) ? 'today' : ''}" id="d-${k}"><h3>${esc(lab)}</h3><span class="d">${lab === 'Today' || lab === 'Tomorrow' || /^\w+day$/.test(lab) ? esc(fmtDay(d, { day: 'numeric', month: 'short' })) : ''}</span></div><div class="rows">${arr.map(x => eventRow(x, now)).join('')}</div>`; }).join('') : empty('Nothing in the next four weeks', 'Nothing matches these filters.');
    } else {
      const [y, m] = cal.month.split('-').map(Number);
      const first = new Date(y, m - 1, 1), last = new Date(y, m, 0), pad = (first.getDay() + 6) % 7;
      const byDay = new Map(); for (const x of items) { const k = dayKey(x.starts_at); if (k.startsWith(cal.month)) { if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(x); } }
      const selK = cal.sel && cal.sel.startsWith(cal.month) ? cal.sel : (dayKey(now).startsWith(cal.month) ? dayKey(now) : null);
      let cells = ''; for (let i = 0; i < pad; i++) cells += '<div class="cell pad"></div>';
      for (let d = 1; d <= last.getDate(); d++) {
        const k = `${cal.month}-${String(d).padStart(2, '0')}`, arr = byDay.get(k) || [];
        cells += `<button class="cell ${k === dayKey(now) ? 'today' : ''} ${k === selK ? 'sel' : ''}" data-day="${k}" aria-label="${esc(fmtDay(k + 'T12:00:00', { weekday: 'long', day: 'numeric', month: 'long' }))}, ${arr.length} items"><span class="n">${d}</span><span class="dots">${[...new Set(arr.map(x => x.kind))].slice(0, 4).map(kd => `<i style="--c:${kindVar(kd)}"></i>`).join('')}</span><span class="lines">${arr.slice(0, 3).map(x => `<span style="--c:${kindVar(x.kind)}">${esc(x.title)}</span>`).join('')}${arr.length > 3 ? `<span style="box-shadow:none">+${arr.length - 3}</span>` : ''}</span></button>`;
      }
      const selItems = selK ? (byDay.get(selK) || []) : [];
      body = `<div class="month"><div class="mh"><h2>${esc(first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))}</h2><button class="btn icon ghost" data-nav-m="-1" aria-label="Previous month">${icon('left')}</button><button class="btn sm ghost" data-nav-m="0">Today</button><button class="btn icon ghost" data-nav-m="1" aria-label="Next month">${icon('right')}</button></div>
        <div class="dow">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span>${d}</span>`).join('')}</div><div class="grid">${cells}</div></div>
        ${selK ? `<div class="day-h"><h3>${esc(fmtDay(selK + 'T12:00:00', { weekday: 'long', day: 'numeric', month: 'long' }))}</h3></div>${selItems.length ? `<div class="rows">${selItems.map(x => eventRow(x, now)).join('')}</div>` : '<p class="note">Nothing on.</p>'}` : ''}`;
    }
    page.innerHTML = `
      <div class="head"><div><h1>Calendar</h1><p class="sub">${esc(now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))}</p></div>
        <div class="acts"><div class="seg" role="tablist"><button role="tab" data-view="agenda" class="${cal.view === 'agenda' ? 'active' : ''}">Agenda</button><button role="tab" data-view="month" class="${cal.view === 'month' ? 'active' : ''}">Month</button></div></div></div>
      <div class="chips" style="margin-bottom:14px">${KINDS.map(([k, n]) => `<button class="chip toggle-chip ${cal.filter.includes(k) ? 'sel' : ''}" aria-pressed="${cal.filter.includes(k)}" data-kf="${k}"><i class="dot ${k}"></i>${n}</button>`).join('')}<button class="chip toggle-chip ${cal.tasks ? 'sel' : ''}" aria-pressed="${!!cal.tasks}" data-kt>${icon('tasks', 'i-sm')}All due tasks</button></div>
      ${cal.view === 'agenda' ? `<div class="week-strip">${strip}</div>` : ''}
      ${body}`;
    $$('[data-view]', page).forEach(b => b.addEventListener('click', () => { cal.view = b.dataset.view; LS.set('iota.cal2', cal); render(); }));
    $$('[data-kf]', page).forEach(b => b.addEventListener('click', () => { const k = b.dataset.kf; cal.filter = cal.filter.includes(k) ? cal.filter.filter(x => x !== k) : [...cal.filter, k]; if (!cal.filter.length) cal.filter = KINDS.map(x => x[0]); LS.set('iota.cal2', cal); render(); }));
    $('[data-kt]', page).addEventListener('click', () => { cal.tasks = !cal.tasks; LS.set('iota.cal2', cal); render(); });
    $$('[data-jump]', page).forEach(b => b.addEventListener('click', () => { const el = $('#d-' + b.dataset.jump, page); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else toast('Nothing that day'); }));
    $$('[data-nav-m]', page).forEach(b => b.addEventListener('click', () => { const n = +b.dataset.navM; if (!n) { cal.month = dayKey(now).slice(0, 7); cal.sel = dayKey(now); } else { const [y, m] = cal.month.split('-').map(Number); cal.month = dayKey(new Date(y, m - 1 + n, 1)).slice(0, 7); } LS.set('iota.cal2', cal); render(); }));
    $$('[data-day]', page).forEach(b => b.addEventListener('click', () => { cal.sel = b.dataset.day; LS.set('iota.cal2', cal); render(); }));
    $$('[data-ev]', page).forEach(b => b.addEventListener('click', () => openItem(b.dataset.ev)));
  };
  /** Open anything timed: tasks go to the task detail, the rest get an item sheet. */
  function openItem(ref) {
    const [table, id] = ref.split(':');
    if (table === 'tasks') return openTask(id);
    const x = Store.get(table, id); if (!x) return;
    const kind = table === 'shifts' ? 'work' : (x.kind || 'uni');
    const title = table === 'shifts' ? (x.role ? `Shift · ${x.role}` : 'Shift') : x.title;
    const start = x.starts_at || x.due_at, end = x.ends_at;
    const s = sheet(`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="dot ${kind}"></i><span class="note">${esc(kindName(kind))}${table === 'assessments' ? ' · assessment' : ''}${x._local ? ' · from the timetable import' : ''}</span></div>
      <h2>${esc(title)}</h2>
      <dl class="kv" style="margin-bottom:18px">
        <dt>When</dt><dd>${esc(fmtDay(start, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${table === 'assessments' ? 'due ' + esc(fmtTime(start)) : esc(fmtTime(start)) + (end ? '–' + esc(fmtTime(end)) : '')}</dd>
        ${x.location ? `<dt>Where</dt><dd>${esc(x.location)}</dd>` : ''}
        ${table === 'shifts' ? `<dt>Break</dt><dd>${esc(String(x.break_min || 0))} min unpaid${+Store.settings.rateHourly ? ` · ≈ ${UI.gbp(Rules.payEstimate([x]).gross, 2)} gross` : ''}</dd>` : ''}
        ${x.weight_pct ? `<dt>Weight</dt><dd>${esc(String(x.weight_pct))}%</dd>` : ''}
        ${Rules.leaveBufferFor({ kind }) && !x.isTask ? `<dt>Leave by</dt><dd>${esc(fmtTime(new Date(new Date(start) - Rules.leaveBufferFor({ kind }) * 60000)))} <span class="note">(${Rules.leaveBufferFor({ kind })} min ${esc(Store.settings.travelMode || 'walk')})</span></dd>` : ''}
      </dl>
      ${x.notes ? `<p style="margin-bottom:16px">${esc(x.notes)}</p>` : ''}
      <div class="foot"><span class="hint">${esc(x.source === 'claude' ? 'Added by Claude' : x.source === 'seed' ? 'Local copy until the server syncs' : x.source || '')}</span>${table !== 'assessments' ? `<button class="btn ghost danger" data-del>Delete</button>` : ''}<button class="btn" data-close>Close</button></div>`, { label: title });
    $('[data-del]', s.panel)?.addEventListener('click', () => { const row = Store.get(table, id); Store.remove(table, id); s.close(); toast('Deleted', { undo: () => Store.restore(table, row) }); });
  }

  // ------------------------------------------------------------
  // AREAS — the index (phone tab) and one page per area
  // ------------------------------------------------------------
  const GROUP_BLURB = { uni: 'Modules, deadlines, the year abroad, karting.', work: 'The company, the apps, the shifts.', personal: 'Money, the house, and the rest of life.' };
  function nextFor(g, now) { return Store.upcoming(now, 60).find(x => (g === 'uni' ? ['uni', 'kart'].includes(x.kind) : x.kind === g) && new Date(x.ends_at || x.starts_at) > now); }
  SCREENS.areas = (page) => {
    const now = new Date(), cnt = openCounts(now), defs = Tasks.areaDefs().filter(d => !d.hidden);
    const soonOf = key => Tasks.open(now).filter(t => Tasks.area(t) === key && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    page.innerHTML = `<div class="head"><div><h1>Areas</h1><p class="sub">Everything that isn't today, sorted by where it lives.</p></div><div class="acts"><a class="btn ghost" href="#/settings/areas">Edit</a></div></div>
      ${Tasks.GROUPS.map(([g, name]) => {
        const nx = nextFor(g, now);
        return `<section class="area-group">
          <a class="ag-h" href="#/${g}"><i class="dot ${g}"></i><span class="body"><span class="title">${name}</span><span class="meta">${nx ? `${esc(nx.isTask ? 'Due ' : '')}${esc(relDay(nx.starts_at, now))} ${esc(fmtTime(nx.starts_at))} · ${esc(nx.title)}` : esc(GROUP_BLURB[g])}</span></span><span class="chev">${icon('right', 'i-sm')}</span></a>
          <div class="rows ag-rows">${defs.filter(d => d.group === g).map(d => { const n = cnt[d.key] || 0, sn = soonOf(d.key); return `<a class="row" href="#/area/${d.slug}"><span class="lead ico">${icon(d.icon || 'dot', 'i-sm')}</span><span class="body"><span class="title">${esc(d.name)}</span>${sn ? `<span class="meta"><span class="${Tasks.dueClass(sn, now)}">${esc(Tasks.dueLabel(sn, now))}</span><i class="sep"></i><span>${esc(sn.title)}</span></span>` : ''}</span><span class="trail">${n || ''}</span></a>`; }).join('')}</div>
        </section>`;
      }).join('')}
      <div class="section"><div class="sh"><h2>Shortcuts</h2></div><div class="rows">
        ${[['#/uni/modules', 'book', 'Modules'], ['#/uni/deadlines', 'flag', 'Deadlines'], ['#/work/shifts', 'clock', 'Shifts'], ['#/work/earnings', 'chart', 'Earnings'], ['#/settings', 'settings', 'Settings']].map(([h, ic, l]) => `<a class="row" href="${h}"><span class="lead ico">${icon(ic, 'i-sm')}</span><span class="body"><span class="title">${l}</span></span><span class="chev">${icon('right', 'i-sm')}</span></a>`).join('')}
      </div></div>`;
  };

  /** Events that belong to an area — its own calendar lane, where one exists. */
  function areaEvents(key, now) {
    const lane = { Coursework: x => x._table === 'assessments' || (x.kind === 'uni' && !x.isTask && /lecture|seminar|workshop|tutorial|exam|assess|deadline|lab/i.test(x.title || '')), Karting: x => x.kind === 'kart' && !x.isTask, "McDonald's": x => x._table === 'shifts', Societies: x => x.kind === 'uni' && !x.isTask && /society|social|football|taster|fair/i.test(x.title || ''), 'Year abroad': x => !x.isTask && /abroad|exchange|japan|korea/i.test(x.title || ''), Career: x => !x.isTask && /career|placement|cv\b|interview/i.test(x.title || '') }[key];
    return lane ? Store.upcoming(now, 21).filter(x => new Date(x.ends_at || x.starts_at) > now && lane(x)).slice(0, 6) : [];
  }
  function areaLine(d, list, now) {
    if (!list.length) return `Nothing open in ${d.name}. Either you're on top of it or it's quiet.`;
    const late = list.filter(t => Tasks.bucket(t, now) === 'overdue').length, hard = list.filter(t => t.due_kind === 'hard' && t.due).sort((a, b) => new Date(a.due) - new Date(b.due))[0];
    const top = list[0];
    const parts = [`${list.length} open${late ? `, ${late} overdue` : ''}.`];
    if (hard && hard !== top) { const dl = Tasks.dueLabel(hard, now); parts.push(`The hard deadline is ${hard.title.replace(/\.$/, '')} (${/^(Today|Tomorrow|Overdue)/.test(dl) ? dl.toLowerCase() : dl}).`); }
    parts.push(`Start with ${top.title.replace(/\.$/, '')}${Tasks.mins(top) ? ` (${Tasks.fmtMins(Tasks.mins(top))})` : ''}.`);
    return parts.join(' ');
  }
  SCREENS.area = (page, r) => {
    const now = new Date(), d = Tasks.areaDef(r.key); if (!d) return go('#/areas');
    const all = Store.list('tasks').filter(t => Tasks.area(t) === d.key);
    const list = Tasks.ranked(now).filter(t => Tasks.area(t) === d.key);
    const snoozed = all.filter(t => t.status === 'open' && t.snoozed_until && new Date(t.snoozed_until) > now);
    const done = all.filter(t => t.status === 'done').sort((a, b) => new Date(b.done_at || 0) - new Date(a.done_at || 0)).slice(0, 5);
    const groups = {}; for (const t of list.concat(snoozed)) { const k = Tasks.bucket(t, now); (groups[k] = groups[k] || []).push(t); }
    const rowsOf = l => `<div class="rows" data-rows>${l.map(t => taskRow(t, { now, showSource: true, hideArea: true })).join('')}</div>`;
    const ev = areaEvents(d.key, now);
    const gname = Tasks.GROUPS.find(g => g[0] === d.group)?.[1] || 'Areas';
    const jp = d.module === 'language' ? Store.list('modules').find(m => /japan/i.test(m.name || '') || m.kind === 'language') : null;
    page.innerHTML = `
      <a class="crumb" href="#/${d.group}">${icon('left', 'i-sm')}${esc(gname)}</a>
      <div class="head area-head"><div><h1><span class="area-ico">${icon(d.icon || 'dot')}</span>${esc(d.name)}</h1>${d.blurb ? `<p class="sub">${esc(d.blurb)}</p>` : ''}</div>
        <div class="acts"><button class="btn primary" data-add>${icon('plus', 'i-sm')}Add task</button></div></div>
      <div class="eden-note area-note">${mark('', d.group)}<p>${esc(areaLine(d, list, now))}</p></div>
      ${jp ? `<a class="row jp-link" href="#/module/${jp.id}"><span class="lead ico">${icon('jp', 'i-sm')}</span><span class="body"><span class="title">Open the Japanese module</span><span class="meta"><span>Kana, vocabulary and today's reviews</span></span></span><span class="chev">${icon('right', 'i-sm')}</span></a>` : ''}
      <div class="area-layout">
        <div class="area-main">
          ${Tasks.BUCKETS.filter(([k]) => groups[k]?.length).map(([k, l]) => `<div class="group-h ${k === 'overdue' ? 'late' : ''}">${l}<span class="n">${groups[k].length}</span></div>${rowsOf(groups[k])}`).join('') || (all.length ? '' : empty('Nothing here yet', `Tasks tagged #${Tasks.slug(d.key).replace(/-/g, '')} land here.`))}
          ${done.length ? `<div class="group-h">Done recently<span class="n">${done.length}</span></div>${rowsOf(done)}` : ''}
        </div>
        <aside class="area-side">
          ${ev.length ? `<div class="section"><div class="sh"><h2>Coming up</h2></div><div class="rows">${ev.map(x => `<button class="row" data-ev="${x._table}:${x.id}"><span class="lead"><i class="dot ${x.kind === 'kart' ? 'uni' : x.kind || d.group}"></i></span><span class="body"><span class="title">${esc(x.title)}</span><span class="meta"><span>${esc(relDay(x.starts_at, now))} ${esc(fmtTime(x.starts_at))}</span>${x.location ? `<i class="sep"></i><span>${esc(x.location)}</span>` : ''}</span></span></button>`).join('')}</div></div>` : ''}
          ${d.links?.length ? `<div class="section"><div class="sh"><h2>Links</h2></div><div class="rows">${d.links.map(([l, u]) => `<a class="row" href="${esc(u)}" target="_blank" rel="noopener"><span class="lead ico">${icon(/docs\.google|drive\.google/.test(u) ? 'file' : 'out', 'i-sm')}</span><span class="body"><span class="title">${esc(l)}</span><span class="meta"><span>${esc(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</span></span></span></a>`).join('')}</div></div>` : ''}
          ${d.hub ? `<div class="section"><a class="more-link" href="${d.hub}">Open the ${esc(gname)} hub ${icon('right', 'i-sm')}</a></div>` : ''}
        </aside>
      </div>`;
    $('[data-add]', page).addEventListener('click', () => openQuickAdd({ area: d.key }));
    wireTaskRows(page);
    $$('[data-ev]', page).forEach(b => b.addEventListener('click', () => openItem(b.dataset.ev)));
  };

  // ------------------------------------------------------------
  // Hubs — rendered by hubs.js
  // ------------------------------------------------------------
  SCREENS.hub = (page, r) => Hubs.section(page, r.sec, r.tab);
  SCREENS.module = (page, r) => Hubs.module(page, r.id);
  SCREENS.pastmodule = (page, r) => Hubs.pastModule(page, r.id);
  SCREENS.society = (page, r) => Hubs.society(page, r.id);

  // ------------------------------------------------------------
  // EDEN
  // ------------------------------------------------------------
  const SUGGEST = [['What should I do next?'], ['How does this week look?'], ['Any deadlines?'], ['How\'s my money looking?']];
  let edenDeep = sessionStorage.getItem('iota.eden.deep') === '1';
  SCREENS.eden = (page) => {
    const live = Eden.available;
    const modeLabel = () => live ? (edenDeep ? 'Thinking harder · Opus' : 'Live · Sonnet') : 'Rules mode';
    page.innerHTML = `<div class="eden">
      <div class="eden-head">${mark('', awareSection())}<div><h1>EDEN</h1><div class="mode" data-mode>${esc(modeLabel())}</div></div>
        <div class="acts">${live ? `<label class="toggle" title="Use the bigger model"><input type="checkbox" data-deep ${edenDeep ? 'checked' : ''}>Think harder</label>` : `<a class="btn sm" href="#/settings">Go live</a>`}</div></div>
      <div class="thread" data-thread aria-live="polite"></div>
      <div class="eden-foot"><div class="suggest">${SUGGEST.map(([q]) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}<button class="chip" data-q="__add">Add a task</button></div>
      <form class="composer" data-composer><textarea rows="1" placeholder="${live ? 'Ask EDEN, or tell her something' : 'Ask EDEN'}" aria-label="Message EDEN"></textarea><button class="btn primary" type="submit" aria-label="Send">${icon('send', 'i-sm')}</button></form></div>
    </div>`;
    const thread = $('[data-thread]', page), ta = $('textarea', page), form = $('[data-composer]', page), headMark = $('.eden-head .mark', page);
    const setState = s => { headMark.classList.remove('thinking', 'speaking', 'listening'); if (s) headMark.classList.add(s); };
    const bubble = (who, text, meta) => {
      const m = document.createElement('div'); m.className = 'msg ' + who;
      m.innerHTML = who === 'eden' ? `${mark()}<div class="txt">${md(text)}${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</div>` : `${esc(text)}${meta ? `<span class="meta">${esc(meta)}</span>` : ''}`;
      thread.appendChild(m); m.scrollIntoView({ block: 'end', behavior: 'smooth' }); return m;
    };
    $('[data-deep]', page)?.addEventListener('change', e => { edenDeep = e.target.checked; sessionStorage.setItem('iota.eden.deep', edenDeep ? '1' : '0'); $('[data-mode]', page).textContent = modeLabel(); });
    const b0 = Rules.todaysBriefing('morning');
    if (b0) bubble('eden', b0.md, 'Morning briefing').classList.add('pinned');
    const hist = live ? Eden.history.slice(-8) : [];
    for (const m of hist) bubble(m.role === 'user' ? 'me' : 'eden', m.content);
    if (!hist.length && !b0) bubble('eden', Tasks.brief(new Date()).replace(/<\/?b>/g, '**'));
    const prefill = sessionStorage.getItem('iota.eden.prefill'); if (prefill) { sessionStorage.removeItem('iota.eden.prefill'); ta.value = prefill; setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 200); }
    ta.addEventListener('focus', () => setState('listening')); ta.addEventListener('blur', () => setState(''));
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    let busy = false;
    async function ask(q) {
      if (!q.trim() || busy) return;
      bubble('me', q); setState('thinking');
      if (live) {
        busy = true; $('button[type=submit]', form).disabled = true;
        try {
          let cur = null;
          const res = await Eden.ask(q, {
            deep: edenDeep,
            onText: t => { if (!cur) { cur = bubble('eden', ''); cur.classList.add('typing'); setState('speaking'); } $('.txt', cur).innerHTML = md(t); cur.scrollIntoView({ block: 'end' }); },
            onEvent: ev => { if (ev.type === 'tool') { if (cur) { cur.classList.remove('typing'); cur = null; } const m = document.createElement('div'); m.className = 'msg act'; m.innerHTML = `${icon('check', 'i-sm')}<span>${esc(Eden.labelFor(ev))}</span>`; thread.appendChild(m); } },
          });
          const lastT = res.parts?.length ? res.parts[res.parts.length - 1] : res.text;
          if (cur) { $('.txt', cur).innerHTML = md(lastT); cur.classList.remove('typing'); } else bubble('eden', lastT);
          if (res.actions.length) updateShell();
        } catch (e) {
          const msg = e.status === 401 ? 'That API key was rejected. Check it in Settings.' : /credit|billing/i.test(e.message || '') ? 'The Anthropic account is out of credit. Top it up and I\'m back.' : e.status === 429 ? 'Rate-limited for a moment. Try again in a few seconds.' : `Live mode didn't answer (${e.message || 'network'}). Rules mode instead:`;
          bubble('eden', msg);
          const a = Rules.answer(q) || answerLocal(q); if (a) bubble('eden', a, 'Rules mode');
        } finally { busy = false; $('button[type=submit]', form).disabled = false; setState(''); }
        return;
      }
      await new Promise(r => setTimeout(r, 380 + Math.random() * 260));
      setState('speaking');
      const a = answerLocal(q) || Rules.answer(q);
      if (a) bubble('eden', a);
      else bubble('eden', 'That one needs live mode. Add an API key in Settings and I can answer properly, or tap "Add a task" and I\'ll file it.', 'Rules mode');
      setTimeout(() => setState(''), 900);
    }
    form.addEventListener('submit', e => { e.preventDefault(); const q = ta.value; ta.value = ''; ta.style.height = 'auto'; ask(q); });
    $$('[data-q]', page).forEach(c => c.addEventListener('click', () => c.dataset.q === '__add' ? openQuickAdd() : ask(c.dataset.q)));
  };
  /** Rules-mode answers that know about tasks (the old Rules.answer predates them). */
  function answerLocal(q) {
    const t = q.toLowerCase(), now = new Date();
    if (/what.*(next|now|do)|priorit|focus/.test(t)) {
      const n = Tasks.next(now); if (!n) return 'Nothing open. Genuinely. I checked.';
      const rest = Tasks.ranked(now).filter(x => x !== n).slice(0, 3);
      return `**${n.title}**. ${Tasks.reason(n, now) || ''}${rest.length ? `\n\nAfter that:\n${rest.map(x => `- ${x.title}${x.due ? ' — ' + Tasks.dueLabel(x, now).toLowerCase() : ''}`).join('\n')}` : ''}`;
    }
    if (/deadline|due/.test(t)) {
      const list = Tasks.open(now).filter(x => x.due && x.due_kind === 'hard').sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 6);
      if (!list.length) return null;
      return 'Hard deadlines:\n' + list.map(x => `- ${x.title} — ${Tasks.dueLabel(x, now)}${new Date(x.due) - now < 7 * 86400000 ? ` (${fmtTime(x.due)})` : ''}`).join('\n');
    }
    if (/overdue|late|behind/.test(t)) {
      const o = Tasks.open(now).filter(x => x.due && new Date(x.due) < now);
      return o.length ? `${o.length} overdue:\n${o.map(x => `- ${x.title}`).join('\n')}` : 'Nothing overdue. Enjoy the novelty.';
    }
    return null;
  }

  // ------------------------------------------------------------
  // Quick add (N, the + buttons, hold the EDEN tab)
  // ------------------------------------------------------------
  function openQuickAdd(opts = {}) {
    if ($('.sheet.qa-sheet')) return;
    let mode = 'task';
    const s = sheet(`
      <form data-qa autocomplete="off">
        <div class="qa"><span class="check p4" data-qa-ring aria-hidden="true"></span><textarea data-qa-in rows="1" placeholder="Add a task" aria-label="New task" enterkeyhint="done"></textarea></div>
        <div class="qa-tokens" data-qa-tokens></div>
        <p class="qa-help" data-qa-help>Try “Email Vicky about Rapid Formations tomorrow 3pm p2 #fallinghippo 10m”.</p>
        <div class="foot" style="margin-top:16px"><div class="seg qa-mode" role="tablist"><button type="button" class="active" data-m="task">Task</button><button type="button" data-m="any">Anything</button></div><span class="hint"></span><button class="btn primary" type="submit">Add</button></div>
      </form>`, { cls: 'qa-sheet', label: 'New task' });
    const inp = $('[data-qa-in]', s.panel), toks = $('[data-qa-tokens]', s.panel), ring = $('[data-qa-ring]', s.panel), help = $('[data-qa-help]', s.panel);
    const paint = () => {
      const v = inp.value.trim();
      if (mode === 'any') { if (!v) { toks.innerHTML = ''; return; } const c = Rules.classify(v); const w = c.row.starts_at || c.row.due; toks.innerHTML = `<span class="tok">${esc(c.label)}</span>${w ? `<span class="tok">${esc(Rules.fmtWhen(w))}</span>` : ''}${c.row.kind || c.row.section ? `<span class="tok">${esc(kindName(c.row.kind || c.row.section))}</span>` : ''}`; return; }
      const p = Tasks.parse(v); const pri = p.priority || +Store.settings.defaultPriority || 4;
      ring.className = 'check p' + pri;
      toks.innerHTML = p.tokens.map(t => `<span class="tok ${t.k}">${esc(t.label)}</span>`).join('') + (opts.area && !p.area ? `<span class="tok">${esc(Tasks.areaDef(opts.area)?.name || opts.area)}</span>` : '');
    };
    inp.addEventListener('input', () => { paint(); help.hidden = !!inp.value.trim(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('[data-qa]', s.panel).requestSubmit(); } });
    $$('[data-m]', s.panel).forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; $$('[data-m]', s.panel).forEach(x => x.classList.toggle('active', x === b)); inp.placeholder = mode === 'task' ? 'Add a task' : 'A shift, an event, a note, anything'; help.textContent = mode === 'task' ? 'Try “Email Vicky about Rapid Formations tomorrow 3pm p2 #fallinghippo 10m”.' : 'e.g. “Shift Sat 12–8” · “Lecture Thu 10am” · “Note: bring kit”. Filed by type.'; paint(); inp.focus(); }));
    $('[data-qa]', s.panel).addEventListener('submit', e => {
      e.preventDefault(); const v = inp.value.trim(); if (!v) return;
      if (mode === 'any') {
        const c = Rules.classify(v); const row = Store.insert(c.table, c.row); Store.insert('captures', { text: v, filed_as: c.table, row_id: row.id });
        s.close(); toast(`Filed as ${c.label}${c.row.starts_at || c.row.due ? ' · ' + Rules.fmtWhen(c.row.starts_at || c.row.due) : ''}`, { undo: () => Store.remove(c.table, row.id) }); return;
      }
      const p = Tasks.parse(v);
      const a = p.area || opts.area || null;
      const row = Store.insert('tasks', { title: p.title || v, section: a ? (Tasks.AREAS[a] || 'personal') : (route?.screen === 'hub' ? route.sec : 'personal'), area: a, due: p.due, due_kind: p.due ? p.due_kind : null, priority: p.priority || +Store.settings.defaultPriority || 4, duration_min: p.duration_min, status: 'open', source: 'manual' });
      s.close(); toast('Added', { undo: () => Store.remove('tasks', row.id) });
    });
    setTimeout(() => inp.focus(), 40);
  }

  // ------------------------------------------------------------
  // Command palette (⌘K)
  // ------------------------------------------------------------
  function openPalette() {
    if ($('.sheet.palette')) return;
    const cmds = [
      ['Today', 'today', () => go('#/')], ['Tasks', 'tasks', () => go('#/tasks')], ['Calendar', 'calendar', () => go('#/calendar')], ['EDEN', 'info', () => go('#/eden')],
      ['University', 'book', () => go('#/uni')], ['Modules', 'book', () => go('#/uni/modules')], ['Deadlines', 'flag', () => go('#/uni/deadlines')], ['Work', 'briefcase', () => go('#/work')], ['Earnings', 'chart', () => go('#/work/earnings')], ['Personal · Money', 'wallet', () => go('#/personal/money')], ['Settings', 'settings', () => go('#/settings')],
      ['New task', 'plus', () => openQuickAdd()], ['Toggle light / dark', 'sun', () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); Store.setSetting('theme', cur === 'dark' ? 'light' : 'dark'); applyAppearance(); }],
    ];
    const s = sheet(`<div class="pin">${icon('search', 'i-sm')}<input data-pq placeholder="Search tasks, jump anywhere" aria-label="Search"><kbd>Esc</kbd></div><div class="results" data-pr role="listbox"></div>`, { cls: 'palette', label: 'Search' });
    const inp = $('[data-pq]', s.panel), out = $('[data-pr]', s.panel);
    let items = [], on = 0;
    const paint = () => {
      const q = inp.value.trim().toLowerCase();
      const cm = cmds.filter(c => !q || c[0].toLowerCase().includes(q)).map(c => ({ label: c[0], ic: c[1], run: c[2], k: 'Go' }));
      const tk = q ? Store.list('tasks').filter(t => t.status === 'open' && (t.title.toLowerCase().includes(q) || (Tasks.area(t) || '').toLowerCase().includes(q))).slice(0, 8).map(t => ({ label: t.title, ic: 'tasks', run: () => openTask(t.id), k: Tasks.area(t) })) : [];
      const ar = q ? Tasks.areaDefs().filter(d => !d.hidden && (d.name + ' ' + d.key).toLowerCase().includes(q)).slice(0, 5).map(d => ({ label: d.name, ic: d.icon || 'areas', run: () => go('#/area/' + d.slug), k: 'Area' })) : [];
      const st = q ? Settings.PANES.filter(p => p.t.toLowerCase().includes(q)).slice(0, 3).map(p => ({ label: p.t, ic: 'settings', run: () => go('#/settings/' + p.k), k: 'Settings' })) : [];
      const ms = q ? Store.list('modules').filter(m => (m.name + ' ' + (m.code || '')).toLowerCase().includes(q)).slice(0, 4).map(m => ({ label: m.name, ic: 'book', run: () => go('#/module/' + m.id), k: 'Module' })) : [];
      items = [...tk, ...ar, ...cm, ...st, ...ms]; on = Math.min(on, items.length - 1); if (on < 0) on = 0;
      out.innerHTML = items.length ? items.map((it, i) => `<button class="res ${i === on ? 'on' : ''}" data-i="${i}" role="option" aria-selected="${i === on}">${icon(it.ic, 'i-sm')}<span>${esc(it.label)}</span><span class="k">${esc(it.k || '')}</span></button>`).join('') : `<p class="note" style="padding:12px">Nothing matches. Enter adds it as a task.</p>`;
      $$('[data-i]', out).forEach(b => b.addEventListener('click', () => { s.close(); items[+b.dataset.i].run(); }));
    };
    inp.addEventListener('input', () => { on = 0; paint(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); on = Math.min(items.length - 1, on + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); on = Math.max(0, on - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = items[on]; const v = inp.value.trim(); s.close(); if (it) it.run(); else if (v) { const p = Tasks.parse(v); const row = Store.insert('tasks', { title: p.title || v, area: p.area, section: p.section || 'personal', due: p.due, due_kind: p.due ? p.due_kind : null, priority: p.priority || 4, duration_min: p.duration_min, status: 'open', source: 'manual' }); toast('Added', { undo: () => Store.remove('tasks', row.id) }); } }
    });
    paint(); setTimeout(() => inp.focus(), 30);
  }

  // ------------------------------------------------------------
  // SETTINGS
  // ------------------------------------------------------------
  SCREENS.settings = (page, r) => Settings.render(page, r.pane, { statusHTML, applyAppearance, saveFile, boot, toast, refreshShell: () => updateShell() });
  /** Save a generated file: through the viewer's downloads capability when hosted on claude.ai, a plain download otherwise. */
  async function saveFile(filename, text) {
    if (window.IOTA_STANDALONE && window.claude?.use) {
      const dl = await window.claude.use('downloads').catch(() => null);
      if (!dl) { toast('Saving files isn\'t available here'); return; }
      try { await dl.save({ filename, data: text }); toast('Saved'); } catch (e) { if (e?.code !== 'declined') toast('Couldn\'t save the file'); }
      return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  window.applyBase = function (name) {
    const s = Store.settings, b = s.bases && s.bases[name]; if (!b) return false;
    Store.setSetting('activeBase', name);
    for (const k of ['homeAddress', 'employer', 'workAddress', 'travelMode', 'travelWorkMin', 'travelCampusMin', 'travelTrackMin']) if (b[k] != null) Store.setSetting(k, b[k]);
    return true;
  };
  function applyAppearance() {
    const s = Store.settings, th = s.theme || 'system';
    if (th === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = th;
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
    const dark = th === 'dark' || (th === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#131312' : '#F7F7F5');
  }

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------
  function renderLogin(note) {
    shellBuilt = false; route = null;
    app.innerHTML = `<div class="login"><div class="box">
      ${mark()}
      <h1>Iota</h1>
      <p class="lead">${note ? esc(note) : 'Sign in with your karting-app account.'}</p>
      <form data-login autocomplete="on">
        <div class="field"><label for="li-email">Email</label><input id="li-email" name="email" type="email" inputmode="email" autocomplete="username" required></div>
        <div class="field"><label for="li-pass">Password</label><input id="li-pass" name="password" type="password" autocomplete="current-password" required></div>
        <div class="err" data-err hidden></div>
        <button class="btn primary lg block" type="submit">Continue</button>
        <div style="text-align:center;margin-top:14px"><button type="button" class="link" data-forgot>Forgotten your password?</button></div>
      </form>
      <form data-reset hidden autocomplete="off">
        <p class="note" data-rs1 style="margin-bottom:14px">We'll email a reset link. Open it on this device and you'll be asked for a new password.</p>
        <div class="field" data-rs1><label for="rs-email">Email</label><input id="rs-email" type="email" inputmode="email" autocomplete="username" required></div>
        <p class="note" data-rs2 hidden style="margin-bottom:14px"><b>Sent.</b> Check your inbox (and junk) and tap “Reset password”. The link lasts about an hour.</p>
        <div class="err" data-rerr hidden></div>
        <button class="btn primary lg block" type="submit" data-rgo>Email me a link</button>
        <div style="text-align:center;margin-top:14px"><button type="button" class="link" data-back>Back to sign in</button></div>
      </form>
      <div class="alt"><button class="btn block" data-offline>Continue offline</button><p>Use the copy on this device — including the 29 Sep task list. Changes wait here and sync once you sign in and the server's back.</p></div>
    </div></div>`;
    const form = $('[data-login]', app), err = $('[data-err]', app);
    try { const last = localStorage.getItem('iota.lastEmail'); if (last) $('#li-email', app).value = last; } catch (_) {}
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true; const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        await SB.signIn($('#li-email', app).value.trim(), $('#li-pass', app).value);
        try { localStorage.setItem('iota.lastEmail', $('#li-email', app).value.trim()); } catch (_) {}
        Store.setOfflineMode(false); await Store.sync(); boot();
      } catch (ex) {
        const net = !ex.status || ex.status >= 500;
        err.textContent = net ? 'Can\'t reach the server right now — it may be paused. Continue offline and your changes will sync later.' : (ex.message || 'Couldn\'t sign in');
        err.hidden = false; btn.disabled = false; btn.textContent = 'Continue';
        if (net) $('[data-offline]', app).classList.add('primary');
      }
    });
    const rform = $('[data-reset]', app);
    $('[data-forgot]', app).addEventListener('click', () => { form.hidden = true; rform.hidden = false; $('#rs-email', app).value = $('#li-email', app).value; $('#rs-email', app).focus(); });
    $('[data-back]', app).addEventListener('click', () => { form.hidden = false; rform.hidden = true; });
    rform.addEventListener('submit', async e => {
      e.preventDefault(); const rerr = $('[data-rerr]', app), go_ = $('[data-rgo]', app); rerr.hidden = true; go_.disabled = true; go_.textContent = 'Sending…';
      try { await SB.requestReset($('#rs-email', app).value.trim()); $$('[data-rs1]', app).forEach(x => x.hidden = true); $('[data-rs2]', app).hidden = false; go_.hidden = true; }
      catch (ex) { rerr.textContent = /rate|seconds/i.test(ex.message || '') ? 'Too soon — wait a minute and try again.' : (ex.message || 'Couldn\'t send it'); rerr.hidden = false; go_.textContent = 'Email me a link'; }
      finally { go_.disabled = false; }
    });
    $('[data-offline]', app).addEventListener('click', () => { Store.setOfflineMode(true); boot(); });
  }
  function renderNewPassword() {
    shellBuilt = false; route = null;
    app.innerHTML = `<div class="login"><div class="box">${mark()}<h1>New password</h1><p class="lead">${esc(SB.user?.email || 'Your account')}, verified from the email link.</p>
      <form data-np autocomplete="off"><div class="field"><label for="np1">New password</label><input id="np1" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="field"><label for="np2">Again</label><input id="np2" type="password" autocomplete="new-password" minlength="8" required></div><div class="err" data-err hidden></div>
      <button class="btn primary lg block" type="submit">Save and continue</button><p class="field-note" style="text-align:center;margin-top:12px">If this opened in Safari rather than the installed app, that's fine: set it here, then sign in on the app.</p></form></div></div>`;
    const f = $('[data-np]', app), err = $('[data-err]', app);
    f.addEventListener('submit', async e => {
      e.preventDefault(); const a = $('#np1', app).value, b = $('#np2', app).value; err.hidden = true;
      if (a.length < 8) { err.textContent = 'At least 8 characters.'; err.hidden = false; return; }
      if (a !== b) { err.textContent = 'Those two don\'t match.'; err.hidden = false; return; }
      try { await SB.changePassword(a); toast('Password saved'); await Store.sync(); boot(); }
      catch (ex) { err.textContent = /expired|invalid|jwt/i.test(ex.message || '') ? 'That link has expired. Request a new one.' : (ex.message || 'Couldn\'t save'); err.hidden = false; }
    });
  }

  // ------------------------------------------------------------
  // Global keys
  // ------------------------------------------------------------
  let gPending = false;
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (shellBuilt) openPalette(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); if (shellBuilt) go('#/settings'); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { if (UI.undo()) e.preventDefault(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || !shellBuilt || $('.sheet')) return;
    const k = e.key.toLowerCase();
    if (gPending) { gPending = false; const m = { t: '#/', k: '#/tasks', c: '#/calendar', e: '#/eden', u: '#/uni', w: '#/work', p: '#/personal', s: '#/settings' }[k]; if (m) { e.preventDefault(); go(m); } return; }
    if (k === 'g') { gPending = true; setTimeout(() => gPending = false, 900); return; }
    if (k === 'n' || k === 'c') { e.preventDefault(); openQuickAdd(); return; }
    if (k === '/') { e.preventDefault(); openPalette(); return; }
    if (k === 'j' || e.key === 'ArrowDown' && document.activeElement?.closest?.('.row.task')) { e.preventDefault(); moveFocus(1); return; }
    if (k === 'k' || e.key === 'ArrowUp' && document.activeElement?.closest?.('.row.task')) { e.preventDefault(); moveFocus(-1); return; }
    const row = document.activeElement?.closest?.('.row.task');
    if (row && k === 'x') { e.preventDefault(); const next = focusRows()[focusRows().indexOf(row) + 1]; completeTask(row.dataset.open, row); setTimeout(() => next?.focus(), 950); return; }
    if (row && e.key === 'Enter') { e.preventDefault(); openTask(row.dataset.open); return; }
    if (e.key === 'Escape' && route?.screen === 'tasks' && route.sel) go('#/tasks');
  });

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  Store.on(type => { if (type === 'status' || type === 'outbox') { if (shellBuilt) updateShell(); return; } if (shellBuilt) softRender(); if (type === 'error' && Store.lastError) toast('Sync problem: ' + Store.lastError); });
  applyAppearance();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyAppearance);
  let lastWide = isWide(); window.addEventListener('resize', () => { if (isWide() !== lastWide) { lastWide = isWide(); if (shellBuilt) render(); } });

  function boot() {
    if (window.IOTA_STANDALONE) Store.setOfflineMode(true);
    if (!SB.session && !Store.offlineMode) { renderLogin(); return; }
    shellBuilt = false;
    const added = Store.applySeed();
    render();
    if (added) setTimeout(() => toast(`${added} tasks imported`), 900);
    if (SB.session) Store.sync().then(ok => { if (!ok) updateShell(); });
  }
  window.__iotaToast = m => toast(m);
  if (/access_token=|error=/.test(location.hash)) {
    SB.consumeRecoveryHash().then(kind => {
      if (kind === 'recovery') renderNewPassword();
      else { if (kind && kind.startsWith('error:')) setTimeout(() => toast('That link has expired — request a new one'), 300); boot(); }
    });
  } else boot();
  SB.onAuth(s => { if (!s && shellBuilt && !Store.offlineMode) { toast('Signed out — sign in again'); boot(); } });
  setTimeout(() => $('#splash')?.classList.add('gone'), sessionStorage.getItem('iota.booted') ? 60 : 420);
  sessionStorage.setItem('iota.booted', '1');
  setInterval(() => { if (!document.hidden && shellBuilt && (route?.screen === 'today')) softRender(); }, 60000);
  setInterval(() => { if (!document.hidden && SB.session) Store.sync(); }, 5 * 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && SB.session && (!Store.syncedAt || Date.now() - new Date(Store.syncedAt) > 60000)) Store.sync(); if (!document.hidden && shellBuilt) softRender(); });
  window.addEventListener('online', () => { if (SB.session) Store.sync(); });
  if (!window.IOTA_STANDALONE && 'serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  window.IotaApp = { go, openTask, openQuickAdd, openItem, completeTask, wireTaskRows, render: () => render(), toast };
})();
