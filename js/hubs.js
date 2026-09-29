/* ============================================================
   Iota — Areas: University · Work · Personal hubs, module hubs,
   the Past Modules archive, society hubs. Same data as v0.8, new skin.
   ============================================================ */
(function () {
  'use strict';
  const { $, $$, esc, icon, fmtTime, fmtDay, dayKey, relDay, until, gbp, SECTIONS, kindName, kindVar, taskRow, eventRow, toast, sheet, empty } = UI;
  const go = h => IotaApp.go(h);
  const now0 = () => new Date();

  function header(page, title, sub, opts = {}) {
    return `${opts.crumb ? `<a class="crumb" href="${opts.crumb[0]}">${icon('left', 'i-sm')}${esc(opts.crumb[1])}</a>` : ''}
      <div class="head"><div><h1>${opts.dot ? `<i class="dot ${opts.dot}" style="width:10px;height:10px;margin-right:10px;vertical-align:3px"></i>` : ''}${esc(title)}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${opts.acts ? `<div class="acts">${opts.acts}</div>` : ''}</div>`;
  }
  const tabs = (sec, cur) => `<div class="seg-scroll subnav"><div class="seg" role="tablist">${SECTIONS[sec].tabs.map(([k, l]) => `<a href="#/${sec}/${k}" role="tab" class="${k === cur ? 'active' : ''}" aria-selected="${k === cur}">${l}</a>`).join('')}</div></div>`;
  const socColor = so => so && so.status !== 'prospective' ? 'var(--uni)' : 'var(--ink-3)';
  const isKart = so => /kart/i.test(so?.name || '');

  function sectionTasks(sec, now) { return Tasks.ranked(now).filter(t => { const s = Tasks.sectionOf(t); return sec === 'uni' ? (s === 'uni' || s === 'kart') : s === sec; }); }

  // ============================================================
  function section(page, sec, tab) {
    const S = SECTIONS[sec], now = now0();
    let body = '';
    const nOpen = sectionTasks(sec, now).length;
    const sub = sec === 'uni' ? 'Manchester Met · Business School · Year 2' : sec === 'work' ? `${esc(Store.settings.employer || 'McDonald\'s')} · FallingHippo` : 'Money, admin and the rest of life';

    if (sec === 'uni') {
      if (tab === 'today') {
        const td = Store.today().filter(x => (x.kind === 'uni' || x.kind === 'kart') && !x.isTask);
        const up = Store.upcoming(now, 80).filter(x => (x.kind === 'uni' || x.kind === 'kart') && !x.isTask && new Date(x.starts_at) > new Date(new Date(now).setHours(23, 59)));
        const nextDay = up.length ? dayKey(up[0].starts_at) : null;
        const tasks = sectionTasks('uni', now).slice(0, 8);
        body += `<section class="section"><div class="sh"><h2>Today</h2><span class="meta">${esc(fmtDay(now, { weekday: 'long', day: 'numeric', month: 'long' }))}</span></div>${td.length ? `<div class="rows">${td.map(x => eventRow(x, now)).join('')}</div>` : `<p class="note">No uni sessions today.</p>`}</section>`;
        if (nextDay) body += `<section class="section"><div class="sh"><h2>${esc(relDay(nextDay + 'T12:00:00', now))}</h2><span class="meta">next teaching day</span></div><div class="rows">${up.filter(x => dayKey(x.starts_at) === nextDay).map(x => eventRow(x, now)).join('')}</div></section>`;
        body += `<section class="section"><div class="sh"><h2>Uni tasks</h2><span class="meta">${nOpen} open</span><a class="more" href="#/tasks">All tasks ${icon('right', 'i-sm')}</a></div>${tasks.length ? `<div class="rows">${tasks.map(t => taskRow(t, { now })).join('')}</div>` : '<p class="note">Nothing open for uni.</p>'}</section>`;
      } else if (tab === 'modules') {
        const all = Store.list('modules'), cur = all.filter(m => m.status !== 'completed'), past = all.filter(m => m.status === 'completed');
        const notes = Store.list('notes').filter(n => n.section === 'uni');
        body += `<label class="search">${icon('search', 'i-sm')}<input type="search" data-note-search placeholder="Search notes in every module" autocomplete="off" aria-label="Search notes"></label><div data-note-results></div>`;
        body += `<section class="section"><div class="sh"><h2>This year</h2><span class="meta">${cur.length}</span></div>${cur.length ? `<div class="rows">${cur.map(m => {
          const n = notes.filter(x => x.module_id === m.id).length, a = Store.list('assessments').filter(x => x.module_id === m.id && x.status !== 'graded').length;
          const personal = m.kind === 'personal' || m.kind === 'language';
          return `<a class="row" href="#/module/${m.id}"><span class="lead"><i class="dot uni" style="margin-top:6px"></i></span><span class="body"><span class="title" style="display:block">${esc(m.name)}</span><span class="meta">${[m.code, personal ? (m.kind === 'language' ? 'Language · personal' : 'Personal project') : m.lecturer, m.credits ? m.credits + ' credits' : '', n ? n + ' note' + (n === 1 ? '' : 's') : '', a ? a + ' open assessment' + (a === 1 ? '' : 's') : ''].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('<i class="sep"></i>')}</span></span><span class="chev">${icon('right', 'i-sm')}</span></a>`;
        }).join('')}</div>` : empty('No modules yet', 'Each module gets a hub: info, sessions, assessments and notes.', { label: 'New module', attr: 'data-new-module' })}
          <button class="btn" data-new-module style="margin-top:14px">${icon('plus', 'i-sm')}New module</button></section>`;
        if (past.length) body += pastAccordion(past);
      } else if (tab === 'deadlines') {
        const as = Store.list('assessments').filter(a => a.status !== 'graded' && a.status !== 'submitted').sort((a, b) => new Date(a.due_at || 8e15) - new Date(b.due_at || 8e15));
        const tk = Tasks.open(now).filter(t => Tasks.sectionOf(t) === 'uni' && t.due).sort((a, b) => new Date(a.due) - new Date(b.due));
        const mods = Store.list('modules');
        body += `<section class="section"><div class="sh"><h2>Assessments</h2><span class="meta">${as.length}</span></div>${as.length ? `<div class="rows">${as.map(a => { const m = mods.find(x => x.id === a.module_id); return `<a class="row flat" href="${m ? '#/module/' + m.id : '#/uni/modules'}"><span class="body"><span class="title" style="display:block">${esc(a.title)}</span><span class="meta">${[m?.code || m?.name, a.weight_pct ? a.weight_pct + '%' : '', String(a.status || '').replace('_', ' ')].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('<i class="sep"></i>')}</span></span><span class="trail">${a.due_at ? `${esc(fmtDay(a.due_at, { day: 'numeric', month: 'short' }))}<br><span style="color:var(--ink-3)">${esc(until(a.due_at, now))}</span>` : ''}</span></a>`; }).join('')}</div>` : `<p class="note">No assessments on file yet. The deadline tasks below come from your calendar.</p>`}</section>`;
        body += `<section class="section"><div class="sh"><h2>Dated uni tasks</h2><span class="meta">${tk.length}</span></div>${tk.length ? `<div class="rows">${tk.map(t => taskRow(t, { now })).join('')}</div>` : '<p class="note">None.</p>'}</section>`;
      } else if (tab === 'societies') {
        const socs = Store.list('societies');
        body += socs.length ? `<div class="rows">${socs.map(so => { const nx = isKart(so) ? Store.nextFor('kart') : null; const role = so.status === 'committee' ? (so.role || 'Committee') : so.status; return `<a class="row" href="#/society/${so.id}"><span class="lead"><i class="dot" style="--c:${esc(socColor(so))};margin-top:6px"></i></span><span class="body"><span class="title" style="display:block">${esc(so.name)}</span><span class="meta"><span>${esc(role || '')}</span>${nx ? `<i class="sep"></i><span>Next ${esc(Rules.fmtWhen(nx.starts_at))} · ${esc(nx.title)}</span>` : so.notes ? `<i class="sep"></i><span>${esc(so.notes)}</span>` : ''}</span></span><span class="chev">${icon('right', 'i-sm')}</span></a>`; }).join('')}</div>` : empty('No societies yet', 'Each society opens into its own hub: events, role, links and notes.');
        const kt = Tasks.open(now).filter(t => Tasks.sectionOf(t) === 'kart' || Tasks.area(t) === 'Societies');
        if (kt.length) body += `<section class="section"><div class="sh"><h2>Society tasks</h2><span class="meta">${kt.length}</span></div><div class="rows">${kt.map(t => taskRow(t, { now })).join('')}</div></section>`;
      }
    }

    if (sec === 'work') {
      const s = Store.settings, rate = +s.rateHourly || 0;
      const shifts = Store.list('shifts').filter(x => x.status !== 'cancelled').sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const shiftRow = x => `<button class="row timed" style="--c:var(--work)" data-ev="shifts:${x.id}"><span class="time">${fmtTime(x.starts_at)}<small>${fmtTime(x.ends_at)}</small></span><span class="bar"></span><span class="body"><span class="title" style="display:block">${esc(fmtDay(x.starts_at, { weekday: 'long', day: 'numeric', month: 'short' }))}</span><span class="meta"><span>${esc(x.role || 'Shift')}</span>${rate ? `<i class="sep"></i><span class="tnum">≈ ${gbp(Rules.payEstimate([x]).gross)}</span>` : ''}${x.location ? `<i class="sep"></i><span>${esc(x.location)}</span>` : ''}</span></span><span class="trail tnum">${Rules.hours(x.starts_at, x.ends_at).toFixed(1)}h</span></button>`;
      if (tab === 'tasks') {
        const list = sectionTasks('work', now);
        const by = {}; for (const t of list) (by[Tasks.area(t)] = by[Tasks.area(t)] || []).push(t);
        body += Object.keys(by).length ? Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([a, l]) => `<section class="section"><div class="sh"><h2>${esc(a)}</h2><span class="meta">${l.length} open</span></div><div class="rows">${l.map(t => taskRow(t, { now, showSource: true })).join('')}</div></section>`).join('') : empty('No work tasks', 'FallingHippo, usBox, Skein and shift admin collect here.');
        body += `<p class="note" style="margin-top:20px">The family planner lives in Google Sheets: <a class="link" href="https://docs.google.com/spreadsheets/d/15iCjcTnrbX4trFOkmkDomIfglMn_wy4OsfMx1BflxPg/edit" target="_blank" rel="noopener">FallingHippo Planner ↗</a></p>`;
      } else if (tab === 'shifts') {
        const up = shifts.filter(x => new Date(x.ends_at) >= now), past = shifts.filter(x => new Date(x.ends_at) < now).reverse().slice(0, 6);
        body += `<section class="section"><div class="sh"><h2>Upcoming</h2><span class="meta">${up.length}</span></div>${up.length ? `<div class="rows">${up.map(shiftRow).join('')}</div>` : empty('No shifts on the rota', 'Tell Claude your rota and it lands here, or add one: “Shift Sat 12–8”.', { label: 'Add a shift', attr: 'data-add-any="Shift "' })}</section>`;
        if (past.length) body += `<section class="section"><div class="sh"><h2>Recent</h2></div><div class="rows">${past.map(shiftRow).join('')}</div></section>`;
      } else if (tab === 'earnings') {
        const pp = Rules.payPeriods(now);
        if (pp && rate) {
          const cur = shifts.filter(x => Rules.inPeriod(x, pp.current)), done = cur.filter(x => new Date(x.ends_at) <= now), todo = cur.filter(x => new Date(x.ends_at) > now);
          const d = Rules.payEstimate(done), all = Rules.payEstimate(cur), nxt = Rules.payEstimate(shifts.filter(x => Rules.inPeriod(x, pp.following)));
          const days = Math.ceil((pp.current.payday - now) / 86400000);
          body += `<section class="section"><p class="figure-line"><b class="figure">${gbp(all.gross)}</b>lands ${esc(fmtDay(pp.current.payday, { weekday: 'long', day: 'numeric', month: 'long' }))}, in ${days} day${days === 1 ? '' : 's'}. Gross, estimated from ${cur.length} shift${cur.length === 1 ? '' : 's'}.</p>
            <dl class="kv" style="margin-top:16px"><dt>Worked so far</dt><dd>${d.hours.toFixed(1)} of ${all.hours.toFixed(1)} hours · ${gbp(d.gross)}</dd><dt>Still to work</dt><dd>${todo.length} shift${todo.length === 1 ? '' : 's'}</dd><dt>Following payday</dt><dd>${esc(fmtDay(pp.following.payday, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${gbp(nxt.gross)}</dd><dt>Period</dt><dd>${esc(fmtDay(pp.current.start, { day: 'numeric', month: 'short' }))} – ${esc(fmtDay(pp.current.end, { day: 'numeric', month: 'short' }))}, at ${gbp(rate, 2)}/h less unpaid breaks</dd></dl></section>`;
          body += `<section class="section"><div class="sh"><h2>Pay by payday</h2></div>${earningsChart(now)}</section>`;
        } else body += empty('No pay set up', 'Add your hourly rate and a recent payday in Settings and this starts counting.', { label: 'Open settings', attr: 'data-go="#/settings"' });
      } else if (tab === 'requests') {
        const items = Store.list('time_off').filter(t => t.status !== 'cancelled').sort((a, b) => a.starts_on.localeCompare(b.starts_on));
        const ST = { needed: ['Need to ask', 'var(--p2)'], asked: ['Asked', 'var(--ink-2)'], approved: ['Approved', 'var(--ok)'], declined: ['Declined', 'var(--p1)'] };
        const fd = d => fmtDay(d + 'T12:00:00', { weekday: 'short', day: 'numeric', month: 'short' });
        body += `<p class="note" style="margin-bottom:8px">Anything work mustn't rota you for. Tap the status to move it on; EDEN reminds you before the ask-by date.</p>`;
        body += items.length ? `<div class="rows">${items.map(t => { const cl = Rules.timeOffClashes(t), st = ST[t.status] || [t.status, 'var(--ink-3)']; return `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(t.title)}</span><span class="meta"><span>${esc(t.starts_on === t.ends_on ? fd(t.starts_on) : fd(t.starts_on) + ' – ' + fd(t.ends_on))}</span>${t.status === 'needed' && t.ask_by ? `<i class="sep"></i><span>ask by ${esc(fd(t.ask_by))}</span>` : ''}${cl.length ? `<i class="sep"></i><span style="color:var(--p1)">${cl.length} shift${cl.length === 1 ? '' : 's'} rota'd</span>` : ''}</span></span><span class="trail" style="display:flex;gap:6px;align-items:center"><button class="status-btn" style="--c:${st[1]}" data-to-status="${t.id}">${esc(st[0])}</button><button class="btn icon sm ghost" data-to-del="${t.id}" aria-label="Remove">${icon('trash', 'i-sm')}</button></span></div>`; }).join('')}</div>` : empty('Nothing to book off', 'Add a date range and an ask-by date. Or tell EDEN: “book me off 3–5 Oct for BUKC”.');
        body += `<button class="btn" data-timeoff style="margin-top:14px">${icon('plus', 'i-sm')}Add time off</button>`;
      } else if (tab === 'info') {
        const rates = Store.list('pay_rates');
        body += `<section class="section"><dl class="kv"><dt>Employer</dt><dd>${esc(s.employer || '—')}</dd><dt>Address</dt><dd>${esc(s.workAddress || '—')}</dd><dt>Travel</dt><dd>${s.travelWorkMin ? esc(s.travelWorkMin + ' min ' + (s.travelMode || 'walk')) : '—'}</dd><dt>Rate</dt><dd>${rate ? gbp(rate, 2) + '/h' : '—'}</dd><dt>Paid</dt><dd>${esc(s.payFrequency || '—')}${s.payAnchor ? ', Thursdays, in arrears' : ''}</dd></dl>
          ${rates.length ? `<div class="sh" style="margin-top:24px"><h2>Rate history</h2></div><div class="rows">${rates.map(r => `<div class="row flat"><span class="body"><span class="title tnum" style="display:block">${gbp(r.hourly, 2)}/h</span><span class="meta"><span>${esc(r.role || '')} from ${esc(fmtDay(r.effective_from, { day: 'numeric', month: 'short', year: 'numeric' }))}</span></span></span></div>`).join('')}</div>` : ''}
          <a class="btn" href="#/settings" style="margin-top:18px">Edit in Settings</a></section>`;
      }
    }

    if (sec === 'personal') {
      if (tab === 'money') body += money(now);
      else if (tab === 'admin') body += admin(now);
      else if (tab === 'targets') body += targets(now);
    }

    page.innerHTML = `${header(page, S.name, sub, { dot: sec, crumb: matchMedia('(min-width: 900px)').matches ? null : ['#/areas', 'Areas'], acts: `<button class="btn primary" data-add-here>${icon('plus', 'i-sm')}Add task</button>` })}${tabs(sec, tab)}${body}`;
    wireCommon(page, () => section(page, sec, tab));
    $('[data-add-here]', page).addEventListener('click', () => IotaApp.openQuickAdd({ area: sec === 'uni' ? 'Uni' : sec === 'work' ? null : null }));
    const search = $('[data-note-search]', page);
    if (search) search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase(), out = $('[data-note-results]', page), ms = Store.list('modules');
      if (!q) { out.innerHTML = ''; return; }
      const hits = Store.list('notes').filter(n => ((n.title || '') + ' ' + (n.md || '')).toLowerCase().includes(q)).slice(0, 12);
      out.innerHTML = hits.length ? `<div class="rows" style="margin-top:8px">${hits.map(n => { const m = ms.find(x => x.id === n.module_id); return `<a class="row flat" href="${m ? '#/module/' + m.id : '#/uni/modules'}"><span class="body"><span class="title" style="display:block">${esc(n.title || (n.md || '').slice(0, 60))}</span><span class="meta"><span>${esc(m ? (m.code || m.name) : 'Unfiled')}</span><i class="sep"></i><span>${esc((n.md || '').slice(0, 80))}</span></span></span></a>`; }).join('')}</div>` : `<p class="note" style="margin-top:10px">No notes match “${esc(search.value.trim())}”.</p>`;
    });
    $$('[data-to-status]', page).forEach(b => b.addEventListener('click', () => { const t = Store.get('time_off', b.dataset.toStatus); const order = ['needed', 'asked', 'approved', 'declined']; Store.update('time_off', t.id, { status: order[(order.indexOf(t.status) + 1) % order.length] }); }));
    $$('[data-to-del]', page).forEach(b => b.addEventListener('click', () => { const id = b.dataset.toDel; Store.update('time_off', id, { status: 'cancelled' }); toast('Removed', { undo: () => Store.update('time_off', id, { status: 'needed' }) }); }));
    $('[data-timeoff]', page)?.addEventListener('click', openTimeOff);
  }

  function wireCommon(page, repaint) {
    IotaApp.wireTaskRows(page);
    $$('[data-ev]', page).forEach(b => b.addEventListener('click', () => IotaApp.openItem(b.dataset.ev)));
    $$('[data-go]', page).forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $$('[data-new-module]', page).forEach(b => b.addEventListener('click', () => openModuleSheet(repaint)));
    $$('[data-add-any]', page).forEach(b => b.addEventListener('click', () => IotaApp.openQuickAdd()));
    $$('.past', page).forEach(d => d.addEventListener('toggle', () => sessionStorage.setItem('iota.pastOpen', d.open ? '1' : '0')));
  }

  function earningsChart(now) {
    let hist = Rules.payHistory(now, 6); while (hist.length > 2 && !hist[0].grossTotal) hist = hist.slice(1); if (!hist.length) return '';
    const max = Math.max(1, ...hist.map(h => h.grossTotal));
    const W = 560, H = 170, pb = 34, pt = 24, bw = W / hist.length;
    const y = v => pt + (H - pt - pb) * (1 - v / max);
    const bars = hist.map((h, i) => {
      const x = i * bw + bw * .22, w = bw * .56, yT = y(h.grossTotal), yW = y(h.grossWorked), y0 = y(0);
      const lbl = h.grossTotal ? gbp(h.grossTotal) : '';
      return `<g>${h.grossTotal > h.grossWorked ? `<rect class="bar future" x="${x}" y="${yT}" width="${w}" height="${Math.max(0, yW - yT)}" rx="2"/>` : ''}${h.grossWorked > 0 ? `<rect class="bar ${h.isCurrent ? 'cur' : ''}" x="${x}" y="${yW}" width="${w}" height="${Math.max(0, y0 - yW)}" rx="2"/>` : ''}
        ${lbl ? `<text x="${x + w / 2}" y="${yT - 7}" text-anchor="middle" class="${h.isCurrent ? 'lbl-cur' : ''}">${lbl}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 16}" text-anchor="middle" class="${h.isCurrent ? 'lbl-cur' : ''}">${esc(fmtDay(h.payday, { day: 'numeric', month: 'short' }))}</text>
        ${h.isCurrent ? `<text x="${x + w / 2}" y="${H - 2}" text-anchor="middle" style="fill:var(--work);font-weight:650">Next</text>` : ''}</g>`;
    }).join('');
    const past = hist.filter(h => h.isPast && h.shifts);
    const avg = past.length ? past.reduce((a, h) => a + h.grossTotal, 0) / past.length : 0;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gross pay per payday"><line class="axis" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>${avg ? `<line x1="0" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="var(--ink-3)" stroke-dasharray="2 4"/>` : ''}${bars}</svg></div>
      <div class="legend" style="margin-top:8px"><span><i class="dot" style="--c:var(--work)"></i>This payslip, worked</span><span><i class="dot" style="--c:transparent;box-shadow:inset 0 0 0 1px var(--work)"></i>Still to work</span><span><i class="dot" style="--c:var(--ink-3)"></i>Past</span>${past.length ? `<span><i style="display:inline-block;width:14px;border-top:1px dashed var(--ink-3)"></i>Average ${gbp(avg)}</span>` : ''}</div>`;
  }

  function money(now) {
    const s = Store.settings, rate = +s.rateHourly || 0, pp = Rules.payPeriods(now);
    let html = '';
    if (pp && rate) {
      const shifts = Store.list('shifts').filter(x => x.status !== 'cancelled');
      const cur = Rules.payEstimate(shifts.filter(x => Rules.inPeriod(x, pp.current)));
      const days = Math.ceil((pp.current.payday - now) / 86400000);
      html += `<section class="section"><p class="figure-line"><b class="figure">${gbp(cur.gross)}</b>lands ${esc(fmtDay(pp.current.payday, { weekday: 'long', day: 'numeric', month: 'long' }))}, in ${days} day${days === 1 ? '' : 's'}. Gross, from your shifts.</p></section>`;
    }
    const sf = s.studentFinance;
    if (sf && Array.isArray(sf.drops) && sf.drops.length) {
      const ST = { awaiting_confirmation: ['Waiting on registration', 'var(--ink-2)'], scheduled: ['Scheduled', 'var(--ink-2)'], paid: ['Paid', 'var(--ok)'], blocked: ['Blocked', 'var(--p1)'] };
      html += `<section class="section"><div class="sh"><h2>Student loan</h2><span class="meta">${esc(sf.year || '')}${sf.total ? ' · ' + gbp(sf.total, 2) + ' for the year' : ''}</span></div><div class="rows">${sf.drops.map(d => { const st = ST[d.status] || [d.status || '', 'var(--ink-3)']; const past = new Date(d.date + 'T23:59:59') < now; return `<div class="row flat"><span class="body"><span class="title tnum" style="display:block">${gbp(d.amount, 2)}</span><span class="meta"><span>${esc(fmtDay(d.date + 'T12:00:00', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}</span>${past && d.status !== 'paid' ? '<i class="sep"></i><span style="color:var(--ink);font-weight:600">should have landed</span>' : ''}</span></span><span class="trail" style="color:${st[1]}">${esc(st[0])}</span></div>`; }).join('')}</div></section>`;
    }
    const mt = Tasks.open(now).filter(t => Tasks.area(t) === 'Money');
    html += `<section class="section"><div class="sh"><h2>Money to-dos</h2><span class="meta">${mt.length}</span></div>${mt.length ? `<div class="rows">${mt.map(t => taskRow(t, { now })).join('')}</div>` : '<p class="note">Nothing money-related open.</p>'}</section>`;
    html += `<section class="section"><div class="sh"><h2>Regulars</h2></div><dl class="kv"><dt>Rent</dt><dd>£600 on the 24th</dd><dt>House wifi</dt><dd>£4.99 a week</dd><dt>Reviews</dt><dd>Sundays 18:00 · budget on the 1st</dd></dl><p class="note" style="margin-top:12px">Payslips, bills and pots arrive with Money v1; for now the bank feed is read by Claude and the to-dos land above.</p></section>`;
    return html;
  }
  function admin(now) {
    let html = '';
    const at = Tasks.open(now).filter(t => ['Admin', 'Security'].includes(Tasks.area(t)));
    html += `<section class="section"><div class="sh"><h2>Admin & security</h2><span class="meta">${at.length}</span></div>${at.length ? `<div class="rows">${at.map(t => taskRow(t, { now })).join('')}</div>` : '<p class="note">Nothing open.</p>'}</section>`;
    const ws = Store.list('watches').filter(w => w.status !== 'resolved').sort((a, b) => new Date(a.expected_by || 8e15) - new Date(b.expected_by || 8e15));
    html += `<section class="section"><div class="sh"><h2>Watching</h2><span class="meta">promises EDEN is keeping an eye on</span></div>${ws.length ? `<div class="rows">${ws.map(w => { const late = w.expected_by && new Date(w.expected_by + 'T23:59:59') < now; return `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(w.text)}</span><span class="meta"><span style="${late ? 'color:var(--p1)' : ''}">${w.expected_by ? (late ? 'Overdue · expected ' : 'Expected ') + esc(fmtDay(w.expected_by + 'T12:00:00')) : 'No date'}</span></span></span><span class="trail"><button class="btn sm" data-watch-done="${w.id}">Done</button></span></div>`; }).join('')}</div>` : '<p class="note">Nothing being watched. Tell EDEN “watch for…”.</p>'}</section>`;
    const rn = Store.list('renewals').sort((a, b) => new Date(a.expires_on || 8e15) - new Date(b.expires_on || 8e15));
    html += `<section class="section"><div class="sh"><h2>Renewals & expiry</h2></div>${rn.length ? `<div class="rows">${rn.map(r => { const d = r.expires_on ? new Date(r.expires_on + 'T12:00:00') : null, days = d ? Math.ceil((d - now) / 86400000) : null; return `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(r.name)}</span><span class="meta"><span>${d ? esc(fmtDay(d, { day: 'numeric', month: 'short', year: 'numeric' })) : ''}</span>${r.notes ? `<i class="sep"></i><span>${esc(r.notes)}</span>` : ''}</span></span><span class="trail ${days != null && days <= 30 ? 'soon' : ''}">${days == null ? '' : days < 0 ? 'Expired' : days + ' days'}</span></div>`; }).join('')}</div>` : '<p class="note">None on file. Railcard, passport, licence — tell EDEN the dates.</p>'}</section>`;
    const pn = Store.list('notes').filter(n => n.section === 'personal');
    if (pn.length) html += `<section class="section"><div class="sh"><h2>Notes</h2></div><div class="rows">${pn.slice(0, 10).map(n => `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(n.title || (n.md || '').slice(0, 70))}</span>${n.title ? `<span class="meta"><span>${esc((n.md || '').slice(0, 90))}</span></span>` : ''}</span></div>`).join('')}</div></section>`;
    return html;
  }
  function targets(now) {
    const from = new Date(now); from.setDate(from.getDate() - 30);
    const items = Store.allTimed().filter(x => !x.isTask && x.ends_at && new Date(x.starts_at) >= from && new Date(x.starts_at) <= now && !x._local);
    const hrs = { uni: 0, work: 0, personal: 0 };
    for (const x of items) { const k = x.kind === 'kart' ? 'uni' : (x.kind in hrs ? x.kind : 'personal'); hrs[k] += Rules.hours(x.starts_at, x.ends_at); }
    const tot = hrs.uni + hrs.work + hrs.personal;
    const done30 = Store.list('tasks').filter(t => t.status === 'done' && t.done_at && new Date(t.done_at) >= from).length;
    return `<section class="section"><div class="sh"><h2>Last 30 days</h2><span class="meta">${tot.toFixed(0)} hours timed · ${done30} task${done30 === 1 ? '' : 's'} done</span></div>
      ${tot ? `<div class="balance">${['uni', 'work', 'personal'].map(k => `<span>${esc(SECTIONS[k].name)}</span><div class="bar-track" style="--c:var(--${k})"><i style="width:${(hrs[k] / tot * 100).toFixed(0)}%"></i></div><span class="v">${hrs[k].toFixed(0)}h</span>`).join('')}</div>` : '<p class="note">Nothing timed in the last month yet.</p>'}
      <p class="note" style="margin-top:14px">Weekly targets and semester goals come with the Sunday review.</p></section>`;
  }

  function pastAccordion(past) {
    const open = sessionStorage.getItem('iota.pastOpen') === '1';
    const groups = new Map();
    for (const m of past) { const g = m.year_label === 'Foundation Year' ? 'Foundation Year · 2024–25' : m.semester ? `${m.year_label || 'Year 1'} · Semester ${m.semester}` : (m.year_label || 'Past'); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(m); }
    const graded = past.filter(m => m.final_mark != null);
    return `<details class="past" ${open ? 'open' : ''}><summary>Past modules<span class="meta">${past.length}${graded.length ? ' · average ' + Math.round(graded.reduce((a, m) => a + +m.final_mark, 0) / graded.length) + '%' : ''}</span><span class="chev">${icon('right', 'i-sm')}</span></summary>
      ${[...groups.entries()].map(([g, arr]) => `<div class="gh"><span>${esc(g)}</span></div><div class="rows">${arr.map(m => `<a class="row flat" href="#/module/past/${m.id}"><span class="body"><span class="title" style="display:block">${esc(m.name)}</span></span><span class="trail"><span class="grade ${m.final_mark == null ? 'none' : ''}">${m.final_mark != null ? Math.round(+m.final_mark) + '%' : 'no mark'}</span></span></a>`).join('')}</div>`).join('')}
    </details>`;
  }

  // ============================================================
  function module(page, id) {
    const m = Store.get('modules', id), now = now0();
    if (!m) { page.innerHTML = header(page, 'Module', null, { crumb: ['#/uni/modules', 'Modules'] }) + empty('Not found', 'That module isn\'t on file any more.'); return; }
    if (m.kind === 'language' && window.JP) {
      page.innerHTML = `${header(page, 'Japanese', 'Personal project · year abroad, September 2027', { crumb: ['#/uni/modules', 'Modules'], acts: `<button class="btn" data-note>${icon('plus', 'i-sm')}Note</button>` })}<div class="jp-host" data-jp></div>`;
      $('[data-note]', page).addEventListener('click', () => openNote(m, () => toast('Saved to ' + m.name)));
      JP.render($('[data-jp]', page), m);
      return;
    }
    const sessions = Store.list('events').filter(e => e.module_id === id && e.status !== 'cancelled').sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const upS = sessions.filter(e => new Date(e.ends_at || e.starts_at) >= now), pastS = sessions.filter(e => new Date(e.ends_at || e.starts_at) < now);
    const as = Store.list('assessments').filter(a => a.module_id === id).sort((a, b) => new Date(a.due_at || 8e15) - new Date(b.due_at || 8e15));
    const graded = as.filter(a => a.status === 'graded' && a.mark != null && a.weight_pct), wSum = graded.reduce((x, a) => x + +a.weight_pct, 0);
    const avg = wSum ? graded.reduce((x, a) => x + +a.mark * +a.weight_pct, 0) / wSum : null;
    const notes = Store.list('notes').filter(n => n.module_id === id);
    const theories = carryForwardFor(m);
    const kv = [['Code', m.code], ['Lecturer', m.lecturer], ['Room', m.room], ['Credits', m.credits]].filter(x => x[1]);
    page.innerHTML = `${header(page, m.name, esc([m.kind === 'personal' ? 'Personal project' : null, m.code].filter(Boolean).join(' · ')), { crumb: ['#/uni/modules', 'Modules'], acts: `<button class="btn" data-note>${icon('plus', 'i-sm')}Note</button>` })}
      ${m.notes ? `<p class="note" style="max-width:62ch;margin-bottom:16px">${esc(m.notes)}</p>` : ''}
      ${kv.length ? `<dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(String(v))}</dd>`).join('')}</dl>` : ''}
      ${(m.links || []).length ? `<div class="chips" style="margin-top:14px">${m.links.map(l => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icon('out', 'i-sm')}</a>`).join('')}</div>` : ''}
      ${theories.length ? `<section class="section"><div class="sh"><h2>You already know</h2><span class="meta">${theories.length} from past modules</span></div><div class="tags">${theories.map(t => { const from = (t.learned_in || []).map(x => Store.get('modules', x)).filter(Boolean)[0]; return `<a class="t" href="${from ? '#/module/past/' + from.id : '#/uni/modules'}" title="${esc(t.note || '')}" style="text-decoration:none">${esc(t.name)}${from ? `<small>${esc(from.code || from.name)}</small>` : ''}</a>`; }).join('')}</div></section>` : ''}
      <section class="section"><div class="sh"><h2>Sessions</h2><span class="meta">${sessions.length ? `${pastS.length} done · ${upS.length} to come` : 'none linked yet'}</span></div>${upS.length ? `<div class="rows">${upS.slice(0, 6).map(e => eventRow({ ...e, _table: 'events' }, now)).join('')}</div>` : '<p class="note">Timetable slots linked to this module show here.</p>'}</section>
      <section class="section"><div class="sh"><h2>Assessments</h2><span class="meta">${avg != null ? `average ${avg.toFixed(0)}% across ${wSum}% marked` : as.length ? as.length + ' on file' : ''}</span></div>${as.length ? `<div class="rows">${as.map(a => `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(a.title)}</span><span class="meta">${[a.weight_pct ? a.weight_pct + '%' : '', String(a.status || '').replace('_', ' '), a.mark != null ? a.mark + '%' : ''].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('<i class="sep"></i>')}</span></span><span class="trail">${a.due_at ? esc(fmtDay(a.due_at, { day: 'numeric', month: 'short' })) : ''}</span></div>`).join('')}</div>` : '<p class="note">None on file.</p>'}</section>
      <section class="section"><div class="sh"><h2>Notes</h2><span class="meta">${notes.length}</span></div>${notes.length ? `<div class="rows">${notes.map(n => `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(n.title || (n.md || '').slice(0, 70))}</span><span class="meta">${n.week ? `<span>Week ${n.week}</span><i class="sep"></i>` : ''}<span>${esc((n.md || '').slice(0, 100))}</span></span></span><span class="trail"><button class="btn icon sm ghost" data-del-note="${n.id}" aria-label="Delete note">${icon('trash', 'i-sm')}</button></span></div>`).join('')}</div>` : '<p class="note">Per-week notes for this module.</p>'}</section>`;
    $('[data-note]', page).addEventListener('click', () => openNote(m, () => module(page, id)));
    $$('[data-del-note]', page).forEach(b => b.addEventListener('click', () => { const n = Store.get('notes', b.dataset.delNote); Store.remove('notes', n.id); toast('Note deleted', { undo: () => Store.restore('notes', n) }); }));
    $$('[data-ev]', page).forEach(b => b.addEventListener('click', () => IotaApp.openItem(b.dataset.ev)));
  }
  function carryForwardFor(m) {
    const key = [(m.code || ''), (m.name || '')].join(' ').toLowerCase();
    return Store.list('theories').filter(t => (t.returns_in || []).some(r => { const rr = r.toLowerCase(); return (m.code && rr.split(/[^a-z0-9]+/).includes(m.code.toLowerCase())) || (rr.length > 3 && key.includes(rr)); }));
  }

  function pastModule(page, id) {
    const m = Store.get('modules', id);
    if (!m) { page.innerHTML = header(page, 'Module', null, { crumb: ['#/uni/modules', 'Modules'] }) + empty('Not found', 'That module isn\'t on file any more.'); return; }
    const as = Store.list('assessments').filter(a => a.module_id === id);
    const revs = Store.list('module_reviews').filter(r => r.module_id === id);
    const th = Store.list('theories').filter(t => (t.learned_in || []).includes(id));
    const rev = r => `<div class="rev ${r.draft ? 'draft' : ''}"><span>${esc(r.text)}</span>${r.draft ? `<span class="rev-acts"><button class="btn sm" data-rev-ok="${r.id}">Confirm</button><button class="btn sm ghost" data-rev-del="${r.id}">Remove</button></span>` : `<button class="btn icon sm ghost" data-rev-del="${r.id}" aria-label="Delete">${icon('trash', 'i-sm')}</button>`}</div>`;
    page.innerHTML = `${header(page, m.name, esc(['Completed', m.period || m.year_label, m.semester ? 'Semester ' + m.semester : ''].filter(Boolean).join(' · ')), { crumb: ['#/uni/modules', 'Modules'], acts: `<button class="grade-big" data-grade aria-label="Set final mark">${m.final_mark != null ? `<b>${Math.round(+m.final_mark)}</b><small>%</small>` : `<span class="btn">Add final mark</span>`}</button>` })}
      <section class="section"><div class="sh"><h2>Assessments</h2></div>${as.length ? `<div class="rows">${as.map(a => `<div class="row flat"><span class="body"><span class="title" style="display:block">${esc(a.title)}</span><span class="meta"><span>${esc((a.type || '').replace('-', ' '))}</span>${a.weight_pct ? `<i class="sep"></i><span>${a.weight_pct}%</span>` : ''}</span></span><span class="trail"><button class="btn sm ${a.mark == null ? 'ghost' : ''}" data-amark="${a.id}">${a.mark != null ? Math.round(+a.mark) + '%' : 'Add mark'}</button></span></div>`).join('')}</div>` : '<p class="note">None recorded.</p>'}</section>
      <div class="twin section"><div><div class="sh"><h2>What went well</h2></div>${revs.filter(r => r.kind === 'www').map(rev).join('') || '<p class="note">Nothing yet.</p>'}<button class="btn sm" data-add-rev="www" style="margin-top:10px">${icon('plus', 'i-sm')}Add</button></div>
        <div><div class="sh"><h2>Even better if</h2></div>${revs.filter(r => r.kind === 'ebi').map(rev).join('') || '<p class="note">Nothing yet.</p>'}<button class="btn sm" data-add-rev="ebi" style="margin-top:10px">${icon('plus', 'i-sm')}Add</button></div></div>
      ${(m.topics || []).length || th.length ? `<section class="section"><div class="sh"><h2>What it covered</h2></div><div class="tags">${(m.topics || []).map(t => `<span class="t">${esc(t)}</span>`).join('')}${th.map(t => `<span class="t" title="${esc(t.note || '')}">${esc(t.name)}${(t.returns_in || []).length ? `<small>→ ${esc(t.returns_in.join(', '))}</small>` : ''}</span>`).join('')}</div></section>` : ''}
      ${m.source_folder ? `<section class="section"><button class="row flat" data-copy="${esc(m.source_folder)}"><span class="body"><span class="title" style="display:block">Source folder</span><span class="meta"><span>OneDrive › University › ${esc(m.source_folder)}</span></span></span><span class="trail">Copy path</span></button></section>` : ''}
      <button class="btn" data-ask style="margin-top:20px">Ask EDEN about this module</button>`;
    const ask = (q, cur) => new Promise(res => { const s = sheet(`<h2>${esc(q)}</h2><form data-f><div class="field"><input data-v value="${esc(cur ?? '')}" aria-label="${esc(q)}"></div><div class="foot"><span class="hint"></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">Save</button></div></form>`, { onClose: () => res(null) }); const i = $('[data-v]', s.panel); setTimeout(() => i.focus(), 40); $('[data-f]', s.panel).addEventListener('submit', e => { e.preventDefault(); const v = i.value; s.close(); res(v); }); });
    const mark = async (label, cur, save) => { const v = await ask(label, cur); if (v === null) return; const n = v.trim() === '' ? null : +v; if (n !== null && (isNaN(n) || n < 0 || n > 100)) { toast('0–100 please'); return; } save(n); };
    $('[data-grade]', page).addEventListener('click', () => mark(`Final mark for ${m.name} (%)`, m.final_mark, n => Store.update('modules', id, { final_mark: n })));
    $$('[data-amark]', page).forEach(b => b.addEventListener('click', () => { const a = Store.get('assessments', b.dataset.amark); mark(`Mark for ${a.title} (%)`, a.mark, n => Store.update('assessments', a.id, { mark: n, status: n === null ? 'submitted' : 'graded' })); }));
    $$('[data-rev-ok]', page).forEach(b => b.addEventListener('click', () => Store.update('module_reviews', b.dataset.revOk, { draft: false })));
    $$('[data-rev-del]', page).forEach(b => b.addEventListener('click', () => { const r = Store.get('module_reviews', b.dataset.revDel); Store.remove('module_reviews', r.id); toast('Removed', { undo: () => Store.restore('module_reviews', r) }); }));
    $$('[data-add-rev]', page).forEach(b => b.addEventListener('click', async () => { const v = await ask(b.dataset.addRev === 'www' ? 'What went well?' : 'Even better if…', ''); if (v && v.trim()) Store.insert('module_reviews', { module_id: id, kind: b.dataset.addRev, text: v.trim(), draft: false }); }));
    $$('[data-copy]', page).forEach(b => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText('University/' + b.dataset.copy); toast('Path copied'); } catch (_) { toast('Couldn\'t copy'); } }));
    $('[data-ask]', page).addEventListener('click', () => { sessionStorage.setItem('iota.eden.prefill', `About my ${m.name} module: `); go('#/eden'); });
  }

  function society(page, id) {
    const so = Store.get('societies', id), now = now0();
    if (!so) { page.innerHTML = header(page, 'Society', null, { crumb: ['#/uni/societies', 'Societies'] }) + empty('Not found', 'That society isn\'t in your list any more.'); return; }
    const kart = isKart(so);
    const ev = kart ? Store.upcoming(now, 80).filter(x => x.kind === 'kart' && !x.isTask) : [];
    const tk = kart ? Tasks.open(now).filter(t => Tasks.sectionOf(t) === 'kart') : [];
    const s = Store.settings;
    page.innerHTML = `${header(page, so.name, esc([so.status === 'committee' ? (so.role || 'Committee') : so.status, so.notes].filter(Boolean).join(' · ')), { crumb: ['#/uni/societies', 'Societies'] })}
      ${kart ? `<div class="chips" style="margin-bottom:8px"><a class="chip" href="https://magicjoynson.github.io/mmu-karting/" target="_blank" rel="noopener">Committee app ${icon('out', 'i-sm')}</a>${(so.links || []).filter(l => !/mmu-karting/.test(l.url)).map(l => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icon('out', 'i-sm')}</a>`).join('')}</div>` : (so.links || []).length ? `<div class="chips">${so.links.map(l => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ${icon('out', 'i-sm')}</a>`).join('')}</div>` : ''}
      ${tk.length ? `<section class="section"><div class="sh"><h2>Your committee jobs</h2><span class="meta">${tk.length}</span></div><div class="rows">${tk.map(t => taskRow(t, { now, showSource: true })).join('')}</div></section>` : ''}
      <section class="section"><div class="sh"><h2>Events</h2></div>${ev.length ? `<div class="rows">${ev.map(x => eventRow(x, now)).join('')}</div>` : '<p class="note">Nothing captured yet.</p>'}</section>
      ${kart && s.trackAddress ? `<section class="section"><div class="sh"><h2>Track</h2></div><dl class="kv"><dt>Where</dt><dd>${esc(s.trackAddress)}</dd><dt>Travel</dt><dd>${esc(String(s.travelTrackMin || ''))} min ${esc(s.travelMode || 'walk')}${s.loadingMin ? ` + ${esc(String(s.loadingMin))} min loading on race days` : ''}</dd></dl></section>` : ''}`;
    wireCommon(page, () => society(page, id));
  }

  // ============================================================
  const MODULE_HUES = ['#D6409F', '#0090FF', '#46A758', '#E2A336', '#8E4EC6', '#12A594', '#E5484D', '#3E63DD'];
  function openModuleSheet(onDone) {
    const used = new Set(Store.list('modules').map(m => (m.colour || '').toUpperCase()));
    const hue = MODULE_HUES.find(h => !used.has(h)) || MODULE_HUES[0];
    const s = sheet(`<h2>New module</h2><form data-f autocomplete="off">
      <div class="field"><div class="seg" data-kind><button type="button" data-k="course">Course module</button><button type="button" data-k="personal" class="active">Personal project</button></div></div>
      <div class="row2"><div class="field"><label>Name</label><input name="name" required placeholder="e.g. Japanese"></div><div class="field"><label>Code</label><input name="code" placeholder="optional"></div></div>
      <div class="row2" data-course hidden><div class="field"><label>Lecturer</label><input name="lecturer"></div><div class="field"><label>Credits</label><input name="credits" type="number" min="0" max="120"></div></div>
      <div class="field"><label>What's it for?</label><input name="notes" placeholder="e.g. year abroad, September 2027"></div>
      <div class="foot"><span class="hint">It gets its own hub.</span><button class="btn primary" type="submit">Create</button></div></form>`, { label: 'New module' });
    const f = $('[data-f]', s.panel); let kind = 'personal';
    $$('[data-k]', s.panel).forEach(b => b.addEventListener('click', () => { kind = b.dataset.k; $$('[data-k]', s.panel).forEach(x => x.classList.toggle('active', x === b)); $('[data-course]', s.panel).hidden = kind !== 'course'; }));
    f.addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries()); if (!d.name.trim()) return; const m = Store.insert('modules', { name: d.name.trim(), code: d.code.trim() || null, kind, colour: hue, lecturer: kind === 'course' ? d.lecturer.trim() || null : null, credits: kind === 'course' && d.credits ? +d.credits : null, notes: d.notes.trim() || null, links: [] }); s.close(); toast(`${m.name} created`); onDone?.(); go('#/module/' + m.id); });
    setTimeout(() => f.name.focus(), 40);
  }
  function openNote(m, onDone) {
    const s = sheet(`<h2>Note · ${esc(m.code || m.name)}</h2><form data-f autocomplete="off"><div class="row2"><div class="field"><label>Title</label><input name="title" placeholder="e.g. Lecture 3 — pricing"></div><div class="field"><label>Week</label><input name="week" type="number" min="1" max="52"></div></div><div class="field"><label>Note</label><textarea name="md" rows="6" required placeholder="Markdown is fine."></textarea></div><div class="foot"><span class="hint">Saved to this module.</span><button class="btn primary" type="submit">Save</button></div></form>`, { label: 'New note' });
    const f = $('[data-f]', s.panel);
    f.addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries()); if (!d.md.trim()) return; Store.insert('notes', { section: 'uni', module_id: m.id, title: d.title.trim() || null, week: d.week ? +d.week : null, md: d.md.trim(), tags: [] }); s.close(); toast('Note saved'); onDone?.(); });
    setTimeout(() => f.title.focus(), 40);
  }
  function openTimeOff() {
    const today = dayKey(new Date());
    const s = sheet(`<h2>Time off to book</h2><form data-f autocomplete="off"><div class="field"><label>What</label><input name="title" required placeholder="BUKC round, exam, home for the weekend"></div>
      <div class="row2"><div class="field"><label>From</label><input name="starts_on" type="date" required min="${today}"></div><div class="field"><label>To</label><input name="ends_on" type="date" min="${today}"></div></div>
      <div class="row2"><div class="field"><label>Ask by</label><input name="ask_by" type="date"></div><div class="field"><label>Reason</label><select name="reason"><option value="kart">Karting</option><option value="uni">Uni</option><option value="personal" selected>Personal</option><option value="holiday">Holiday</option></select></div></div>
      <div class="field"><label>Note</label><input name="notes" placeholder="Who to ask, why"></div><div class="foot"><span class="hint">EDEN reminds you before the ask-by date.</span><button class="btn primary" type="submit">Add</button></div></form>`, { label: 'Time off' });
    const f = $('[data-f]', s.panel);
    f.starts_on.addEventListener('change', () => { if (!f.ends_on.value || f.ends_on.value < f.starts_on.value) f.ends_on.value = f.starts_on.value; });
    f.addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(f).entries()); if (!d.title.trim() || !d.starts_on) return; if (!d.ends_on || d.ends_on < d.starts_on) d.ends_on = d.starts_on; Store.insert('time_off', { title: d.title.trim(), starts_on: d.starts_on, ends_on: d.ends_on, ask_by: d.ask_by || null, reason: d.reason, status: 'needed', notes: d.notes || null }); s.close(); toast('Added'); });
    setTimeout(() => f.title.focus(), 40);
  }

  document.addEventListener('click', e => { const b = e.target.closest('[data-watch-done]'); if (b) { const id = b.dataset.watchDone; Store.update('watches', id, { status: 'resolved' }); toast('Resolved', { undo: () => Store.update('watches', id, { status: 'open' }) }); } });

  window.Hubs = { section, module, pastModule, society };
})();
