/* ============================================================
   Iota — Settings
   A declarative schema of panes → sections → rows. One renderer
   draws a split view on desktop (pane list + pane) and a drill-down
   on phones (#/settings → #/settings/<pane>). Every change saves
   instantly and says "Saved" beside the row — no Save buttons, no
   toasts. Search covers every row, with synonyms.
   ============================================================ */
(function () {
  'use strict';
  const { MOD, $, $$, esc, icon, mark, fmtTime, dayKey, relDay } = UI;
  const VERSION = '1.1.0', BUILD = 'iota-shell-v1.1.0';
  const S = () => Store.settings;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  let ctx = null, highlight = null, confirmOpen = null;

  // ------------------------------------------------------------
  // The schema
  // ------------------------------------------------------------
  const PANES = [
    { k: 'account', t: 'Account & sync', ic: 'user', g: 'General' },
    { k: 'appearance', t: 'Appearance', ic: 'sun', g: 'General' },
    { k: 'tasks', t: 'Tasks', ic: 'tasks', g: 'Planning' },
    { k: 'areas', t: 'Spaces & areas', ic: 'areas', g: 'Planning' },
    { k: 'schedule', t: 'Schedule & travel', ic: 'clock', g: 'Planning' },
    { k: 'work', t: 'Work & pay', ic: 'briefcase', g: 'Planning' },
    { k: 'eden', t: 'EDEN', ic: 'eden', g: 'Assistant' },
    { k: 'japanese', t: 'Japanese', ic: 'jp', g: 'Assistant' },
    { k: 'data', t: 'Data & storage', ic: 'db', g: 'System' },
    { k: 'shortcuts', t: 'Shortcuts', ic: 'keyboard', g: 'System', desk: true },
    { k: 'about', t: 'About', ic: 'info', g: 'System' },
  ];
  const paneIcon = (p, cls = 'i-sm') => p.ic === 'eden' ? mark('mono', '') : icon(p.ic, cls);
  const THEMES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']];
  const keyState = () => lsGet('iota.eden.keyState', S().apiKey ? 'unverified' : 'none');

  function summary(k) {
    const s = S();
    switch (k) {
      case 'account': return SB.session ? (SB.user?.email || 'Signed in') : window.IOTA_STANDALONE ? 'Private preview' : 'Offline';
      case 'appearance': return THEMES.find(t => t[0] === (s.theme || 'system'))[1];
      case 'areas': return `${Tasks.spaceDefs().filter(x => !x.hidden).length} spaces`;
      case 'eden': return Eden.available ? 'Live' : 'Rules mode';
      case 'data': return Store.pending ? `${Store.pending} waiting` : '';
      case 'about': return VERSION;
      default: return '';
    }
  }

  // Row helpers. Every row: id, label, desc, kw (search synonyms).
  const R = {
    text: (k, label, o = {}) => ({ id: k, k, type: 'text', label, ...o }),
    num: (k, label, o = {}) => ({ id: k, k, type: 'number', label, ...o }),
    date: (k, label, o = {}) => ({ id: k, k, type: 'date', label, ...o }),
    time: (k, label, o = {}) => ({ id: k, k, type: 'time', label, ...o }),
    sel: (k, label, opts, o = {}) => ({ id: k, k, type: 'select', label, opts, ...o }),
    seg: (k, label, opts, o = {}) => ({ id: k, k, type: 'seg', label, opts, ...o }),
    tog: (k, label, o = {}) => ({ id: k, k, type: 'toggle', label, ...o }),
    custom: (id, label, o) => ({ id, type: 'custom', label, ...o }),
  };

  function build(k) {
    const s = S();
    switch (k) {
      // ---------------- Account & sync ----------------
      case 'account': {
        const synced = Store.syncedAt ? `${relDay(Store.syncedAt)} at ${fmtTime(Store.syncedAt)}` : 'Never';
        const who = SB.session ? (SB.user?.email || 'Signed in') : window.IOTA_STANDALONE ? 'Private preview' : 'Not signed in';
        return { desc: 'Who you are to Iota, and how this device keeps in step with the server.', sections: [
          { rows: [R.custom('who', who, { kw: 'email login account user sign in', bare: true, html: () => `
            <div class="acct">
              <span class="avatar" aria-hidden="true">${esc((s.name || 'A')[0].toUpperCase())}</span>
              <div class="acct-b"><div class="stt">${esc(who)}</div><div class="sd">${SB.session ? ctx.statusHTML() : window.IOTA_STANDALONE ? 'Everything stays in this browser. Export your tasks to move them into the real app.' : 'Working offline. Changes wait on this device until you sign in.'}</div></div>
              <div class="acct-a">${SB.session ? '' : window.IOTA_STANDALONE ? '' : '<button class="btn sm primary" data-act="signin">Sign in</button>'}</div>
            </div>` }),
            R.text('name', 'Your name', { desc: 'What EDEN calls you.', kw: 'first name call me' }),
          ] },
          SB.session && { h: 'Sync', rows: [
            R.custom('sync', 'Last synced', { desc: `${synced}${Store.pending ? ` · ${plural(Store.pending, 'change')} waiting` : ''}`, kw: 'refresh server supabase', html: () => `<button class="btn sm" data-act="sync">${icon('sync', 'i-sm')}Sync now</button>` }),
          ] },
          SB.session && { h: 'Security', rows: [
            R.custom('password', 'Password', { desc: 'The same login as the karting app.', kw: 'change password security', stack: true, html: () => `
              <details class="pw"><summary class="btn sm">Change password</summary>
                <form data-pwform autocomplete="off">
                  <label class="lab" for="pw0">Current password</label><input class="input" id="pw0" name="pw0" type="password" autocomplete="current-password" required>
                  <div class="row2"><div><label class="lab" for="pw1">New password</label><input class="input" id="pw1" name="pw1" type="password" autocomplete="new-password" minlength="8" required></div><div><label class="lab" for="pw2">Again</label><input class="input" id="pw2" name="pw2" type="password" autocomplete="new-password" minlength="8" required></div></div>
                  <div class="pw-foot"><span class="sd" data-pwmsg>At least 8 characters.</span><button class="btn sm primary" type="submit">Update password</button></div>
                </form></details>` }),
            R.custom('signout', 'Sign out', { desc: 'Removes this device\'s copy. Everything on the server stays.', kw: 'log out logout', html: () => `<button class="btn sm ghost danger" data-act="signout">Sign out</button>` }),
          ] },
        ].filter(Boolean) };
      }
      // ---------------- Appearance ----------------
      case 'appearance':
        return { desc: 'How Iota looks on this device. Other devices keep their own.', sections: [
          { rows: [R.custom('theme', 'Theme', { desc: 'System follows your phone or laptop, switching at sunset if it does.', kw: 'dark mode light mode colour color night', stack: true, html: () => `
            <div class="themes" role="radiogroup" aria-label="Theme">${THEMES.map(([v, l]) => `<button role="radio" aria-checked="${(s.theme || 'system') === v}" class="theme-tile ${(s.theme || 'system') === v ? 'on' : ''}" data-theme-v="${v}"><span class="tt tt-${v}" aria-hidden="true"><span class="tt-side"></span><span class="tt-main"><i></i><i></i><i></i></span></span><span class="tl">${l}</span></button>`).join('')}</div>` }),
            R.tog('reduceMotion', 'Reduce motion', { desc: 'Stops the tick animation and EDEN\'s movement. Your system setting is always respected.', kw: 'animation accessibility vestibular' }),
          ] },
        ] };
      // ---------------- Tasks ----------------
      case 'tasks':
        return { desc: 'Defaults for new tasks and the shape of your day, which EDEN uses to decide what fits.', sections: [
          { h: 'New tasks', rows: [
            R.seg('defaultPriority', 'Default priority', [[1, 'P1'], [2, 'P2'], [3, 'P3'], [4, 'P4']], { num: true, desc: 'When you don\'t type p1–p4. P1 is urgent and important.', kw: 'importance urgent' }),
            R.time('defaultDueTime', 'Default due time', { desc: 'Used when you give a day but no time, like "tomorrow".', kw: 'deadline hour' }),
          ] },
          { h: 'Your day', rows: [
            R.sel('dayEndHour', 'Day ends at', [[21, '21:00'], [22, '22:00'], [23, '23:00'], [24, 'Midnight']], { num: true, desc: 'Free time and "what fits before" are counted up to here.', kw: 'bedtime evening night free time' }),
            R.time('snoozeEvening', 'Snooze to "This evening"', { kw: 'later tonight remind' }),
            R.time('snoozeMorning', 'Snooze to "Tomorrow"', { desc: '"Next week" uses this time on Monday.', kw: 'morning remind' }),
          ] },
          { h: 'Quick add', note: 'Type naturally in the new task box. These are the words Iota picks out.', rows: [
            R.custom('syntax', 'What quick add understands', { kw: 'natural language syntax parse hashtag shortcut', stack: true, bare: true, html: () => `<dl class="syntax">${[
              ['tomorrow 3pm', 'Due date and time. Also "fri", "next week", "3 Oct".'],
              ['p1 … p4', 'Priority.'],
              ['!', 'A hard deadline. "hard" works too.'],
              ['#fallinghippo', 'Area. Any area name, spaces and case ignored.'],
              ['20m · 1h30', 'How long it takes. EDEN fits it into free time.'],
            ].map(([a, b]) => `<dt><code>${esc(a)}</code></dt><dd>${esc(b)}</dd>`).join('')}</dl>` }),
          ] },
        ] };
      // ---------------- Areas ----------------
      case 'areas': {
        const defs = Tasks.areaDefs(), sps = Tasks.spaceDefs(), cnt = {}; for (const t of Tasks.open()) { const a = Tasks.area(t); cnt[a] = (cnt[a] || 0) + 1; }
        const spaceSel = d => `<select class="ae-space" data-area-space aria-label="Space for ${esc(d.name)}">${sps.map(x => `<option value="${x.key}" ${x.key === d.space ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
        return { desc: 'Spaces are the parts of your life you answer for. Areas are the ongoing responsibilities inside them. Rename, reorder, hide, or move an area to another space.', sections: [
          { h: 'Spaces', rows: sps.map((x, i, arr) => R.custom('space-' + x.key, x.name, { kw: `${x.key} space rename hide order`, bare: true, html: () => `
            <div class="area-edit space-edit ${x.hidden ? 'is-hidden' : ''}" data-space-key="${x.key}">
              <span class="ae-ico">${icon(x.icon, 'i-sm')}</span>
              <input class="ae-name" value="${esc(x.name)}" aria-label="Name for ${esc(x.key)} space" data-space-name spellcheck="false">
              <span class="ae-n">${plural(defs.filter(d => d.space === x.key).length, 'area')}</span>
              <span class="ae-acts">
                <button class="btn icon ghost sm" data-space-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(x.name)} up">${icon('up', 'i-sm')}</button>
                <button class="btn icon ghost sm" data-space-move="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(x.name)} down">${icon('down', 'i-sm')}</button>
                <button class="btn icon ghost sm" data-space-hide aria-pressed="${x.hidden}" aria-label="${x.hidden ? 'Show' : 'Hide'} ${esc(x.name)}">${icon(x.hidden ? 'eyeoff' : 'eye', 'i-sm')}</button>
              </span>
            </div>` })) },
          ...sps.map(x => ({ h: x.name + ' areas', icon: x.icon, rows: defs.filter(d => d.space === x.key).map((d, i, arr) => R.custom('area-' + d.slug, d.name, { kw: `${d.key} area rename hide order move ${x.name}`, bare: true, html: () => `
            <div class="area-edit ${d.hidden ? 'is-hidden' : ''}" data-area-key="${esc(d.key)}">
              <span class="ae-ico">${icon(d.icon || 'dot', 'i-sm')}</span>
              <input class="ae-name" value="${esc(d.name)}" aria-label="Name for ${esc(d.key)}" data-area-name spellcheck="false">
              <span class="ae-n">${cnt[d.key] ? plural(cnt[d.key], 'task') : ''}</span>
              ${spaceSel(d)}
              <span class="ae-acts">
                <button class="btn icon ghost sm" data-area-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(d.name)} up">${icon('up', 'i-sm')}</button>
                <button class="btn icon ghost sm" data-area-move="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(d.name)} down">${icon('down', 'i-sm')}</button>
                <button class="btn icon ghost sm" data-area-hide aria-pressed="${d.hidden}" aria-label="${d.hidden ? 'Show' : 'Hide'} ${esc(d.name)}" title="${d.hidden ? 'Hidden from the sidebar' : 'Shown in the sidebar'}">${icon(d.hidden ? 'eyeoff' : 'eye', 'i-sm')}</button>
              </span>
            </div>` })) })).filter(sec => sec.rows.length),
          { rows: [R.custom('areas-reset', 'Reset spaces and areas', { desc: 'Back to the original names, order and spaces. Tasks aren\'t touched.', kw: 'restore default', html: () => `<button class="btn sm ghost" data-act="areas-reset" ${Object.keys(s.areaPrefs || {}).length || Object.keys(s.spacePrefs || {}).length ? '' : 'disabled'}>Reset</button>` })],
            note: 'Tag a task with a new #name and it gets an area of its own. Projects, the things with a finish line, live on each space\'s page.' },
        ] };
      }
      // ---------------- Schedule & travel ----------------
      case 'schedule':
        return { desc: 'Your term and the places you move between. "Leave by" times are an event\'s start minus the travel time.', sections: [
          s.bases && { h: 'Base', rows: [R.custom('base', 'Where you\'re living', { desc: 'Switches home, employer, work address and travel times in one go.', kw: 'manchester sheffield home base move', html: () => `<div class="seg">${Object.entries(s.bases).map(([k, b]) => `<button data-base="${esc(k)}" class="${s.activeBase === k ? 'active' : ''}">${esc(b.label || k)}</button>`).join('')}</div>` })] },
          { h: 'Term', rows: [
            R.date('termStart', 'Teaching starts', { kw: 'semester week 1 term dates' }),
            R.num('termWeeks', 'Teaching weeks', { attrs: 'min="1" max="30"', kw: 'semester length' }),
          ] },
          { h: 'Places', rows: [
            R.text('homeAddress', 'Home', { wide: true, kw: 'address house' }),
            R.text('campusAddress', 'Campus', { wide: true, kw: 'university address mmu' }),
            R.text('trackAddress', 'Karting track', { wide: true, kw: 'race circuit address' }),
          ] },
          { h: 'Travel', rows: [
            R.sel('travelMode', 'Usually', [['walk', 'Walk'], ['bus', 'Bus'], ['cycle', 'Cycle'], ['drive', 'Drive']], { kw: 'transport commute' }),
            R.num('travelCampusMin', 'To campus', { unit: 'min', kw: 'commute journey' }),
            R.num('travelWorkMin', 'To work', { unit: 'min', kw: 'commute journey shift' }),
            R.num('travelTrackMin', 'To the track', { unit: 'min', kw: 'karting journey' }),
            R.num('loadingMin', 'Loading on race days', { unit: 'min', desc: 'Added before karting events.', kw: 'kit van' }),
          ] },
        ].filter(Boolean) };
      // ---------------- Work & pay ----------------
      case 'work':
        return { desc: 'Used for shift pay estimates and the Earnings tab.', sections: [
          { h: 'Job', rows: [
            R.text('employer', 'Employer', { wide: true, kw: 'mcdonalds company' }),
            R.text('workAddress', 'Work address', { wide: true, kw: 'store location' }),
          ] },
          { h: 'Pay', rows: [
            R.num('rateHourly', 'Hourly rate', { unit: '£', pre: true, attrs: 'step="0.01" inputmode="decimal"', kw: 'wage salary money per hour' }),
            R.sel('payFrequency', 'Paid', [['fortnightly', 'Fortnightly'], ['weekly', 'Weekly'], ['monthly', 'Monthly']], { kw: 'payday schedule', rerender: true }),
            s.payFrequency === 'monthly' ? R.num('payDayOfMonth', 'Day of the month', { attrs: 'min="1" max="31"', kw: 'payday' }) : R.date('payAnchor', 'A recent payday', { desc: 'Paydays are counted forward from this one.', kw: 'payday anchor' }),
            R.num('payPeriodLagDays', 'Gap before payday', { unit: 'days', desc: 'Days between a pay period ending and being paid for it.', kw: 'pay period lag' }),
          ] },
          { rows: [R.custom('earn-link', 'Earnings', { desc: 'Pay by period, from your shifts.', kw: 'money income', html: () => `<a class="btn sm" href="#/work/earnings">Open${icon('right', 'i-sm')}</a>` })] },
        ] };
      // ---------------- EDEN ----------------
      case 'eden': {
        const st = keyState(), key = s.apiKey || '', u = Eden.usage;
        let hist = 0; try { hist = JSON.parse(localStorage.getItem('iota.eden.history') || '[]').length; } catch (_) {}
        const brief = Store.list('briefings').filter(b => b.kind === 'morning').sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
        const keyUI = () => {
          if (st === 'none' || !key) return `<div class="key-empty"><div class="key-in"><input class="input" type="password" data-key-in placeholder="sk-ant-…" autocomplete="off" spellcheck="false" aria-label="Anthropic API key"><button class="btn sm primary" data-act="key-save">Connect</button></div><p class="sd" data-key-msg>Stays on this device. Get one at console.anthropic.com.</p></div>`;
          const label = { ok: 'Connected', unverified: 'Saved, not checked', rejected: 'Rejected' }[st] || 'Saved';
          return `<div class="key-set"><span class="key-dot ${st}"></span><div class="acct-b"><div class="stt">${label}</div><div class="sd">Key ending <span class="tnum">••••${esc(key.slice(-4))}</span>${st === 'unverified' ? ' · Anthropic couldn\'t be reached to check it' : st === 'rejected' ? ' · Anthropic said no. Check it\'s active.' : ''}</div></div>
            <div class="acct-a"><button class="btn sm" data-act="key-replace">Replace</button><button class="btn sm ghost danger" data-act="key-remove">Remove</button></div></div>`;
        };
        return { desc: 'Your assistant. Without a key she works from rules on this device. With one, she answers live and can add, move and finish things for you.', sections: [
          { rows: [R.custom('eden-mode', Eden.available ? 'EDEN is live' : 'EDEN is in rules mode', { stack: true, bare: true, kw: 'assistant mode status', html: () => `<div class="eden-mode">${mark('', Eden.available ? 'uni' : '')}<div><div class="stt">${Eden.available ? 'EDEN is live' : 'EDEN is in rules mode'}</div><div class="sd">${Eden.available ? 'Answers come from Claude, using your key and your data.' : 'Briefings, "what\'s next" and quick answers work offline. Add a key for conversation.'}</div></div></div>` })] },
          { h: 'Live mode', rows: [
            R.custom('apiKey', 'Anthropic API key', { stack: true, kw: 'claude api key token anthropic live connect', html: keyUI }),
            R.custom('models', 'Models', { desc: 'Everyday answers use Claude Sonnet 5. "Think harder" in the chat switches to Claude Opus 5.', kw: 'sonnet opus claude model' }),
          ] },
          { h: 'Usage', rows: [
            R.custom('usage', `≈ £${(u.usd * 0.78).toFixed(2)} so far`, { desc: `${u.calls} ${u.calls === 1 ? 'reply' : 'replies'} · ${(u.in + u.cin + u.cw).toLocaleString('en-GB')} tokens in · ${u.out.toLocaleString('en-GB')} out`, kw: 'cost spend tokens money bill', html: () => `<button class="btn sm ghost" data-act="usage-reset" ${u.calls ? '' : 'disabled'}>Reset</button>` }),
          ] },
          { h: 'Conversation', rows: [
            R.custom('history', 'Chat history', { desc: hist ? `${plural(hist, 'message')} kept on this device.` : 'Nothing kept yet.', kw: 'clear delete messages chat', html: () => confirmHTML('history', 'Clear', `Clear ${plural(hist, 'message')}?`, !hist) }),
            R.custom('briefing', 'Morning briefing', { desc: brief ? `Last written ${relDay(brief.date + 'T12:00:00')}. A scheduled Claude routine writes it early each morning and it shows on Today.` : 'A scheduled Claude routine writes it each morning and it shows on Today. None has arrived on this device yet.', kw: 'brief daily routine morning' }),
          ] },
        ] };
      }
      // ---------------- Japanese ----------------
      case 'japanese': {
        const jp = Store.list('modules').find(m => /japan/i.test(m.name || '') || m.kind === 'language');
        return { desc: 'Pace for the 日本語 module\'s spaced repetition.', sections: [
          { rows: [
            R.num('jpDailyNewCap', 'New items a day', { attrs: 'min="1" max="40"', desc: 'Reviews of things you\'ve seen are never capped.', kw: 'kana vocab srs pace' }),
            R.num('jpSessionCap', 'Session length', { unit: 'min', attrs: 'min="3" max="60"', desc: 'Reviews come in chunks this long.', kw: 'study time' }),
            R.date('japanDeparture', 'Japan departure', { desc: 'Provisional. The countdown on the module uses it.', kw: 'exchange flight abroad kansai' }),
          ] },
          jp && { rows: [R.custom('jp-open', 'Japanese module', { desc: 'Path, reviews and the kana chart.', html: () => `<a class="btn sm" href="#/module/${jp.id}">Open${icon('right', 'i-sm')}</a>` })] },
        ].filter(Boolean) };
      }
      // ---------------- Data & storage ----------------
      case 'data': {
        let bytes = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^iota\./.test(k)) bytes += (localStorage.getItem(k) || '').length * 2; } } catch (_) {}
        const ls = Store.lastSeed, pend = Store.pending, nTasks = Store.list('tasks').length;
        const clearDesc = pend ? `${plural(pend, 'change')} haven't reached the server. Sync first, or they're lost.` : SB.session ? 'Removes the copy on this device, then downloads it again. Nothing on the server changes.' : `You're not signed in, so this deletes all ${plural(nTasks, 'task')} on this device for good.`;
        return { desc: 'Move tasks between devices and keep a copy of your own.', sections: [
          { h: 'Tasks', rows: [
            R.custom('import', 'Import tasks', { desc: ls ? `Last import: ${plural(ls.added || 0, 'new task')}, ${ls.refreshed || 0} updated.` : 'A task file from Claude or another device (.json). Adds what\'s missing. Done tasks stay done.', kw: 'seed load json file restore', html: () => `<label class="btn sm">Choose file<input type="file" accept="application/json,.json" data-import hidden></label>` }),
            R.custom('export-tasks', 'Export tasks', { desc: `All ${plural(nTasks, 'task')} with their status, as a file another device can import.`, kw: 'download backup json move', html: () => `<button class="btn sm" data-act="export-tasks">Export</button>` }),
            Store.hasSeed && R.custom('reseed', 'Restore imported tasks', { desc: 'Brings back imported tasks you\'ve deleted.', kw: 'undo deleted seed', html: () => `<button class="btn sm" data-act="reseed">Restore</button>` }),
          ].filter(Boolean) },
          { h: 'Backup', rows: [
            R.custom('export-all', 'Export everything', { desc: 'One JSON file of this device\'s copy, including changes not yet synced.', kw: 'download backup json full dump', html: () => `<button class="btn sm" data-act="export-all">Export</button>` }),
          ] },
          { h: 'On this device', rows: [
            R.custom('storage', 'Storage used', { desc: `${(bytes / 1024).toFixed(0)} KB in this browser${pend ? ` · ${plural(pend, 'change')} waiting to sync` : ''}.`, kw: 'space size cache' }),
          ] },
          { h: 'Danger zone', danger: true, rows: [
            R.custom('clear', 'Clear this device\'s cache', { desc: clearDesc, kw: 'reset wipe delete local', html: () => confirmHTML('clear', 'Clear', 'Clear it?', pend > 0 && !!SB.session, true) }),
          ] },
        ] };
      }
      // ---------------- Shortcuts ----------------
      case 'shortcuts': {
        const K = (...ks) => ks.map(k => `<kbd>${esc(k)}</kbd>`).join('');
        const list = (items) => ({ stack: true, bare: true, html: () => `<dl class="keys">${items.map(([k, d]) => `<dt>${d}</dt><dd>${k}</dd>`).join('')}</dl>` });
        return { desc: 'Everything has a key on a laptop, and a gesture on a phone.', sections: [
          { h: 'Anywhere', rows: [R.custom('keys-any', 'Anywhere', { kw: 'keyboard hotkeys', ...list([[K('N'), 'New task'], [K(MOD, 'K') + ' or ' + K('/'), 'Search and jump'], [K(MOD, ','), 'Settings'], [K(MOD, 'Z'), 'Undo the last change']]) })] },
          { h: 'Go to', rows: [R.custom('keys-go', 'Go to', { kw: 'navigate g then', ...list([[K('G') + ' ' + K('T'), 'Today'], [K('G') + ' ' + K('K'), 'Tasks'], [K('G') + ' ' + K('C'), 'Calendar'], [K('G') + ' ' + K('E'), 'EDEN'], [K('G') + ' ' + K('P'), 'Projects'], [K('G') + ' ' + K('U') + ' ' + K('F') + ' ' + K('W') + ' ' + K('L'), 'Degree, FallingHippo, Work, Life admin'], [K('G') + ' ' + K('S'), 'Settings']]) })] },
          { h: 'In a list', rows: [R.custom('keys-list', 'In a list', { kw: 'j k x enter complete', ...list([[K('J') + ' ' + K('K'), 'Move down and up'], [K('X'), 'Complete'], [K('Enter'), 'Open'], [K('Esc'), 'Close']]) })] },
          { h: 'On a phone', rows: [R.custom('gestures', 'On a phone', { kw: 'swipe gesture touch hold', ...list([['Swipe right', 'Complete a task'], ['Swipe left', 'Snooze it'], ['Hold the EDEN tab', 'New task']]) })] },
        ] };
      }
      // ---------------- About ----------------
      case 'about': {
        const where = window.IOTA_STANDALONE ? 'Private preview on claude.ai' : matchMedia('(display-mode: standalone)').matches ? 'Installed app' : 'Browser';
        return { desc: '', sections: [
          { rows: [R.custom('about-id', 'Iota', { stack: true, bare: true, kw: 'version', html: () => `<div class="about-id">${mark('', '')}<div><div class="about-n">Iota <span class="tnum">${VERSION}</span></div><div class="sd">ι — the smallest thing that runs everything.</div></div></div>` })] },
          { rows: [
            R.custom('version', 'Version', { desc: `${VERSION} · ${where}`, kw: 'build release', html: () => window.IOTA_STANDALONE ? '' : `<button class="btn sm" data-act="update">Check for updates</button>` }),
            R.custom('diag', 'Diagnostics', { desc: 'Version, sync state and counts, for fixing things. No keys or content.', kw: 'debug support bug report copy', html: () => `<button class="btn sm" data-act="diag">Copy</button>` }),
          ] },
          { h: 'New in 1.0', rows: [R.custom('whatsnew', 'New in 1.0', { stack: true, bare: true, kw: 'changelog release notes', html: () => `<ul class="whatsnew">${[
            'A redesign from the ground up: plain rows, one ink, light and dark.',
            'Tasks with priority, effort, hard deadlines, snooze and where each one came from.',
            'EDEN picks the one thing to do next, and says why.',
            'Seven spaces, each with its standard, its areas and its projects with a finish line.',
            'Works offline. Changes wait and sync when the server is back.',
            'These settings: searchable, and every change saves itself.',
          ].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` })] },
          { note: 'Set in Hanken Grotesk, under the SIL Open Font License. Built for one person.' },
        ] };
      }
    }
    return { sections: [] };
  }

  function confirmHTML(id, label, question, disabled, danger) {
    if (confirmOpen === id) return `<span class="confirm"><span class="sd">${esc(question)}</span><button class="btn sm ghost" data-confirm-no>Cancel</button><button class="btn sm ${danger ? 'danger-fill' : 'primary'}" data-confirm-yes="${id}">${esc(label)}</button></span>`;
    return `<button class="btn sm ${danger ? 'ghost danger' : 'ghost'}" data-confirm="${id}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
  }

  // ------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------
  function control(r) {
    const s = S(), v = s[r.k];
    switch (r.type) {
      case 'toggle': return `<label class="toggle"><input type="checkbox" data-k="${r.k}" ${v ? 'checked' : ''} aria-label="${esc(r.label)}"></label>`;
      case 'seg': return `<div class="seg" role="radiogroup" aria-label="${esc(r.label)}">${r.opts.map(([ov, l]) => `<button role="radio" aria-checked="${String(v) === String(ov)}" class="${String(v) === String(ov) ? 'active' : ''}" data-seg="${r.k}" data-v="${esc(ov)}" ${r.num ? 'data-num' : ''}>${r.k === 'defaultPriority' ? `<span class="check p${ov}" aria-hidden="true"></span>` : ''}${esc(l)}</button>`).join('')}</div>`;
      case 'select': return `<select class="input sm" data-k="${r.k}" ${r.num ? 'data-num' : ''} aria-label="${esc(r.label)}">${r.opts.map(([ov, l]) => `<option value="${esc(ov)}" ${String(v) === String(ov) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
      case 'custom': return r.html ? r.html() : '';
      default: {
        const inp = `<input class="input sm ${r.type === 'number' ? 'num' : ''}" id="s-in-${r.k}" type="${r.type}" data-k="${r.k}" value="${esc(v ?? '')}" ${r.attrs || ''} ${r.type === 'number' ? 'inputmode="numeric"' : ''} aria-label="${esc(r.label)}">`;
        return r.unit ? `<span class="unit ${r.pre ? 'pre' : ''}">${r.pre ? `<span>${esc(r.unit)}</span>${inp}` : `${inp}<span>${esc(r.unit)}</span>`}</span>` : inp;
      }
    }
  }
  function rowHTML(r) {
    if (r.bare) return `<div class="srow bare" data-row="${r.id}" id="row-${r.id}">${control(r)}</div>`;
    const c = control(r);
    return `<div class="srow ${r.stack ? 'stack' : ''} ${r.wide ? 'wide' : ''}" data-row="${r.id}" id="row-${r.id}">
      <div class="sl"><div class="stt">${r.type !== 'custom' && r.k ? `<label for="s-in-${r.k}">${esc(r.label)}</label>` : esc(r.label)}<span class="saved" aria-live="polite"></span></div>${r.desc ? `<div class="sd">${esc(r.desc)}</div>` : ''}</div>
      ${c ? `<div class="sc">${c}</div>` : ''}
    </div>`;
  }
  function paneHTML(k) {
    const p = PANES.find(x => x.k === k), b = build(k);
    return `<div class="pane" data-pane="${k}">
      <header class="pane-h"><h1>${esc(p.t)}</h1>${b.desc ? `<p class="sub">${esc(b.desc)}</p>` : ''}</header>
      ${b.sections.map(sec => `<section class="sgroup">${sec.h ? `<h2>${sec.dot ? `<i class="dot ${sec.dot}"></i>` : ''}${sec.icon ? icon(sec.icon, 'i-sm') : ''}${esc(sec.h)}</h2>` : ''}${sec.rows?.length ? `<div class="spanel ${sec.danger ? 'danger' : ''}">${sec.rows.map(rowHTML).join('')}</div>` : ''}${sec.note ? `<p class="snote">${esc(sec.note)}</p>` : ''}</section>`).join('')}
    </div>`;
  }
  function navHTML(active, phone) {
    const groups = [...new Set(PANES.map(p => p.g))];
    return groups.map(g => `<div class="snav-g">${phone ? `<h2>${esc(g)}</h2>` : ''}<div class="${phone ? 'spanel' : ''}">${PANES.filter(p => p.g === g && !(phone && p.desk)).map(p => { const sm = summary(p.k); return `<a href="#/settings/${p.k}" class="snav-a" ${p.k === active ? 'aria-current="page"' : ''}><span class="snav-i">${paneIcon(p)}</span><span class="snav-t">${esc(p.t)}</span>${phone && sm ? `<span class="snav-s">${esc(sm)}</span>` : ''}${phone ? `<span class="chev">${icon('right', 'i-sm')}</span>` : ''}</a>`; }).join('')}</div></div>`).join('');
  }

  // Search: every row of every pane, matched on label, description and synonyms.
  function searchHits(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return [];
    const hits = [];
    for (const p of PANES) {
      if (p.t.toLowerCase().includes(words.join(' '))) hits.push({ p, r: null, score: 3 });
      for (const sec of build(p.k).sections) for (const r of sec.rows || []) {
        const hay = `${r.label} ${r.desc || ''} ${r.kw || ''} ${sec.h || ''}`.toLowerCase();
        if (words.every(w => hay.includes(w))) hits.push({ p, r, score: r.label.toLowerCase().includes(words[0]) ? 2 : 1 });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, 12);
  }
  function hitsHTML(q) {
    const hits = searchHits(q);
    return hits.length ? `<div class="shits">${hits.map((h, i) => `<a class="shit" href="#/settings/${h.p.k}" data-hit="${h.r ? h.r.id : ''}" data-i="${i}"><span class="snav-i">${paneIcon(h.p)}</span><span class="body"><span class="t">${esc(h.r ? h.r.label : h.p.t)}</span><span class="m">${esc(h.r ? h.p.t : 'Settings')}</span></span></a>`).join('')}</div>` : `<p class="snote" style="padding:8px 4px">No setting matches “${esc(q)}”.</p>`;
  }

  function render(page, paneKey, c) {
    ctx = c;
    const desk = matchMedia('(min-width: 900px)').matches;
    const k = PANES.some(p => p.k === paneKey) ? paneKey : null;
    const searchBox = `<div class="ssearch">${icon('search', 'i-sm')}<input type="search" data-sq placeholder="Search settings" aria-label="Search settings" autocomplete="off"></div>`;
    if (desk) {
      const cur = k || 'account';
      page.innerHTML = `<div class="settings">
        <nav class="snav" aria-label="Settings">${searchBox}<div data-snav>${navHTML(cur, false)}</div></nav>
        <div class="spane">${paneHTML(cur)}</div>
      </div>`;
    } else if (!k) {
      page.innerHTML = `<div class="head"><div><h1>Settings</h1></div></div>${searchBox}<div class="snav phone" data-snav>${navHTML(null, true)}</div>`;
    } else {
      page.innerHTML = `<a class="crumb" href="#/settings">${icon('left', 'i-sm')}Settings</a><div class="spane">${paneHTML(k)}</div>`;
    }
    wire(page, k || (desk ? 'account' : null));
    if (highlight) { const el = $('#row-' + CSS.escape(highlight), page); highlight = null; if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); const f = $('input,select,button', el); f?.focus({ preventScroll: true }); } }
  }
  const rerender = () => { const page = $('#main .page'); if (!page) return; const r = (location.hash.split('/')[2]) || null; const y = window.scrollY; render(page, r, ctx); window.scrollTo(0, y); };
  const quiet = () => { window.__iotaQuiet = Date.now() + 900; };
  function saved(el) {
    const row = el.closest('.srow'); if (!row) return;
    const t = $('.saved', row); if (t) t.textContent = 'Saved';
    row.classList.remove('did-save'); void row.offsetWidth; row.classList.add('did-save');
    clearTimeout(row._t); row._t = setTimeout(() => { row.classList.remove('did-save'); if (t) t.textContent = ''; }, 1600);
  }
  function set(k, v, el) { quiet(); Store.setSetting(k, v); ctx.applyAppearance(); if (el) saved(el); }

  function wire(page, k) {
    // search
    const sq = $('[data-sq]', page), nav = $('[data-snav]', page);
    if (sq && nav) {
      const base = nav.innerHTML;
      sq.addEventListener('input', () => { const q = sq.value.trim(); nav.innerHTML = q ? hitsHTML(q) : base; wireHits(); });
      sq.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('.shit', nav); if (a) { e.preventDefault(); a.click(); } } else if (e.key === 'Escape') { sq.value = ''; nav.innerHTML = base; } });
      const wireHits = () => $$('.shit', nav).forEach(a => a.addEventListener('click', () => { highlight = a.dataset.hit || null; if (location.hash === a.getAttribute('href')) { setTimeout(rerender, 0); } }));
    }
    // plain controls
    $$('[data-k]', page).forEach(inp => {
      const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'change';
      inp.addEventListener(ev, () => {
        let v = inp.type === 'checkbox' ? inp.checked : inp.value;
        if ((inp.type === 'number' || inp.hasAttribute('data-num')) && v !== '') v = +v;
        set(inp.dataset.k, v, inp);
        if (inp.dataset.k === 'payFrequency' || inp.dataset.k === 'name') setTimeout(rerender, 350);
      });
      if (inp.tagName === 'INPUT' && inp.type !== 'checkbox') inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    });
    $$('[data-seg]', page).forEach(b => b.addEventListener('click', () => {
      const v = b.hasAttribute('data-num') ? +b.dataset.v : b.dataset.v;
      $$(`[data-seg="${b.dataset.seg}"]`, page).forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-checked', x === b); });
      set(b.dataset.seg, v, b);
    }));
    $$('[data-theme-v]', page).forEach(b => b.addEventListener('click', () => {
      $$('[data-theme-v]', page).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      set('theme', b.dataset.themeV, b);
    }));
    $$('[data-base]', page).forEach(b => b.addEventListener('click', () => { quiet(); window.applyBase(b.dataset.base); rerender(); saved($('#row-base', $('#main')) || b); }));

    // areas editor
    const prefs = () => JSON.parse(JSON.stringify(S().areaPrefs || {}));
    const savePrefs = (p, el) => { set('areaPrefs', p, el); ctx.refreshShell(); };
    const sprefs = () => JSON.parse(JSON.stringify(S().spacePrefs || {}));
    const saveSp = (p, el) => { set('spacePrefs', p, el); ctx.refreshShell(); };
    const tidy = (p, k) => { if (p[k] && !Object.keys(p[k]).length) delete p[k]; };
    $$('[data-space-key]', page).forEach(row => {
      const key = row.dataset.spaceKey, nm = $('[data-space-name]', row);
      nm.addEventListener('keydown', e => { if (e.key === 'Enter') nm.blur(); if (e.key === 'Escape') { nm.value = Tasks.spaceDef(key)?.name || key; nm.blur(); } });
      nm.addEventListener('change', () => { const p = sprefs(), v = nm.value.trim(), def = Tasks.SPACE_DEFS.find(x => x.key === key); p[key] = p[key] || {}; if (!v || v === def.name) delete p[key].name; else p[key].name = v; tidy(p, key); saveSp(p, nm); });
      $('[data-space-hide]', row).addEventListener('click', () => { const p = sprefs(); p[key] = p[key] || {}; if (Tasks.spaceDef(key)?.hidden) delete p[key].hidden; else p[key].hidden = true; tidy(p, key); saveSp(p); rerender(); });
      $$('[data-space-move]', row).forEach(b => b.addEventListener('click', () => {
        const all = Tasks.spaceDefs(), i = all.findIndex(x => x.key === key), j = i + +b.dataset.spaceMove; if (j < 0 || j >= all.length) return;
        [all[i], all[j]] = [all[j], all[i]]; const p = sprefs(); all.forEach((x, n) => { p[x.key] = { ...(p[x.key] || {}), order: n }; }); saveSp(p); rerender();
        setTimeout(() => $(`[data-space-key="${key}"] [data-space-move="${b.dataset.spaceMove}"]`)?.focus(), 0);
      }));
    });
    $$('[data-area-key]', page).forEach(row => {
      const key = row.dataset.areaKey;
      const nm = $('[data-area-name]', row);
      nm.addEventListener('keydown', e => { if (e.key === 'Enter') nm.blur(); if (e.key === 'Escape') { nm.value = Tasks.areaDef(key)?.name || key; nm.blur(); } });
      nm.addEventListener('change', () => { const p = prefs(), v = nm.value.trim(); const def = Tasks.AREA_DEFS.find(d => d.key === key); p[key] = p[key] || {}; if (!v || v === (def?.name || key)) delete p[key].name; else p[key].name = v; tidy(p, key); savePrefs(p, nm); });
      $('[data-area-space]', row).addEventListener('change', e => { const p = prefs(), v = e.target.value, def = Tasks.AREA_DEFS.find(d => d.key === key); p[key] = p[key] || {}; if (def && v === def.space) delete p[key].space; else p[key].space = v; tidy(p, key); savePrefs(p); rerender(); });
      $('[data-area-hide]', row).addEventListener('click', () => { const p = prefs(); p[key] = p[key] || {}; p[key].hidden = !Tasks.areaDef(key)?.hidden; if (!p[key].hidden) delete p[key].hidden; tidy(p, key); savePrefs(p); rerender(); });
      $$('[data-area-move]', row).forEach(b => b.addEventListener('click', () => {
        const d = Tasks.areaDef(key), all = Tasks.areaDefs(), grp = all.filter(x => x.space === d.space), i = grp.findIndex(x => x.key === key), j = i + +b.dataset.areaMove;
        if (j < 0 || j >= grp.length) return;
        [grp[i], grp[j]] = [grp[j], grp[i]];
        const p = prefs(); let n = 0; for (const sp of Tasks.spaceDefs()) for (const x of (sp.key === d.space ? grp : all.filter(y => y.space === sp.key))) p[x.key] = { ...(p[x.key] || {}), order: n++ };
        savePrefs(p); rerender();
        setTimeout(() => $(`[data-area-key="${CSS.escape(key)}"] [data-area-move="${b.dataset.areaMove}"]`)?.focus(), 0);
      }));
    });

    // inline confirms
    $$('[data-confirm]', page).forEach(b => b.addEventListener('click', () => { confirmOpen = b.dataset.confirm; rerender(); $('[data-confirm-yes]')?.focus(); }));
    $$('[data-confirm-no]', page).forEach(b => b.addEventListener('click', () => { confirmOpen = null; rerender(); }));
    $$('[data-confirm-yes]', page).forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.confirmYes; confirmOpen = null;
      if (id === 'history') { Eden.clearHistory(); rerender(); saved($('#row-history')); }
      if (id === 'clear') { Store.clearLocal(); if (SB.session) Store.sync().then(rerender); rerender(); ctx.toast('This device\'s copy was cleared'); }
    }));

    // actions
    const act = (n, fn) => $$(`[data-act="${n}"]`, page).forEach(b => b.addEventListener('click', e => fn(b, e)));
    act('sync', async b => { b.disabled = true; b.innerHTML = `${icon('sync', 'i-sm')}Syncing…`; const ok = await Store.sync(); rerender(); saved($('#row-sync') || b); if (!ok) ctx.toast('Couldn\'t reach the server. Your changes are kept.'); });
    act('signout', async () => { await SB.signOut(); Store.setOfflineMode(false); Store.clearLocal(); ctx.boot(); });
    act('signin', () => { Store.setOfflineMode(false); ctx.boot(); });
    act('areas-reset', b => { savePrefs({}); saveSp({}); rerender(); });
    act('export-tasks', () => ctx.saveFile(`iota-tasks-${dayKey(new Date())}.seed.json`, JSON.stringify(Store.exportSeed(), null, 1)));
    act('export-all', () => ctx.saveFile(`iota-export-${dayKey(new Date())}.json`, Store.exportJSON()));
    act('reseed', b => { const n = Store.applySeed(true); rerender(); const row = $('#row-reseed .sd'); if (row) row.textContent = n ? `${plural(n, 'task')} restored.` : 'Nothing was missing.'; });
    act('usage-reset', () => { Eden.resetUsage(); rerender(); saved($('#row-usage')); });
    act('update', async b => {
      b.disabled = true; b.textContent = 'Checking…';
      try { const reg = await navigator.serviceWorker?.getRegistration(); if (!reg) throw 0; await reg.update(); b.textContent = reg.installing || reg.waiting ? 'Update ready — reopen Iota' : 'You\'re up to date'; } catch (_) { b.textContent = 'Couldn\'t check'; }
    });
    act('diag', async b => {
      const counts = Object.fromEntries(['tasks', 'events', 'shifts', 'modules', 'assessments'].map(t => [t, Store.list(t).length]));
      const txt = [`Iota ${VERSION} (${BUILD})`, `Mode: ${window.IOTA_STANDALONE ? 'preview' : SB.session ? 'signed in' : 'offline'} · status ${Store.status || '-'} · pending ${Store.pending}`, `Last sync: ${Store.syncedAt || 'never'}`, `Counts: ${JSON.stringify(counts)}`, `EDEN: ${Eden.available ? 'live (' + keyState() + ')' : 'rules'}`, `Screen: ${innerWidth}×${innerHeight} · ${navigator.userAgent}`].join('\n');
      try { await navigator.clipboard.writeText(txt); b.textContent = 'Copied'; } catch (_) { b.textContent = 'Couldn\'t copy'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1800);
    });
    // EDEN key
    act('key-replace', () => { lsSet('iota.eden.keyState', null); quiet(); Store.setSetting('apiKey', ''); rerender(); setTimeout(() => $('[data-key-in]')?.focus(), 0); });
    act('key-remove', () => { lsSet('iota.eden.keyState', null); set('apiKey', ''); rerender(); saved($('#row-apiKey')); });
    act('key-save', async b => {
      const inp = $('[data-key-in]', page), msg = $('[data-key-msg]', page), key = inp.value.trim();
      if (!/^sk-ant-/.test(key)) { msg.textContent = 'That doesn\'t look like an Anthropic key. They start with sk-ant-.'; msg.classList.add('err'); return; }
      b.disabled = true; b.textContent = 'Checking…'; msg.classList.remove('err'); msg.textContent = 'Asking Anthropic whether the key works.';
      let state = 'unverified';
      try {
        const r = await fetch('https://api.anthropic.com/v1/models?limit=1', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
        state = r.ok ? 'ok' : (r.status === 401 || r.status === 403) ? 'rejected' : 'unverified';
      } catch (_) { state = 'unverified'; }
      if (state === 'rejected') { b.disabled = false; b.textContent = 'Connect'; msg.textContent = 'Anthropic rejected that key. Check it\'s copied in full and still active.'; msg.classList.add('err'); return; }
      lsSet('iota.eden.keyState', state); set('apiKey', key); rerender(); saved($('#row-apiKey'));
    });
    $('[data-key-in]', page)?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('[data-act="key-save"]', page).click(); } });
    // import
    $('[data-import]', page)?.addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return; const d = $('#row-import .sd', page);
      try { Store.importSeed(JSON.parse(await f.text())); rerender(); saved($('#row-import')); }
      catch (ex) { if (d) { d.textContent = ex.message || 'Couldn\'t read that file.'; d.classList.add('err'); } }
    });
    // password
    const pwf = $('[data-pwform]', page);
    pwf?.addEventListener('submit', async e => {
      e.preventDefault(); const msg = $('[data-pwmsg]', page); const cur = pwf.pw0.value, a = pwf.pw1.value, b2 = pwf.pw2.value;
      const fail = t => { msg.textContent = t; msg.classList.add('err'); };
      msg.classList.remove('err');
      if (a.length < 8) return fail('Needs at least 8 characters.');
      if (a !== b2) return fail('Those two don\'t match.');
      if (a === cur) return fail('That\'s the current one.');
      const btn = $('button[type=submit]', pwf); btn.disabled = true; msg.textContent = 'Checking…';
      try { try { await SB.verifyPassword(cur); } catch (_) { throw new Error('The current password is wrong.'); } await SB.changePassword(a); pwf.reset(); msg.textContent = 'Changed. It applies to the karting app too.'; saved(pwf); }
      catch (ex) { fail(ex.message || 'Couldn\'t change it.'); } finally { btn.disabled = false; }
    });
  }

  window.Settings = { render, PANES, VERSION };
})();
