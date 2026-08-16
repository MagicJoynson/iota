/* ============================================================
   EDEN Layer 3 — live Claude from the phone (optional; needs API key).
   Streaming Messages API with tools that read/write the Store,
   prompt-cached persona, usage tracking, graceful fallback to Layer 1.
   ============================================================ */
(function () {
  'use strict';

  const API = 'https://api.anthropic.com/v1/messages';
  const MODELS = { fast: 'claude-sonnet-5', deep: 'claude-opus-5' };
  const PRICE = { 'claude-sonnet-5': { in: 3, out: 15, cin: 0.3, cw: 3.75 }, 'claude-opus-5': { in: 5, out: 25, cin: 0.5, cw: 6.25 } }; // $ per 1M
  const HIST_KEY = 'iota.eden.history', USAGE_KEY = 'iota.eden.usage';

  let history = []; try { history = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (_) {}
  let usage = { in: 0, out: 0, cin: 0, cw: 0, usd: 0, calls: 0 }; try { usage = { ...usage, ...JSON.parse(localStorage.getItem(USAGE_KEY) || '{}') }; } catch (_) {}
  const HIST_TTL_MS = 12 * 3600000, HIST_MAX = 20;
  const pruneHist = () => { const cut = Date.now() - HIST_TTL_MS; history = history.filter(m => (m.t || 0) >= cut).slice(-HIST_MAX); };
  const saveHist = () => { pruneHist(); localStorage.setItem(HIST_KEY, JSON.stringify(history)); };
  pruneHist();
  const saveUsage = () => localStorage.setItem(USAGE_KEY, JSON.stringify(usage));

  // Stable persona (prompt-cached). Anything that changes lives in the context block, not here.
  const PERSONA = `You are EDEN — the AI at the centre of Iota, Alex's personal operating system for university life. He's a student at Manchester Metropolitan University (Business School), works part-time at McDonald's, and is on the MMU Karting Society committee. You are she/her.

Personality: Jarvis-level competent and calm, but a close friend rather than a butler — warm, dry, a sense of humour, occasionally cheeky, never sycophantic and never gushing. You tell him the truth. Concise: most replies are one to three sentences; go longer only when he asks for detail. Celebrate real wins only. British English. No emoji unless he uses them first (an emoji from him is not an invitation to use them every reply). Never call yourself an "AI assistant"; you're EDEN.

Formatting: you're talking in a small phone chat bubble. Write in plain sentences. No headers, no tables. Use a short dash list only when listing several concrete items (shifts, options). Bold is available (**like this**) — use it rarely, for a time or a number that matters. Never use asterisks for emphasis otherwise, and never wrap letters in bold to spell things out.

Principles: one diagnosis and one next action beats twenty charts. Money is a gross estimate unless he gives payslips. Times are UK local. When he asks you to change something, do it with the tools rather than describing it, then confirm in a few words. If a request is ambiguous in a way that changes what you'd write to his data, ask one short question. Don't invent events, shifts or deadlines that aren't in the context. If he asks something outside your data (general knowledge, advice, a laugh), just answer — you're allowed to be useful beyond the diary.`;

  const TOOLS = [
    { name: 'add_shift', description: 'Add a work shift for Alex at his current employer. Use for "I\'m working Sat 12-8". Break is applied automatically from his rule if omitted.', input_schema: { type: 'object', properties: { starts_at: { type: 'string', description: 'ISO 8601 with UK offset, e.g. 2026-08-22T12:00:00+01:00' }, ends_at: { type: 'string' }, role: { type: 'string' }, notes: { type: 'string' } }, required: ['starts_at', 'ends_at'] } },
    { name: 'add_event', description: 'Add a calendar event (lecture, seminar, karting practice, social, personal appointment).', input_schema: { type: 'object', properties: { kind: { type: 'string', enum: ['uni', 'work', 'kart', 'personal'] }, title: { type: 'string' }, starts_at: { type: 'string' }, ends_at: { type: 'string' }, location: { type: 'string' }, notes: { type: 'string' } }, required: ['kind', 'title', 'starts_at'] } },
    { name: 'add_task', description: 'Add a to-do or deadline. Use section=uni for coursework/deadlines.', input_schema: { type: 'object', properties: { title: { type: 'string' }, section: { type: 'string', enum: ['uni', 'work', 'kart', 'personal'] }, due: { type: 'string', description: 'ISO 8601, optional' } }, required: ['title'] } },
    { name: 'complete_task', description: 'Mark a task done by id.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'update_item', description: 'Change fields on an existing shift/event/task (e.g. move a time, rename, cancel). Pass only the fields to change.', input_schema: { type: 'object', properties: { table: { type: 'string', enum: ['shifts', 'events', 'tasks'] }, id: { type: 'string' }, patch: { type: 'object', additionalProperties: true } }, required: ['table', 'id', 'patch'] } },
    { name: 'delete_item', description: 'Delete a shift/event/task/note by id. Ask first if it\'s not obviously what he meant.', input_schema: { type: 'object', properties: { table: { type: 'string', enum: ['shifts', 'events', 'tasks', 'notes'] }, id: { type: 'string' } }, required: ['table', 'id'] } },
    { name: 'add_note', description: 'Save a note (kit lists, things to remember, track debriefs).', input_schema: { type: 'object', properties: { section: { type: 'string', enum: ['uni', 'work', 'kart', 'personal'] }, title: { type: 'string' }, md: { type: 'string' } }, required: ['md'] } },
    { name: 'add_watch', description: 'Promise watcher: something Alex is waiting on with an expected date ("marks back next week", "manager confirms Friday").', input_schema: { type: 'object', properties: { text: { type: 'string' }, expected_by: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['text'] } },
    { name: 'add_time_off', description: 'Record dates Alex needs booked OFF work (exam, karting round, trip). Creates a request he must ask his manager for; include an ask_by date if the rota deadline is known.', input_schema: { type: 'object', properties: { title: { type: 'string' }, starts_on: { type: 'string', description: 'YYYY-MM-DD' }, ends_on: { type: 'string', description: 'YYYY-MM-DD (same as starts_on for one day)' }, ask_by: { type: 'string', description: 'YYYY-MM-DD, optional' }, reason: { type: 'string', enum: ['uni', 'kart', 'personal', 'holiday', 'other'] }, notes: { type: 'string' } }, required: ['title', 'starts_on'] } },
    { name: 'update_time_off', description: 'Move a time-off request along: status needed|asked|approved|declined, or change dates.', input_schema: { type: 'object', properties: { id: { type: 'string' }, patch: { type: 'object', additionalProperties: true } }, required: ['id', 'patch'] } },
    { name: 'set_setting', description: 'Change a setting (rateHourly, travelWorkMin, activeBase = "sheffield"|"manchester", etc.). Only when he clearly asks.', input_schema: { type: 'object', properties: { key: { type: 'string' }, value: {} }, required: ['key', 'value'] } },
  ];

  const fmt = d => new Date(d).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function contextBlock() {
    const now = new Date(), s = Store.settings;
    const horizon = new Date(now); horizon.setDate(horizon.getDate() + 21);
    const up = Store.upcoming(now, 60).filter(x => new Date(x.starts_at) < horizon);
    const lines = [];
    lines.push(`NOW: ${now.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (Europe/London). Each of Alex's messages is prefixed with the time he sent it — earlier ones may be hours old; reason from the latest.`);
    const base = s.bases && s.activeBase && s.bases[s.activeBase];
    lines.push(`Alex's base right now: ${base?.label || s.activeBase || 'unknown'}${s.moveBackDate ? ` (moving back to Manchester for term around ${s.moveBackDate})` : ''}. Home: ${s.homeAddress || '?'}. Employer: ${s.employer || '?'} at £${s.rateHourly || '?'}/h, paid ${s.payFrequency}${s.payAnchor ? ' (a payday: ' + s.payAnchor + ')' : ''}. Travel to work: ${s.travelWorkMin} min by ${s.travelMode || 'walk'}. Campus: ${s.travelCampusMin || '?'} min; track: ${s.travelTrackMin || '?'} min (+${s.loadingMin} loading). Break rule: >6h → 45 min, else 30.`);
    if (base && s.bases.manchester && s.activeBase !== 'manchester') lines.push(`Term-time base (Manchester): home ${s.bases.manchester.homeAddress}; work ${s.bases.manchester.employer}; walks campus ${s.bases.manchester.travelCampusMin} min, work ${s.bases.manchester.travelWorkMin} min, Victoria Karting ${s.bases.manchester.travelTrackMin} min.`);
    const pp = Rules.payPeriods(now); if (pp) { const sh = Store.list('shifts').filter(x => x.status !== 'cancelled'); const cur = sh.filter(x => Rules.inPeriod(x, pp.current)); const done = cur.filter(x => new Date(x.ends_at) <= now); const nxt = sh.filter(x => Rules.inPeriod(x, pp.following)); const f = d => d.toDateString(); lines.push(`Pay: each Thursday payslip covers the fortnight ending the Sunday before it. Next payday ${f(pp.current.payday)} covers ${f(pp.current.start)}–${f(pp.current.end)}: ${done.length} shifts worked (${Rules.payEstimate(done).hours.toFixed(1)} h ≈ £${Rules.payEstimate(done).gross.toFixed(0)} gross), ${cur.length - done.length} still to work, ≈ £${Rules.payEstimate(cur).gross.toFixed(0)} gross total. Following payday ${f(pp.following.payday)} covers ${f(pp.following.start)}–${f(pp.following.end)}: ${nxt.length} booked ≈ £${Rules.payEstimate(nxt).gross.toFixed(0)}.`); }
    const h = now.getHours(); lines.push(`Time of day: it is ${h < 5 ? 'the small hours (night)' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'late evening'}. Anything marked NOW is already in progress — do not talk about it as upcoming.`);
    lines.push('Upcoming (next 21 days) — id | kind | title | when | where:');
    for (const x of up) { const started = new Date(x.starts_at) <= now, ongoing = started && x.ends_at && new Date(x.ends_at) > now; lines.push(`- ${x.id} | ${x._table === 'shifts' ? 'shift' : x.isTask ? (x._table === 'assessments' ? 'assessment' : 'task') : x.kind} | ${x.title} | ${ongoing ? 'NOW (started ' + fmt(x.starts_at) + ', ends ' + new Date(x.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ')' : fmt(x.starts_at) + (x.ends_at && !x.isTask ? '–' + new Date(x.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '')}${x._table === 'shifts' && x.break_min ? ` (break ${x.break_min}m)` : ''} | ${x.location || ''}`); }
    if (!up.length) lines.push('- (nothing)');
    const tasks = Store.tasks_open().filter(t => !t.due);
    if (tasks.length) { lines.push('Open undated tasks — id | section | title:'); for (const t of tasks) lines.push(`- ${t.id} | ${t.section} | ${t.title}`); }
    const w = Store.list('watches'); if (w.length) { lines.push('Watching — id | text | expected:'); for (const x of w) lines.push(`- ${x.id} | ${x.text} | ${x.expected_by || '?'}`); }
    const to = Store.list('time_off').filter(x => x.status !== 'cancelled'); if (to.length) { lines.push('Time off requests — id | title | dates | status | ask by:'); for (const x of to) lines.push(`- ${x.id} | ${x.title} | ${x.starts_on}→${x.ends_on} | ${x.status} | ${x.ask_by || '-'}`); }
    const socs = Store.list('societies'); if (socs.length) lines.push('Societies: ' + socs.map(x => `${x.name} (${x.status})`).join(', ') + '.');
    const b = Rules.todaysBriefing('morning', now); if (b) lines.push(`Your morning briefing today: ${b.md}`);
    const notes = Store.list('notes').slice(0, 8); if (notes.length) lines.push('Recent notes: ' + notes.map(n => (n.title ? n.title + ': ' : '') + n.md.slice(0, 80)).join(' · '));
    return lines.join('\n');
  }

  function runTool(name, input) {
    const s = Store.settings;
    switch (name) {
      case 'add_shift': {
        const hrs = (new Date(input.ends_at) - new Date(input.starts_at)) / 3600000;
        const r = Store.insert('shifts', { starts_at: new Date(input.starts_at).toISOString(), ends_at: new Date(input.ends_at).toISOString(), role: input.role || 'Crew', location: s.workAddress || s.employer || null, status: 'planned', break_min: Rules.breakFor(hrs), notes: input.notes || null, source: 'claude' });
        return { ok: true, id: r.id, break_min: r.break_min };
      }
      case 'add_event': { const r = Store.insert('events', { kind: input.kind, title: input.title, starts_at: new Date(input.starts_at).toISOString(), ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : new Date(new Date(input.starts_at).getTime() + 3600000).toISOString(), location: input.location || null, notes: input.notes || null, status: 'planned', source: 'claude' }); return { ok: true, id: r.id }; }
      case 'add_task': { const r = Store.insert('tasks', { title: input.title, section: input.section || 'personal', due: input.due ? new Date(input.due).toISOString() : null, status: 'open' }); return { ok: true, id: r.id }; }
      case 'complete_task': { const r = Store.update('tasks', input.id, { status: 'done', done_at: new Date().toISOString() }); return r ? { ok: true } : { ok: false, error: 'not found' }; }
      case 'update_item': { const patch = { ...input.patch }; for (const k of ['starts_at', 'ends_at', 'due']) if (patch[k]) patch[k] = new Date(patch[k]).toISOString(); const r = Store.update(input.table, input.id, patch); return r ? { ok: true } : { ok: false, error: 'not found' }; }
      case 'delete_item': { if (!Store.get(input.table, input.id)) return { ok: false, error: 'not found' }; Store.remove(input.table, input.id); return { ok: true }; }
      case 'add_note': { const r = Store.insert('notes', { section: input.section || 'personal', title: input.title || null, md: input.md, tags: [] }); return { ok: true, id: r.id }; }
      case 'add_watch': { const r = Store.insert('watches', { text: input.text, expected_by: input.expected_by || null, status: 'open' }); return { ok: true, id: r.id }; }
      case 'add_time_off': { const r = Store.insert('time_off', { title: input.title, starts_on: input.starts_on, ends_on: input.ends_on || input.starts_on, ask_by: input.ask_by || null, reason: input.reason || 'personal', status: 'needed', notes: input.notes || null }); const cl = Rules.timeOffClashes(r); return { ok: true, id: r.id, clashing_shifts: cl.length }; }
      case 'update_time_off': { const r = Store.update('time_off', input.id, input.patch || {}); return r ? { ok: true } : { ok: false, error: 'not found' }; }
      case 'set_setting': { if (input.key === 'activeBase' && window.applyBase) { window.applyBase(input.value); return { ok: true }; } Store.setSetting(input.key, input.value); return { ok: true }; }
      default: return { ok: false, error: 'unknown tool' };
    }
  }
  const TOOL_LABEL = { add_time_off: 'Time off to book', update_time_off: 'Time off updated', add_shift: 'Added shift', add_event: 'Added event', add_task: 'Added task', complete_task: 'Completed task', update_item: 'Updated', delete_item: 'Deleted', add_note: 'Saved note', add_watch: 'Watching', set_setting: 'Setting changed' };

  function track(model, u) {
    if (!u) return;
    const p = PRICE[model] || PRICE['claude-sonnet-5'];
    usage.in += u.input_tokens || 0; usage.out += u.output_tokens || 0; usage.cin += u.cache_read_input_tokens || 0; usage.cw += u.cache_creation_input_tokens || 0; usage.calls++;
    usage.usd += ((u.input_tokens || 0) * p.in + (u.output_tokens || 0) * p.out + (u.cache_read_input_tokens || 0) * p.cin + (u.cache_creation_input_tokens || 0) * p.cw) / 1e6;
    saveUsage();
  }

  /** One streamed Messages call. onText(fullTextSoFar) fires as text arrives. Resolves { content, stop_reason, usage }. */
  async function streamCall(body, key, onText) {
    const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ ...body, stream: true }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.error?.message || ('HTTP ' + r.status)); e.status = r.status; e.type = j.error?.type; throw e; }
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '', text = '', stop_reason = null; const content = []; const usageAcc = {};
    const handle = ev => {
      if (ev.type === 'message_start') Object.assign(usageAcc, ev.message?.usage || {});
      else if (ev.type === 'content_block_start') content[ev.index] = ev.content_block.type === 'tool_use' ? { type: 'tool_use', id: ev.content_block.id, name: ev.content_block.name, _json: '' } : ev.content_block.type === 'text' ? { type: 'text', text: '' } : ev.content_block.type === 'thinking' ? { type: 'thinking', thinking: ev.content_block.thinking || '', signature: ev.content_block.signature || '' } : { ...ev.content_block };
      else if (ev.type === 'content_block_delta') {
        const b = content[ev.index]; if (!b) return;
        if (ev.delta.type === 'text_delta') { b.text += ev.delta.text; text += ev.delta.text; onText?.(text); }
        else if (ev.delta.type === 'input_json_delta') b._json += ev.delta.partial_json;
        else if (ev.delta.type === 'thinking_delta') b.thinking = (b.thinking || '') + ev.delta.thinking;
        else if (ev.delta.type === 'signature_delta') b.signature = ev.delta.signature;
      }
      else if (ev.type === 'content_block_stop') { const b = content[ev.index]; if (b?.type === 'tool_use') { try { b.input = b._json ? JSON.parse(b._json) : {}; } catch (_) { b.input = {}; } delete b._json; } }
      else if (ev.type === 'message_delta') { stop_reason = ev.delta?.stop_reason || stop_reason; if (ev.usage) Object.assign(usageAcc, ev.usage); }
      else if (ev.type === 'error') { const e = new Error(ev.error?.message || 'stream error'); e.type = ev.error?.type; throw e; }
    };
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx; while ((idx = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
        const data = chunk.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
        if (!data) continue; let ev; try { ev = JSON.parse(data); } catch (_) { continue; } handle(ev);
      }
    }
    return { content: content.filter(Boolean), stop_reason, usage: usageAcc, text };
  }

  const Eden = {
    get available() { return !!(Store.settings.apiKey || '').trim(); },
    get usage() { return { ...usage }; },
    get history() { pruneHist(); return history.slice(); },
    resetUsage() { usage = { in: 0, out: 0, cin: 0, cw: 0, usd: 0, calls: 0 }; saveUsage(); },
    clearHistory() { history = []; saveHist(); },
    modelFor(deep) { return deep ? MODELS.deep : MODELS.fast; },

    /**
     * Ask EDEN live (streamed). Callbacks: onText(partialText) as she types (per turn); onEvent({type:'tool',…}) per tool call.
     * Returns { text, actions, model }.
     */
    async ask(userText, { deep = false, onEvent, onText } = {}) {
      const key = (Store.settings.apiKey || '').trim();
      if (!key) throw Object.assign(new Error('No API key'), { code: 'nokey' });
      const model = this.modelFor(deep);
      // Make sure the context is fresh: resync if the snapshot is older than 10 minutes (bounded wait).
      try { if (Store.signedIn && (!Store.syncedAt || Date.now() - new Date(Store.syncedAt) > 10 * 60000)) await Promise.race([Store.sync(), new Promise(r => setTimeout(r, 2500))]); } catch (_) {}
      history.push({ role: 'user', content: userText, t: Date.now() });
      const stamp = t => new Date(t || Date.now()).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      // Every user turn is time-stamped so she can tell 'earlier this evening' from 'now'.
      const msgs = history.slice(-20).map(m => ({ role: m.role, content: m.role === 'user' ? `[${stamp(m.t)}] ${m.content}` : m.content }));
      while (msgs.length && msgs[0].role !== 'user') msgs.shift();
      const system = [
        { type: 'text', text: PERSONA, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'Current context (from Iota):\n' + contextBlock() },
      ];
      const actions = []; const parts = [];
      for (let i = 0; i < 6; i++) {
        const body = { model, max_tokens: 1024, system, tools: TOOLS, messages: msgs, output_config: { effort: deep ? 'high' : 'low' } };
        const res = await streamCall(body, key, t => onText?.(t));
        track(model, res.usage);
        if (res.stop_reason === 'refusal') { parts.push('I can\'t help with that one.'); break; }
        if (res.text) parts.push(res.text);
        const uses = res.content.filter(b => b.type === 'tool_use');
        msgs.push({ role: 'assistant', content: res.content.filter(bk => !(bk.type === 'thinking' && !bk.signature)) });
        if (!uses.length || res.stop_reason !== 'tool_use') break;
        const results = uses.map(u => { let result; try { result = runTool(u.name, u.input || {}); } catch (e) { result = { ok: false, error: e.message }; } actions.push({ name: u.name, input: u.input, result }); onEvent?.({ type: 'tool', name: u.name, input: u.input, result }); return { type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(result), is_error: !result.ok }; });
        msgs.push({ role: 'user', content: results });
      }
      const text = parts.join('\n').trim() || 'Done.';
      history.push({ role: 'assistant', content: text, t: Date.now() });
      saveHist();
      return { text, parts, actions, model };
    },
    labelFor(a) {
      const L = TOOL_LABEL[a.name] || a.name;
      if (!a.result?.ok) return `${L} — failed (${a.result?.error || 'error'})`;
      if (a.name === 'add_shift') return `${L}: ${fmt(a.input.starts_at)}–${new Date(a.input.ends_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      if (a.name === 'add_event' || a.name === 'add_task') return `${L}: ${a.input.title}${a.input.starts_at || a.input.due ? ' · ' + fmt(a.input.starts_at || a.input.due) : ''}`;
      if (a.name === 'add_watch') return `${L}: ${a.input.text}`;
      return L;
    },
  };
  window.Eden = Eden;
})();
