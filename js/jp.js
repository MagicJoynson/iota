/* ============================================================
   IOTA — 日本語 module (University › Modules › Japanese, kind 'language')
   Static content packs (assets/jp) + FSRS-4.5-lite scheduler + SRS state
   in Supabase (jp_srs / jp_reviews via Store, offline outbox).
   Exposes window.JP = { render(el, module), summary(), stats(), ready }.
   The glyph is the hero: kana/kanji render huge, everything else stays out of the way.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 86400000;
  const JP = { ready: false };
  const PACK_FILES = ['kana', 'vocab-n5', 'vocab-n4', 'vocab-n3', 'kanji-n5', 'kanji-n4', 'kanji-n3', 'grammar-n5', 'grammar-n4', 'phrases', 'numbers-counters', 'study-plan'];
  const TYPE_LABEL = { kana: 'Kana', vocab: 'Vocab', kanji: 'Kanji', grammar: 'Grammar', phrase: 'Phrases' };

  // ------------------------------------------------------------
  // Content
  // ------------------------------------------------------------
  let items = new Map(), order = [], plan = null, numbers = null, attributions = [], loading = null;
  const byType = t => order.filter(x => x.type === t);
  function normalise(name, j) {
    const src = j.source ? `${name}: ${j.source}` : null; if (src) attributions.push(src);
    if (name === 'study-plan') { plan = j; return; }
    if (name === 'numbers-counters') { numbers = j.sections || j; return; }
    const lvl = (name.match(/-(n\d)$/) || [])[1] || null;
    for (const it of (j.items || [])) {
      let row = null;
      if (name === 'kana') row = { type: 'kana', level: 'kana', p: it };
      else if (name.startsWith('vocab')) row = { type: 'vocab', level: lvl, p: it };
      else if (name.startsWith('kanji')) row = { type: 'kanji', level: lvl, p: it };
      else if (name.startsWith('grammar')) row = { type: 'grammar', level: lvl, p: it };
      else if (name === 'phrases') row = { type: 'phrase', level: 'phrase', p: it };
      if (row) { row.id = it.id; items.set(it.id, row); order.push(row); }
    }
  }
  function load() {
    if (loading) return loading;
    loading = Promise.all(PACK_FILES.map(n => fetch(`./assets/jp/${n}.json`).then(r => { if (!r.ok) throw new Error(n); return r.json(); }).then(j => [n, j]).catch(e => { console.warn('jp pack', e); return [n, null]; })))
      .then(res => {
        for (const [n, j] of res) if (j) normalise(n, j);
        // Learn order: hiragana (base → dakuten → combo) before katakana — romaji is scaffolding to drop in week 1.
        const G = { base: 0, dakuten: 1, combo: 2 }, SC = { hiragana: 0, katakana: 1 };
        const kana = order.filter(x => x.type === 'kana'), rest = order.filter(x => x.type !== 'kana');
        kana.sort((a, b) => (SC[a.p.script] - SC[b.p.script]) || (G[a.p.group] - G[b.p.group]) || a.id.localeCompare(b.id));
        order = kana.concat(rest);
        JP.ready = items.size > 0; return JP.ready;
      });
    return loading;
  }

  // ------------------------------------------------------------
  // Romaji → kana IME (Hepburn + common variants). Enough for kana drills and readings.
  // ------------------------------------------------------------
  const ROMA = {
    a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
    ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ', ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
    sa: 'さ', shi: 'し', si: 'し', su: 'す', se: 'せ', so: 'そ', za: 'ざ', ji: 'じ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
    ta: 'た', chi: 'ち', ti: 'ち', tsu: 'つ', tu: 'つ', te: 'て', to: 'と', da: 'だ', di: 'ぢ', dzi: 'ぢ', du: 'づ', dzu: 'づ', de: 'で', do: 'ど',
    na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
    ha: 'は', hi: 'ひ', fu: 'ふ', hu: 'ふ', he: 'へ', ho: 'ほ', ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ', pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
    ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も', ya: 'や', yu: 'ゆ', yo: 'よ',
    ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ', wa: 'わ', wo: 'を', o_: 'を', n: 'ん', nn: 'ん', "n'": 'ん',
    kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ', gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ', sha: 'しゃ', shu: 'しゅ', sho: 'しょ', sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
    ja: 'じゃ', ju: 'じゅ', jo: 'じょ', jya: 'じゃ', jyu: 'じゅ', jyo: 'じょ', zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ', cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ', tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
    nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ', hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ', bya: 'びゃ', byu: 'びゅ', byo: 'びょ', pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
    mya: 'みゃ', myu: 'みゅ', myo: 'みょ', rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ', dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
    fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ', va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ', wi: 'うぃ', we: 'うぇ', she: 'しぇ', je: 'じぇ', che: 'ちぇ', tsa: 'つぁ', tse: 'つぇ', tso: 'つぉ', ti_: 'てぃ', di_: 'でぃ',
    xa: 'ぁ', xi: 'ぃ', xu: 'ぅ', xe: 'ぇ', xo: 'ぉ', xya: 'ゃ', xyu: 'ゅ', xyo: 'ょ', xtsu: 'っ', xtu: 'っ', la: 'ぁ', li: 'ぃ', lu: 'ぅ', le: 'ぇ', lo: 'ぉ', lya: 'ゃ', lyu: 'ゅ', lyo: 'ょ', ltsu: 'っ', ltu: 'っ',
  };
  const MACRON = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'ou', â: 'aa', î: 'ii', û: 'uu', ê: 'ee', ô: 'ou' };
  function toKana(src, kata) {
    let s = String(src || '').toLowerCase().replace(/[āīūēōâîûêô]/g, c => MACRON[c]).replace(/-/g, 'ー').replace(/\s+/g, '');
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === 'ー' || c === '~') { out += 'ー'; i++; continue; }
      // sokuon: doubled consonant (not n, not vowel)
      if (i + 1 < s.length && c === s[i + 1] && /[bcdfghjklmpqrstvwxyz]/.test(c) && c !== 'n') { out += 'っ'; i++; continue; }
      // syllabic ん: n at end, n', nn, or n before a consonant (na/ni/nu/ne/no/nya… fall through to the table)
      if (c === 'n') {
        const n1 = s[i + 1], n2 = s[i + 2];
        if (n1 === undefined) { out += 'ん'; i++; continue; }
        if (n1 === "'") { out += 'ん'; i += 2; continue; }
        if (n1 === 'n') { if (n2 === undefined || !/[aiueoy]/.test(n2)) { out += 'ん'; i += 2; } else { out += 'ん'; i += 1; } continue; }
        if (!/[aiueoy]/.test(n1)) { out += 'ん'; i++; continue; }
      }
      let matched = false;
      for (const len of [4, 3, 2, 1]) { const seg = s.slice(i, i + len); if (ROMA[seg]) { out += ROMA[seg]; i += len; matched = true; break; } }
      if (!matched) { out += c; i++; }
    }
    if (kata) out = out.replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    return out;
  }
  const kataToHira = s => String(s || '').replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const normKana = s => kataToHira(s).replace(/[\s。、.\-ー]/g, m => m === 'ー' ? 'ー' : '');
  const isKanaStr = s => /^[぀-ヿーー]+$/.test(s || '');

  // ------------------------------------------------------------
  // FSRS-4.5 (default weights, no optimiser). Retention target 0.9.
  // ------------------------------------------------------------
  const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567];
  const FACTOR = 19 / 81, DECAY = -0.5, RETENTION = 0.9;
  const clampD = d => Math.min(10, Math.max(1, d));
  const initS = g => W[g - 1];
  const initD = g => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
  const retrievability = (tDays, s) => s <= 0 ? 0 : Math.pow(1 + FACTOR * tDays / s, DECAY);
  const intervalFor = s => Math.max(1, Math.round(s / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1)));
  function nextDifficulty(d, g) { const nd = d - W[6] * (g - 3); return clampD(W[7] * initD(4) + (1 - W[7]) * nd); }
  function recallStability(d, s, r, g) { const hard = g === 2 ? W[15] : 1, easy = g === 4 ? W[16] : 1; return s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1); }
  /** Apply a grade (1 again · 2 hard · 3 good · 4 easy) to an SRS row → patch. */
  function schedule(row, g, now = new Date()) {
    const last = row.last_review ? new Date(row.last_review) : null;
    const elapsed = last ? Math.max(0, (now - last) / DAY) : 0;
    let s = +row.stability || 0, d = +row.difficulty || 5, state = row.state || 'new', lapses = row.lapses || 0;
    if (state === 'new' || !s) { s = initS(g); d = initD(g); state = g === 1 ? 'learning' : 'review'; if (g === 1) lapses += 0; }
    else {
      const r = retrievability(elapsed, s);
      d = nextDifficulty(d, g);
      if (g === 1) { s = Math.max(0.1, s * 0.5); state = 'learning'; lapses += 1; }        // contract: lapse halves stability
      else { s = recallStability(d, s, r, g); state = 'review'; }
    }
    if (state === 'review' && s >= 120) state = 'burned';
    const days = g === 1 ? 0 : intervalFor(s);
    const due = new Date(now.getTime() + (g === 1 ? 10 * 60000 : days * DAY));
    return { state, stability: s, difficulty: d, due: due.toISOString(), last_review: now.toISOString(), reps: (row.reps || 0) + 1, lapses, suspended: lapses >= 8, elapsedDays: elapsed };
  }
  JP.fsrs = { schedule, intervalFor, retrievability };

  // ------------------------------------------------------------
  // SRS state helpers (Store-backed)
  // ------------------------------------------------------------
  const srsRows = () => Store.list('jp_srs');
  const srsMap = () => { const m = new Map(); for (const r of srsRows()) m.set(r.item_id, r); return m; };
  const S = () => Store.settings;
  const dueRows = (now = new Date()) => srsRows().filter(r => !r.suspended && r.state !== 'new' && r.due && new Date(r.due) <= now).sort((a, b) => new Date(a.due) - new Date(b.due));
  const localDay = d => new Date(d).toLocaleDateString('en-CA');
  const learnedToday = (now = new Date()) => srsRows().filter(r => localDay(r.created_at) === localDay(now)).length;
  const learnedTodayByType = (now = new Date()) => { const c = { kana: 0, vocab: 0, kanji: 0, grammar: 0, phrase: 0 }; for (const r of srsRows()) if (localDay(r.created_at) === localDay(now)) { const it = items.get(r.item_id); if (it) c[it.type]++; } return c; };
  const maturity = r => !r ? 'none' : r.state === 'burned' ? 'gold' : r.stability >= 21 ? 'silver' : r.state === 'review' || r.state === 'learning' ? 'bronze' : 'none';

  function planWeek(now = new Date()) {
    if (!plan) return null;
    const start = new Date(plan.start + 'T00:00:00');
    let wk = Math.floor((now - start) / (7 * DAY)) + 1; wk = Math.max(1, Math.min(plan.weeks.length, wk));
    return plan.weeks[wk - 1];
  }
  const stageIndex = name => plan ? [...new Set(plan.weeks.map(w => w.stage))].indexOf(name) : -1;
  /** Daily new-item quota per type from the plan week's quota string, scaled to jpDailyNewCap. Kana stays first until cleared. */
  function quotas(now = new Date()) {
    const cap = +S().jpDailyNewCap || 10;
    const q = { kana: 0, vocab: 0, kanji: 0, grammar: 0, phrase: 0 };
    const wk = planWeek(now);
    const txt = (wk?.quota || '').toLowerCase();
    const re = /(kana|vocab|kanji|grammar|phrases?)\s*:?\s*(\d+)\s*(?:new)?\s*\/\s*(day|wk)/g; let m;
    while ((m = re.exec(txt))) { const t = m[1].startsWith('phrase') ? 'phrase' : m[1]; q[t] = m[3] === 'wk' ? Math.max(1, Math.round(+m[2] / 7)) : +m[2]; }
    if (/numbers pack/.test(txt) && !q.phrase) q.phrase = 2;
    const kanaLeft = byType('kana').filter(x => !srsMap().has(x.id)).length;
    if (kanaLeft && !q.kana) q.kana = 6;                    // kana first, always
    if (!kanaLeft) q.kana = 0;
    if (!Object.values(q).some(Boolean)) { q.vocab = 6; q.kanji = 1; q.grammar = 1; q.phrase = 2; }
    const sum = Object.values(q).reduce((a, b) => a + b, 0);
    if (sum > cap) { const k = cap / sum; for (const t in q) if (q[t]) q[t] = Math.max(1, Math.floor(q[t] * k)); }
    return q;
  }
  function unlocked(it) {
    if (it.level === 'n3') return maturePct('n4') >= 0.8;
    if (it.type === 'grammar' && it.level === 'n4') { const wk = planWeek(); return (wk && stageIndex(wk.stage) >= stageIndex('N4 core')) || learnedPct(x => x.type === 'grammar' && x.level === 'n5') >= 0.8; }
    if (it.type !== 'kana' && it.type !== 'phrase') { const kanaLeft = byType('kana').filter(x => x.p.group === 'base' && !srsMap().has(x.id)).length; if (kanaLeft > 20) return false; } // base kana first
    return true;
  }
  function learnedPct(pred) { const pool = order.filter(pred); if (!pool.length) return 0; const m = srsMap(); return pool.filter(x => m.has(x.id)).length / pool.length; }
  function maturePct(level) { const pool = order.filter(x => x.level === level && (x.type === 'vocab' || x.type === 'kanji')); if (!pool.length) return 0; const m = srsMap(); return pool.filter(x => { const r = m.get(x.id); return r && (r.state === 'burned' || r.stability >= 21); }).length / pool.length; }
  /** Next new items available today, honouring quotas & unlocks. */
  function newQueue(now = new Date()) {
    const q = quotas(now), done = learnedTodayByType(now), m = srsMap(); const out = [];
    for (const t of ['kana', 'phrase', 'vocab', 'kanji', 'grammar']) {
      const left = Math.max(0, q[t] - done[t]); if (!left) continue;
      out.push(...byType(t).filter(x => !m.has(x.id) && unlocked(x)).slice(0, left));
    }
    return out;
  }
  function streak(now = new Date()) {
    const days = new Set(Store.list('jp_reviews').map(r => localDay(r.reviewed_at)));
    let n = 0; const d = new Date(now); if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
    while (days.has(localDay(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function stats(now = new Date()) {
    const rows = srsRows(), due = dueRows(now).length, learned = rows.length;
    const leeches = rows.filter(r => r.suspended).length;
    const wk = planWeek(now);
    const dep = S().japanDeparture || plan?.departure_target || '2027-09-01';
    const depDate = new Date((dep.length === 7 ? dep + '-01' : dep) + 'T00:00:00');
    const daysToJapan = Math.ceil((depDate - now) / DAY);
    const rev7 = Store.list('jp_reviews').filter(r => now - new Date(r.reviewed_at) < 7 * DAY);
    const acc7 = rev7.length ? rev7.filter(r => r.grade >= 2).length / rev7.length : null;
    // pace vs plan: expected learned = sum of quotas per elapsed day (approx cap × days elapsed since plan start × 0.8)
    const start = plan ? new Date(plan.start + 'T00:00:00') : now; const elapsed = Math.max(0, (now - start) / DAY);
    const expected = Math.round(Math.min(elapsed, 400) * (+S().jpDailyNewCap || 10) * 0.8);
    return { due, learned, leeches, streak: streak(now), week: wk?.week || 1, stage: wk?.stage || '—', daysToJapan, reviews7: rev7.length, accuracy7: acc7, expected, pace: expected ? learned / expected : null, minutesDue: Math.round(due * 7 / 60) };
  }
  JP.stats = stats;
  /** One cheap line for EDEN's context. */
  JP.summary = function () {
    if (!items.size) return null;
    const s = stats();
    const known = srsRows().filter(r => r.state === 'review' || r.state === 'burned').map(r => items.get(r.item_id)).filter(Boolean);
    const vocab = known.filter(x => x.type === 'vocab').slice(-40).map(x => x.p.word), grammar = known.filter(x => x.type === 'grammar').map(x => x.p.pattern);
    return `Japanese (module JPN): week ${s.week} of 57 (${s.stage}), ${s.daysToJapan} days to Japan; ${s.due} reviews due (~${s.minutesDue} min), streak ${s.streak}d, ${s.learned} items in SRS, ${s.leeches} leech${s.leeches === 1 ? '' : 'es'}, pace ${s.pace == null ? 'n/a' : Math.round(s.pace * 100) + '% of plan'}, 7-day accuracy ${s.accuracy7 == null ? 'n/a' : Math.round(s.accuracy7 * 100) + '%'}. Known grammar: ${grammar.length ? grammar.join(', ') : 'none yet'}. Recent known vocab: ${vocab.length ? vocab.join('、') : 'none yet'}. When speaking Japanese with him, use ONLY these patterns/words plus kana; corrections in [brackets]; never mock mistakes.`;
  };

  // ------------------------------------------------------------
  // Speech
  // ------------------------------------------------------------
  function speak(text) {
    try { if (!('speechSynthesis' in window)) return false; const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 0.9; const v = speechSynthesis.getVoices().find(v => /^ja/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } catch (_) { return false; }
  }

  // ------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------
  const TABS = [['path', '道', 'Path'], ['learn', '学', 'Learn'], ['review', '復', 'Review'], ['library', '辞書', 'Library'], ['speak', '話', 'Speak']];
  const tabState = {};
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const glyphOf = it => it.type === 'kana' ? it.p.kana : it.type === 'vocab' ? it.p.word : it.type === 'kanji' ? it.p.kanji : it.type === 'grammar' ? it.p.pattern : it.p.ja;
  const meaningOf = it => it.type === 'kana' ? it.p.romaji : it.type === 'vocab' ? it.p.meaning : it.type === 'kanji' ? (it.p.meanings || []).join(', ') : it.type === 'grammar' ? it.p.meaning : it.p.en;
  const readingOf = it => it.type === 'vocab' ? (it.p.reading || (isKanaStr(it.p.word) ? it.p.word : null)) : null;

  JP.render = function (el, mod) {
    el.classList.add('jp-screen');
    el.innerHTML = `<div class="jp-loading"><div class="jp-glyph">語</div><p class="sub">Loading the packs…</p></div>`;
    load().then(ok => {
      if (!ok) { el.innerHTML = `<div class="card">Couldn't load the Japanese packs (offline and never cached?). Open once online and they stay on the phone.</div>`; return; }
      const id = mod.id; tabState[id] = tabState[id] || 'path';
      el.innerHTML = `
        <div class="jp-tabs" role="tablist">${TABS.map(t => `<button class="jp-tab" data-jt="${t[0]}" role="tab"><span class="k">${t[1]}</span><span>${t[2]}</span></button>`).join('')}</div>
        <div class="jp-body" data-jp-body></div>`;
      const body = $('[data-jp-body]', el);
      const paint = () => {
        const t = tabState[id];
        el.querySelectorAll('.jp-tab').forEach(b => b.classList.toggle('active', b.dataset.jt === t));
        body.innerHTML = '';
        ({ path: renderPath, learn: renderLearn, review: renderReview, library: renderLibrary, speak: renderSpeak })[t](body, mod, () => paint());
      };
      el.querySelectorAll('.jp-tab').forEach(b => b.addEventListener('click', () => { tabState[id] = b.dataset.jt; paint(); }));
      paint();
      JP._repaint = paint;
    });
  };
  JP.setTab = (modId, t) => { tabState[modId] = t; JP._repaint?.(); };

  // ---- 道 Path (dashboard) ----
  function renderPath(body, mod, repaint) {
    const s = stats(); const now = new Date();
    const wk = planWeek(now);
    const stages = plan ? [...new Set(plan.weeks.map(w => w.stage))] : [];
    const stagePct = st => {
      const lv = /hiragana|katakana/i.test(st) ? 'kana' : /N5/.test(st) ? 'n5' : /N4/.test(st) ? 'n4' : 'n3';
      const pool = lv === 'kana' ? byType('kana').filter(x => (/hira/i.test(st) ? x.p.script === 'hiragana' : x.p.script === 'katakana')) : order.filter(x => x.level === lv);
      if (!pool.length) return 0; const m = srsMap(); return Math.round(pool.filter(x => m.has(x.id)).length / pool.length * 100);
    };
    const R = 54, C = 2 * Math.PI * R; const doneToday = Store.list('jp_reviews').filter(r => localDay(r.reviewed_at) === localDay(now)).length; const ringPct = s.due ? Math.min(1, doneToday / (doneToday + s.due)) : 1;
    const nq = newQueue(now).length;
    const line = s.due > 40 ? `${s.due} reviews are stacking up — ${s.minutesDue} minutes clears the pile. Do it before it becomes a wall.` : s.due ? `${s.due} due, about ${Math.max(1, s.minutesDue)} min. Do them now and the rest of the day is yours.` : nq ? `Nothing due. ${nq} new item${nq === 1 ? '' : 's'} waiting in Learn if you fancy it.` : `Clear. Streak ${s.streak} — see you tomorrow.`;
    body.innerHTML = `
      <div class="jp-hero card">
        <div class="jp-hero-top"><div><div class="jp-title">日本語</div><div class="sub">${esc(wk ? `Week ${wk.week} · ${wk.stage}` : 'Japanese')}</div></div><div class="jp-count"><b>${s.daysToJapan}</b><small>days to Japan</small></div></div>
        <div class="jp-ring-wrap">
          <button class="jp-ring" data-jgo="review" aria-label="Start reviews"><svg viewBox="0 0 128 128"><circle cx="64" cy="64" r="${R}" class="track"/><circle cx="64" cy="64" r="${R}" class="fill" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - ringPct)).toFixed(1)}"/></svg><div class="jp-ring-txt"><b>${s.due}</b><small>${s.due ? 'due' : 'clear'}</small></div></button>
          <div class="jp-kpis"><div><b>${s.streak}</b><small>day streak</small></div><div><b>${s.learned}</b><small>items learned</small></div><div><b>${s.minutesDue}</b><small>min today</small></div></div>
        </div>
        <div class="jp-eden"><b>EDEN</b><span>${esc(line)}</span></div>
      </div>
      ${wk ? `<div class="card"><h3>This week</h3><p class="sub">${esc(wk.goals)}</p><p class="sub" style="margin-top:6px;color:var(--text-3)">${esc(wk.quota)}</p></div>` : ''}
      <div class="tab-title" style="margin-top:6px">The Path · 57 weeks</div>
      <div class="jp-path">${stages.map((st, si) => { const wks = plan.weeks.filter(w => w.stage === st); const cur = wks.some(w => w.week === wk?.week); const done = wk && wks[wks.length - 1].week < wk.week; const pct = stagePct(st); return `<div class="jp-stage ${cur ? 'cur' : ''} ${done ? 'done' : ''}"><div class="torii">${done ? '⛩' : cur ? '⛩' : '⛩'}</div><div class="st"><b>${esc(st)}</b><span>wk ${wks[0].week}–${wks[wks.length - 1].week} · ${pct}%</span><div class="bar"><i style="width:${pct}%"></i></div></div></div>`; }).join('')}<div class="jp-stage plane"><div class="torii">✈️</div><div class="st"><b>Japan</b><span>${esc(plan?.departure_target || 'Sept 2027')}</span></div></div></div>
      <div class="card"><h3>About</h3><p class="sub">${esc(plan?.realistic_target || '')}</p><p class="field-note" style="padding:8px 0 0">Content: ${attributions.map(a => esc(a)).join(' · ')}. Scheduler: FSRS-4.5 defaults, target retention 90%.</p></div>`;
    body.querySelectorAll('[data-jgo]').forEach(b => b.addEventListener('click', () => JP.setTab(mod.id, b.dataset.jgo)));
  }

  // ---- 学 Learn ----
  function renderLearn(body, mod, repaint) {
    const now = new Date(); const q = quotas(now), done = learnedTodayByType(now); const queue = newQueue(now);
    const kanaLeft = byType('kana').filter(x => !srsMap().has(x.id)).length;
    body.innerHTML = `<div class="tab-title">Today's new items</div>
      <div class="card"><div class="jp-quota">${Object.keys(q).filter(t => q[t] || done[t]).map(t => `<div><span>${TYPE_LABEL[t]}</span><b>${done[t]}<small>/${q[t]}</small></b></div>`).join('') || '<p class="sub">Nothing scheduled today.</p>'}</div>
        <p class="field-note" style="padding:8px 0 0">${kanaLeft ? `Kana first — ${kanaLeft} to go, then vocab, kanji and grammar open up.` : 'Quotas follow the 57-week plan so reviews never turn into a wall.'} Cap ${+S().jpDailyNewCap || 10}/day (Settings → Japanese).</p></div>
      ${queue.length ? `<button class="btn primary jp-big" data-lesson>Learn ${Math.min(6, queue.length)} new item${Math.min(6, queue.length) === 1 ? '' : 's'}</button><p class="field-note" style="text-align:center;padding-top:8px">${queue.length} available today: ${Object.entries(queue.reduce((a, x) => (a[x.type] = (a[x.type] || 0) + 1, a), {})).map(([t, n]) => `${n} ${TYPE_LABEL[t].toLowerCase()}`).join(', ')}</p>` : `<div class="card empty"><div class="ico">🌸</div><h3>Done for today</h3><p>Today's new-item quota is filled. Reviews are where the memory happens — check the 復 tab.</p></div>`}
      <div class="tab-title" style="margin-top:18px">Grammar lessons</div>
      <div class="list">${byType('grammar').filter(x => unlocked(x)).slice(0, 80).map(g => { const r = srsMap().get(g.id); return `<button class="row link" data-gram="${g.id}"><span class="bar" style="background:${r ? 'var(--jp-blossom)' : 'rgba(255,255,255,.15)'}"></span><div class="t"><b class="ja">${esc(g.p.pattern)}</b><span>${esc(g.p.meaning)} · ${g.level.toUpperCase()} u${g.p.unit}</span></div>${r ? '<span class="pill" style="background:rgba(255,183,197,.16);color:var(--jp-blossom)">in SRS</span>' : ''}</button>`; }).join('')}</div>`;
    $('[data-lesson]', body)?.addEventListener('click', () => runLesson(body, mod, queue.slice(0, 6), repaint));
    body.querySelectorAll('[data-gram]').forEach(b => b.addEventListener('click', () => openGrammar(items.get(b.dataset.gram), () => repaint())));
  }
  function itemCard(it, full = true) {
    const p = it.p;
    if (it.type === 'kana') return `<div class="jp-card"><div class="jp-glyph huge">${esc(p.kana)}</div><div class="jp-ans">${esc(p.romaji)}</div>${full && p.mnemonic ? `<p class="jp-mn">${esc(p.mnemonic)}</p>` : ''}<p class="sub">${esc(p.script)} · ${esc(p.group)}</p></div>`;
    if (it.type === 'vocab') return `<div class="jp-card"><div class="jp-glyph big">${esc(p.word)}</div>${p.reading ? `<div class="jp-read">${esc(p.reading)}</div>` : ''}<div class="jp-ans">${esc(p.meaning)}</div><p class="sub">${esc(it.level.toUpperCase())} vocab</p><button class="chip" data-say="${esc(p.reading || p.word)}">🔊 listen</button></div>`;
    if (it.type === 'kanji') return `<div class="jp-card"><div class="jp-glyph huge">${esc(p.kanji)}</div><div class="jp-ans">${esc((p.meanings || []).join(', '))}</div><div class="jp-readings"><span>音 ${esc((p.on || []).join('・') || '—')}</span><span>訓 ${esc((p.kun || []).join('・') || '—')}</span></div><p class="sub">${p.strokes} strokes · ${esc((p.radicals || []).join(', '))} · ${esc(it.level.toUpperCase())}</p></div>`;
    if (it.type === 'grammar') return `<div class="jp-card gram"><div class="jp-glyph mid">${esc(p.pattern)}</div><div class="jp-ans">${esc(p.meaning)}</div><p class="jp-mn">${esc(p.explain)}</p>${(p.ex || []).map(e => `<div class="jp-ex"><div class="ja">${esc(e.ja)}</div><div class="ro">${esc(e.romaji)}</div><div class="en">${esc(e.en)}</div></div>`).join('')}</div>`;
    return `<div class="jp-card"><div class="jp-glyph mid">${esc(p.ja)}</div><div class="jp-read">${esc(p.romaji)}</div><div class="jp-ans">${esc(p.en)}</div><p class="sub">${esc(String(p.cat || '').replace(/_/g, ' '))}</p><button class="chip" data-say="${esc(p.ja)}">🔊 listen</button></div>`;
  }
  function openGrammar(g, onDone) {
    const sheet = document.createElement('div'); sheet.className = 'sheet jp-sheet';
    const r = srsMap().get(g.id);
    sheet.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="sheet-panel glass"><div class="sheet-grip"></div>${itemCard(g)}<div class="sheet-row" style="margin-top:12px"><span class="hint">${r ? 'Already in your reviews.' : 'Read it, then add it to your reviews.'}</span>${r ? '<button class="btn" data-close>Close</button>' : '<button class="btn primary" data-add>Add to SRS</button>'}</div></div>`;
    document.body.appendChild(sheet);
    sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => sheet.remove()));
    $('[data-add]', sheet)?.addEventListener('click', () => { addToSrs(g, 3); sheet.remove(); onDone?.(); });
    sheet.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say)));
  }
  function addToSrs(it, firstGrade = 3) {
    if (srsMap().has(it.id)) return srsMap().get(it.id);
    const patch = schedule({ state: 'new' }, firstGrade);
    delete patch.elapsedDays;
    const r = Store.insert('jp_srs', { item_id: it.id, ...patch });
    Store.insert('jp_reviews', { item_id: it.id, reviewed_at: new Date().toISOString(), grade: firstGrade, elapsed_days: 0, new_stability: patch.stability, new_due: patch.due, ms: null });
    return r;
  }

  /** Lesson: present 4–6 cards → mini-quiz (each item must be answered right twice, spaced) → into SRS. */
  function runLesson(body, mod, batch, repaint) {
    let idx = 0;
    const present = () => {
      const it = batch[idx];
      body.innerHTML = `<div class="jp-session"><div class="jp-prog"><i style="width:${(idx / batch.length * 100)}%"></i></div><div class="sub" style="text-align:center">New · ${idx + 1} of ${batch.length}</div>${itemCard(it)}<div class="jp-actions"><button class="btn ghost" data-quit>Stop</button><button class="btn primary" data-next>${idx + 1 < batch.length ? 'Next' : 'Quiz me'}</button></div></div>`;
      body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say)));
      $('[data-quit]', body).addEventListener('click', repaint);
      $('[data-next]', body).addEventListener('click', () => { idx++; if (idx < batch.length) present(); else quiz(); });
      if (it.type === 'phrase' || it.type === 'vocab') setTimeout(() => speak(it.type === 'phrase' ? it.p.ja : (it.p.reading || it.p.word)), 250);
    };
    const quiz = () => {
      // Two passes: everyone answered right twice (steps 1m → 10m compressed into the session).
      const need = new Map(batch.map(x => [x.id, 2])); let queue = shuffle(batch).concat(shuffle(batch)); const firstGrade = new Map();
      const step = () => {
        queue = queue.filter(x => need.get(x.id) > 0);
        if (!queue.length) { for (const it of batch) addToSrs(it, firstGrade.get(it.id) || 3); summary(); return; }
        const it = queue.shift();
        askCard(body, it, { progress: 1 - [...need.values()].reduce((a, b) => a + b, 0) / (batch.length * 2), label: 'Lesson quiz' }, res => {
          if (!firstGrade.has(it.id)) firstGrade.set(it.id, res.correct ? (res.slow ? 2 : 3) : 1);
          if (res.correct) need.set(it.id, need.get(it.id) - 1); else { need.set(it.id, 2); queue.splice(Math.min(2, queue.length), 0, it); }
          step();
        }, repaint);
      };
      step();
    };
    const summary = () => { body.innerHTML = `<div class="card empty jp-done"><div class="jp-glyph mid">よし</div><h3>${batch.length} new item${batch.length === 1 ? '' : 's'} in your reviews</h3><p>First reviews land in a few days — FSRS decides. Little and daily beats big and weekly.</p><button class="btn primary" data-back style="margin-top:14px">Back</button></div>`; $('[data-back]', body).addEventListener('click', repaint); };
    present();
  }

  /** Ask one card. cb({correct, slow, ms, grade?}) — grade only for grammar self-grade. */
  function askCard(body, it, opts, cb, quit) {
    const t0 = Date.now(); const p = it.p; let mode;
    const others = (pred, n) => shuffle(order.filter(x => x.id !== it.id && pred(x))).slice(0, n);
    let html = `<div class="jp-session"><div class="jp-prog"><i style="width:${Math.round((opts.progress || 0) * 100)}%"></i></div><div class="sub jp-sub">${esc(opts.label || 'Review')}${opts.ghost ? ' · again' : ''}</div>`;
    if (it.type === 'kana') { mode = 'type-romaji'; html += `<div class="jp-card"><div class="jp-glyph huge">${esc(p.kana)}</div><p class="sub">Type the romaji</p></div><form class="jp-input" data-f><input name="a" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="latin" placeholder="romaji" aria-label="Answer"><button class="btn primary" type="submit">Check</button></form>`; }
    else if (it.type === 'vocab' || it.type === 'kanji') {
      mode = 'choice'; const glyph = it.type === 'vocab' ? p.word : p.kanji; const ans = meaningOf(it);
      const ds = others(x => x.type === it.type && x.level === it.level, 3).map(meaningOf); const opts4 = shuffle([ans, ...ds]);
      html += `<div class="jp-card"><div class="jp-glyph ${glyph.length > 3 ? 'big' : 'huge'}">${esc(glyph)}</div><p class="sub">${it.type === 'kanji' ? 'Meaning' : 'What does it mean?'}</p></div><div class="jp-choices">${opts4.map(o => `<button class="jp-choice" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    }
    else if (it.type === 'grammar') {
      mode = 'grammar'; const ex = (p.ex || [])[0]; const ds = others(x => x.type === 'grammar', 3).map(x => x.p.pattern); const opts4 = shuffle([p.pattern, ...ds]);
      html += `<div class="jp-card gram"><div class="sub">Which pattern says…</div><div class="jp-ans" style="font-size:20px">${esc(p.meaning)}</div>${ex ? `<div class="jp-ex"><div class="en">${esc(ex.en)}</div></div>` : ''}</div><div class="jp-choices">${opts4.map(o => `<button class="jp-choice ja" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    }
    else { mode = 'choice'; const ans = p.en; const ds = others(x => x.type === 'phrase', 3).map(x => x.p.en); const opts4 = shuffle([ans, ...ds]); html += `<div class="jp-card"><button class="jp-listen" data-say="${esc(p.ja)}">🔊</button><div class="jp-glyph mid jp-hidden" data-reveal>${esc(p.ja)}</div><p class="sub">Listen — what does it mean? <button class="chip" data-show>show text</button></p></div><div class="jp-choices">${opts4.map(o => `<button class="jp-choice" data-c="${esc(o)}">${esc(o)}</button>`).join('')}</div>`; }
    html += `<div class="jp-actions"><button class="btn ghost" data-quit>Stop</button></div></div>`;
    body.innerHTML = html;
    $('[data-quit]', body).addEventListener('click', quit);
    body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say)));
    if (it.type === 'phrase') { setTimeout(() => { if (!speak(p.ja)) $('[data-reveal]', body)?.classList.remove('jp-hidden'); }, 200); $('[data-show]', body)?.addEventListener('click', () => $('[data-reveal]', body).classList.remove('jp-hidden')); }
    const finish = (correct, extra = {}) => {
      const ms = Date.now() - t0, slow = ms > 12000;
      const card = $('.jp-card', body); card.classList.add(correct ? 'ok' : 'bad');
      if (!correct) { // flip to full detail, then continue
        body.querySelectorAll('.jp-choices, .jp-input').forEach(x => x.remove());
        card.insertAdjacentHTML('afterend', `<div class="jp-reveal">${itemCard(it)}<button class="btn primary jp-big" data-cont>Got it</button></div>`);
        body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say)));
        $('[data-cont]', body).addEventListener('click', () => cb({ correct: false, slow, ms, ...extra }));
        return;
      }
      setTimeout(() => cb({ correct: true, slow, ms, ...extra }), 260);
    };
    if (mode === 'type-romaji') {
      const f = $('[data-f]', body); f.a.focus();
      f.addEventListener('submit', e => { e.preventDefault(); const v = f.a.value.trim(); if (!v) return; const want = normKana(p.kana); const got = normKana(toKana(v)); finish(got === want || v.toLowerCase() === String(p.romaji).toLowerCase()); });
    } else if (mode === 'choice') {
      const ans = meaningOf(it);
      body.querySelectorAll('.jp-choice').forEach(b => b.addEventListener('click', () => { const ok = b.dataset.c === ans; b.classList.add(ok ? 'ok' : 'bad'); if (!ok) body.querySelectorAll('.jp-choice').forEach(x => { if (x.dataset.c === ans) x.classList.add('ok'); }); if (ok && it.type === 'vocab' && readingOf(it) && !isKanaStr(p.word)) askReading(body, it, t0, cb, quit); else finish(ok); }));
    } else if (mode === 'grammar') {
      body.querySelectorAll('.jp-choice').forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.c === p.pattern; b.classList.add(ok ? 'ok' : 'bad'); if (!ok) body.querySelectorAll('.jp-choice').forEach(x => { if (x.dataset.c === p.pattern) x.classList.add('ok'); });
        // Grammar: show the mini lesson and the four explicit buttons
        body.querySelectorAll('.jp-choices').forEach(x => x.remove());
        $('.jp-card', body).insertAdjacentHTML('afterend', `<div class="jp-reveal">${itemCard(it)}<div class="jp-grades"><button data-g="1">Again</button><button data-g="2">Hard</button><button data-g="3">Good</button><button data-g="4">Easy</button></div></div>`);
        body.querySelectorAll('[data-g]').forEach(g => g.addEventListener('click', () => { const grade = +g.dataset.g; cb({ correct: ok && grade > 1, slow: Date.now() - t0 > 12000, ms: Date.now() - t0, grade: ok ? grade : Math.min(grade, 1) }); }));
      }));
    }
  }
  /** Second step for kanji-vocab: type the reading in kana (romaji IME). */
  function askReading(body, it, t0, cb, quit) {
    const p = it.p;
    body.innerHTML = `<div class="jp-session"><div class="sub jp-sub">Reading</div><div class="jp-card ok"><div class="jp-glyph big">${esc(p.word)}</div><div class="jp-ans">${esc(p.meaning)}</div><p class="sub">Type the reading (romaji becomes kana)</p></div><form class="jp-input" data-f><input name="a" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="e.g. gakusei → がくせい" aria-label="Reading"><div class="jp-ime" data-ime>&nbsp;</div><button class="btn primary" type="submit">Check</button></form><div class="jp-actions"><button class="btn ghost" data-quit>Stop</button></div></div>`;
    const f = $('[data-f]', body), ime = $('[data-ime]', body); f.a.focus();
    f.a.addEventListener('input', () => { ime.textContent = toKana(f.a.value) || ' '; });
    $('[data-quit]', body).addEventListener('click', quit);
    f.addEventListener('submit', e => { e.preventDefault(); const v = f.a.value.trim(); if (!v) return; const got = normKana(isKanaStr(v) ? v : toKana(v)); const wants = String(p.reading).split(/[;,、／/]/).map(x => normKana(x.trim())).filter(Boolean); const ok = wants.includes(got); const card = $('.jp-card', body); card.classList.remove('ok'); card.classList.add(ok ? 'ok' : 'bad'); const ms = Date.now() - t0; if (ok) setTimeout(() => cb({ correct: true, slow: ms > 15000, ms }), 260); else { f.remove(); card.insertAdjacentHTML('afterend', `<div class="jp-reveal"><div class="jp-card"><div class="jp-read" style="font-size:28px">${esc(p.reading)}</div><p class="sub">You typed ${esc(got || '—')}</p></div><button class="btn primary jp-big" data-cont>Got it</button></div>`); $('[data-cont]', body).addEventListener('click', () => cb({ correct: false, slow: false, ms })); } });
  }

  // ---- 復 Review ----
  function renderReview(body, mod, repaint) {
    const due = dueRows(); const s = stats();
    if (!due.length) { body.innerHTML = `<div class="card empty jp-done"><div class="jp-glyph mid">休</div><h3>Nothing due</h3><p>${s.learned ? `Streak ${s.streak}. Next reviews land ${nextDueLabel()}.` : 'Learn a few kana first — the 学 tab.'}</p><button class="btn" data-learn style="margin-top:14px">Go to Learn</button></div>${leechCard(repaint)}`; $('[data-learn]', body).addEventListener('click', () => JP.setTab(mod.id, 'learn')); return; }
    body.innerHTML = `<div class="card jp-start"><div class="jp-glyph mid">復習</div><h3>${due.length} review${due.length === 1 ? '' : 's'} due</h3><p class="sub">About ${Math.max(1, s.minutesDue)} min · sessions run in ${+S().jpSessionCap || 10}-minute chunks. Works offline.</p><button class="btn primary jp-big" data-start>Start</button></div>${leechCard(repaint)}`;
    $('[data-start]', body).addEventListener('click', () => runReview(body, mod, due, repaint));
  }
  function nextDueLabel() { const r = srsRows().filter(r => r.due && !r.suspended).sort((a, b) => new Date(a.due) - new Date(b.due))[0]; if (!r) return 'soon'; return Rules.fmtWhen(r.due); }
  function leechCard(repaint) {
    const l = srsRows().filter(r => r.suspended); if (!l.length) return '';
    return `<div class="card"><h3>Leeches · ${l.length}</h3><p class="sub">Items you keep forgetting (8+ lapses) — parked so they don't eat your sessions. Un-park when you're ready.</p><div class="chips-wrap">${l.slice(0, 20).map(r => { const it = items.get(r.item_id); return it ? `<button class="chip ja" data-unleech="${r.id}">${esc(glyphOf(it))} ↺</button>` : ''; }).join('')}</div></div>`;
  }
  function runReview(body, mod, due, repaint) {
    const start = Date.now(); const capMs = (+S().jpSessionCap || 10) * 60000;
    let queue = due.slice(0, 200), total = queue.length, done = 0, right = 0, ghosts = [], firstAnswered = new Set();
    const next = () => {
      if (!queue.length && ghosts.length) { queue = ghosts; ghosts = []; }
      if (!queue.length) return finish();
      if (Date.now() - start > capMs && !document.querySelector('.jp-keepgoing')) { body.innerHTML = `<div class="card empty jp-done"><div class="jp-glyph mid">一息</div><h3>${Math.round((Date.now() - start) / 60000)} minutes — nice chunk</h3><p>${done} done, ${queue.length + ghosts.length} left. Keep going or stop here; nothing is lost.</p><div style="display:flex;gap:8px;justify-content:center;margin-top:14px"><button class="btn" data-stop>Stop</button><button class="btn primary jp-keepgoing" data-more>Keep going</button></div></div>`; $('[data-stop]', body).addEventListener('click', finish); $('[data-more]', body).addEventListener('click', () => { queue.unshift({ _resume: true }); next(); }); return; }
      const row = queue.shift(); if (row._resume) { return next(); }
      const it = items.get(row.item_id); if (!it) return next();
      const ghost = firstAnswered.has(row.item_id);
      askCard(body, it, { progress: done / total, label: 'Review', ghost }, res => {
        if (!ghost) {
          firstAnswered.add(row.item_id); done++;
          const grade = res.grade || (res.correct ? (res.slow ? 2 : 3) : 1); if (grade >= 2) right++;
          const patch = schedule(row, grade); const elapsed = patch.elapsedDays; delete patch.elapsedDays;
          Store.update('jp_srs', row.id, patch);
          Store.insert('jp_reviews', { item_id: row.item_id, reviewed_at: new Date().toISOString(), grade, elapsed_days: +elapsed.toFixed(3), new_stability: +patch.stability.toFixed(3), new_due: patch.due, ms: res.ms });
          if (patch.suspended && !row.suspended) toast(`${glyphOf(it)} parked as a leech — EDEN will know.`);
          if (!res.correct) ghosts.push(row);
        } else if (!res.correct) ghosts.push(row);
        next();
      }, () => finish());
    };
    const finish = () => {
      const mins = Math.max(1, Math.round((Date.now() - start) / 60000)); const acc = done ? Math.round(right / done * 100) : 0;
      const remark = !done ? 'Stopped before the first card. It happens.' : acc >= 90 ? 'Clean. That is what daily looks like.' : acc >= 70 ? 'Solid — the misses just got shorter intervals, which is the system working.' : 'Rough one. Tomorrow\'s queue is built from exactly these — that is the point.';
      body.innerHTML = `<div class="card empty jp-done"><div class="jp-glyph mid">${done ? 'お疲れ' : '休'}</div><h3>${done} review${done === 1 ? '' : 's'} · ${acc}% · ${mins} min</h3><p>${esc(remark)}</p><button class="btn primary" data-back style="margin-top:14px">Done</button></div>`;
      $('[data-back]', body).addEventListener('click', repaint);
      Store.emit('change');
    };
    next();
  }
  const toast = msg => window.__iotaToast ? window.__iotaToast(msg) : console.log(msg);

  // ---- 辞書 Library ----
  const libState = { view: 'kana', q: '', script: 'hiragana', level: 'n5', cat: null };
  function renderLibrary(body, mod, repaint) {
    const m = srsMap();
    const views = [['kana', 'Kana'], ['kanji', 'Kanji'], ['vocab', 'Vocab'], ['grammar', 'Grammar'], ['phrase', 'Phrases'], ['numbers', 'Numbers']];
    let html = `<div class="seg jp-seg">${views.map(v => `<button data-v="${v[0]}" class="${libState.view === v[0] ? 'active' : ''}">${v[1]}</button>`).join('')}</div>`;
    if (['vocab', 'kanji', 'grammar', 'phrase'].includes(libState.view)) html += `<label class="search glass" style="margin-top:10px"><span>🔍</span><input type="search" data-q value="${esc(libState.q)}" placeholder="Search ${libState.view}…"></label>`;
    const dot = r => `<i class="mat ${maturity(r)}"></i>`;
    if (libState.view === 'kana') {
      const list = byType('kana').filter(x => x.p.script === libState.script);
      const groups = ['base', 'dakuten', 'combo'];
      html += `<div class="seg" style="margin:10px 0"><button data-script="hiragana" class="${libState.script === 'hiragana' ? 'active' : ''}">ひらがな</button><button data-script="katakana" class="${libState.script === 'katakana' ? 'active' : ''}">カタカナ</button></div>`;
      for (const g of groups) { const arr = list.filter(x => x.p.group === g); if (!arr.length) continue; html += `<div class="tab-title">${g}</div><div class="jp-grid kana">${arr.map(x => `<button class="jp-cell ${maturity(m.get(x.id))}" data-item="${x.id}"><span class="g">${esc(x.p.kana)}</span><span class="r">${esc(x.p.romaji)}</span></button>`).join('')}</div>`; }
    } else if (libState.view === 'kanji') {
      html += `<div class="seg" style="margin:10px 0">${['n5', 'n4', 'n3'].map(l => `<button data-level="${l}" class="${libState.level === l ? 'active' : ''}">${l.toUpperCase()}</button>`).join('')}</div>`;
      const q = libState.q.toLowerCase(); const list = byType('kanji').filter(x => x.level === libState.level && (!q || x.p.kanji.includes(q) || (x.p.meanings || []).some(mm => mm.toLowerCase().includes(q))));
      html += `<div class="legend jp-legend"><span><i class="mat none"></i>unlearned</span><span><i class="mat bronze"></i>learning</span><span><i class="mat silver"></i>maturing</span><span><i class="mat gold"></i>burned</span></div><div class="jp-grid kanji">${list.map(x => `<button class="jp-cell ${maturity(m.get(x.id))}" data-item="${x.id}"><span class="g">${esc(x.p.kanji)}</span></button>`).join('')}</div>${libState.level === 'n3' && !unlocked(list[0] || { level: 'n3' }) ? '<p class="field-note">N3 unlocks when N4 vocab and kanji are ~80% mature — it\'s runway, not a to-do list.</p>' : ''}`;
    } else if (libState.view === 'vocab') {
      html += `<div class="seg" style="margin:10px 0">${['n5', 'n4', 'n3'].map(l => `<button data-level="${l}" class="${libState.level === l ? 'active' : ''}">${l.toUpperCase()}</button>`).join('')}</div>`;
      const q = libState.q.toLowerCase(); const list = byType('vocab').filter(x => x.level === libState.level && (!q || x.p.word.includes(q) || (x.p.reading || '').includes(q) || x.p.meaning.toLowerCase().includes(q)));
      html += `<div class="list">${list.slice(0, 120).map(x => `<button class="row link" data-item="${x.id}">${dot(m.get(x.id))}<div class="t"><b class="ja">${esc(x.p.word)}${x.p.reading ? ` <small>${esc(x.p.reading)}</small>` : ''}</b><span>${esc(x.p.meaning)}</span></div></button>`).join('')}</div>${list.length > 120 ? `<p class="field-note">${list.length - 120} more — search to narrow.</p>` : ''}`;
    } else if (libState.view === 'grammar') {
      const q = libState.q.toLowerCase(); const list = byType('grammar').filter(x => !q || x.p.pattern.includes(q) || x.p.meaning.toLowerCase().includes(q) || x.p.explain.toLowerCase().includes(q));
      html += `<div class="list" style="margin-top:10px">${list.map(x => `<button class="row link" data-gram="${x.id}">${dot(m.get(x.id))}<div class="t"><b class="ja">${esc(x.p.pattern)}</b><span>${esc(x.p.meaning)} · ${x.level.toUpperCase()}</span></div></button>`).join('')}</div>`;
    } else if (libState.view === 'phrase') {
      const cats = [...new Set(byType('phrase').map(x => x.p.cat))]; const cat = libState.cat || cats[0];
      const q = libState.q.toLowerCase(); const list = byType('phrase').filter(x => q ? (x.p.ja.includes(q) || x.p.romaji.toLowerCase().includes(q) || x.p.en.toLowerCase().includes(q)) : x.p.cat === cat);
      html += `<div class="chips" style="padding:10px 0 6px">${cats.map(c => `<button class="chip ${c === cat && !q ? 'accent' : ''}" data-cat="${c}">${esc(c.replace(/_/g, ' '))}</button>`).join('')}</div><div class="jp-phrases">${list.map(x => `<button class="jp-phrase" data-item="${x.id}">${dot(m.get(x.id))}<div class="ja">${esc(x.p.ja)}</div><div class="ro">${esc(x.p.romaji)}</div><div class="en">${esc(x.p.en)}</div><span class="say" data-say="${esc(x.p.ja)}">🔊</span></button>`).join('')}</div>`;
    } else if (libState.view === 'numbers' && numbers) {
      html += `<div class="card"><h3>Numbers</h3><div class="jp-nums">${(numbers.numbers || []).map(n => `<div><b class="ja">${esc(n.ja)}</b><span>${n.n.toLocaleString()}</span><small>${esc(n.kana)} · ${esc(n.romaji)}</small>${n.note ? `<em>${esc(n.note)}</em>` : ''}</div>`).join('')}</div></div>`;
      html += `<div class="card"><h3>Counters</h3>${(numbers.counters || []).map(c => `<div class="jp-counter"><b class="ja">${esc(c.counter)}</b><span>${esc(c.use)}</span>${c.forms ? `<small>${esc(typeof c.forms === 'string' ? c.forms : JSON.stringify(c.forms).replace(/[{}"]/g, '').replace(/,/g, ' · ').replace(/:/g, ' '))}</small>` : ''}${c.note ? `<em>${esc(c.note)}</em>` : ''}</div>`).join('')}</div>`;
      for (const [k, arr] of Object.entries(numbers)) { if (['numbers', 'counters'].includes(k) || !Array.isArray(arr)) continue; html += `<div class="card"><h3>${esc(k.replace(/_/g, ' '))}</h3>${arr.map(x => `<div class="jp-counter"><b class="ja">${esc(x.ja || x.kana || '')}</b><span>${esc(x.en || x.meaning || x.n || '')}</span><small>${esc(x.kana && x.ja ? x.kana + ' · ' : '')}${esc(x.romaji || '')}</small></div>`).join('')}</div>`; }
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { libState.view = b.dataset.v; libState.q = ''; repaint(); }));
    body.querySelectorAll('[data-script]').forEach(b => b.addEventListener('click', () => { libState.script = b.dataset.script; repaint(); }));
    body.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => { libState.level = b.dataset.level; repaint(); }));
    body.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => { libState.cat = b.dataset.cat; libState.q = ''; repaint(); }));
    const qi = $('[data-q]', body); if (qi) { let t; qi.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { libState.q = qi.value; repaint(); const q2 = $('[data-q]', body); if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); } }, 250); }); }
    body.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', e => { if (e.target.closest('[data-say]')) return; openItem(items.get(b.dataset.item)); }));
    body.querySelectorAll('[data-gram]').forEach(b => b.addEventListener('click', () => openGrammar(items.get(b.dataset.gram), () => repaint())));
    body.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); speak(b.dataset.say); }));
    body.querySelectorAll('[data-unleech]').forEach(b => b.addEventListener('click', () => { Store.update('jp_srs', b.dataset.unleech, { suspended: false, lapses: 0 }); repaint(); }));
  }
  function openItem(it) {
    const r = srsMap().get(it.id);
    const sheet = document.createElement('div'); sheet.className = 'sheet jp-sheet';
    sheet.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="sheet-panel glass"><div class="sheet-grip"></div>${itemCard(it)}<p class="field-note" style="text-align:center">${r ? `${r.state} · stability ${(+r.stability).toFixed(1)}d · ${r.reps} reps · ${r.lapses} lapses${r.due ? ' · next ' + esc(Rules.fmtWhen(r.due)) : ''}` : 'Not in your reviews yet.'}</p><div class="sheet-row"><span class="hint"></span>${r ? '<button class="btn" data-close>Close</button>' : '<button class="btn primary" data-add>Add to SRS now</button>'}</div></div>`;
    document.body.appendChild(sheet);
    sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => sheet.remove()));
    $('[data-add]', sheet)?.addEventListener('click', () => { addToSrs(it, 3); sheet.remove(); JP._repaint?.(); });
    sheet.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say)));
  }

  // ---- 話 Speak ----
  const SCENARIOS = [
    ['greetings', '👋 Meeting someone', 'Introduce yourself to a new classmate and ask them two questions.'],
    ['konbini_shopping', '🏪 At the konbini', 'Buy a drink and an onigiri; ask if they have a bag; pay.'],
    ['restaurant', '🍜 Ordering food', 'Order for two, ask what they recommend, ask for the bill.'],
    ['directions_transport', '🚉 Lost at the station', 'Ask which platform, whether the train stops at your stop, and where the exit is.'],
    ['social', '🍻 Izakaya with friends', 'Small talk: weekend, hobbies, karting. Keep it casual.'],
    ['dorm_daily', '🏠 Dorm life', 'Tell EDEN about your day in Japanese, in three or four sentences.'],
    ['phone_admin', '📱 Phone & admin', 'Ask about a SIM contract: price per month, ID needed, cancelling.'],
    ['emergency_health', '🏥 Feeling ill', 'Explain a headache and a fever at a pharmacy; ask what to take.'],
    ['karting', '🏎️ Karting', 'Talk about a race: tyres, laps, position, what went wrong.'],
  ];
  function renderSpeak(body, mod, repaint) {
    const s = stats(); const live = window.Eden && Eden.available;
    body.innerHTML = `<div class="card"><h3>Talk to EDEN in Japanese</h3><p class="sub">She stays at your level — only the ${s.learned ? 'patterns and words you\'ve learned' : 'kana and phrases you\'ve met'} — corrects in [brackets], never mocks a mistake. Tap English if you\'re stuck.</p>${live ? '' : '<p class="field-note" style="padding:8px 0 0">Needs live mode (API key in Settings).</p>'}</div>
      <div class="tab-title">Scenarios</div>
      <div class="list">${SCENARIOS.map(sc => `<button class="row link" data-sc="${sc[0]}"><div class="t"><b>${esc(sc[1])}</b><span>${esc(sc[2])}</span></div><span class="chev">›</span></button>`).join('')}</div>
      <div class="tab-title" style="margin-top:16px">Free talk</div>
      <button class="btn" data-free style="width:100%">Explain my day in Japanese</button>
      <button class="btn ghost" data-savet style="width:100%;margin-top:8px">Save the last conversation as a note</button>
      <p class="field-note" style="padding:10px 4px 0">Weekly from week 19 in the plan; the Sunday review counts your conversations.</p>`;
    const go = txt => { sessionStorage.setItem('iota.eden.prefill', txt); location.hash = '#/eden'; };
    body.querySelectorAll('[data-sc]').forEach(b => b.addEventListener('click', () => { const sc = SCENARIOS.find(x => x[0] === b.dataset.sc); const phrases = byType('phrase').filter(x => x.p.cat === sc[0]).slice(0, 8).map(x => `${x.p.ja} (${x.p.en})`).join('; '); go(`Japanese practice — scenario: ${sc[1].replace(/^\S+\s/, '')}. ${sc[2]} You play the other person. Speak Japanese at my level with romaji in brackets after each Japanese line, English only if I ask. Useful phrases from my phrasebook: ${phrases}. Start.`); }));
    $('[data-free]', body).addEventListener('click', () => go('Japanese practice — free talk. Ask me about my day in simple Japanese (my level only), wait for my reply, correct gently in [brackets], and keep it going for a few turns.'));
    $('[data-savet]', body).addEventListener('click', () => { const h = (window.Eden?.history || []).slice(-16); if (!h.length) { toast('No recent conversation'); return; } const md = h.map(m => `**${m.role === 'user' ? 'Alex' : 'EDEN'}:** ${m.content}`).join('\n\n'); Store.insert('notes', { section: 'uni', module_id: mod.id, title: `Conversation · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, md, tags: ['speaking'] }); toast('Saved to Japanese notes'); });
  }

  JP.load = load; JP.toKana = toKana; JP.items = () => items; JP.order = () => order;
  window.JP = JP;
})();
