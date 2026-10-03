/* Localhost-only preview hook: `http://localhost:…/?preview` boots the app signed-in against
   in-memory fixtures (no network) so the signed-in screens can be screenshotted/verified.
   Inert anywhere but localhost/127.0.0.1. Not referenced by the service worker. */
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || !/[?&]preview/.test(location.search)) return;
  const U = '236d3551-7600-4ff2-abc5-f46f71100c0d';
  // ?at=2026-09-30T08:05 pins the clock for screenshots.
  const at = new URLSearchParams(location.search).get('at');
  if (at) { const RD = Date, off = new RD(at) - RD.now(); class FD extends RD { constructor(...a) { if (a.length === 0) super(RD.now() + off); else super(...a); } static now() { return RD.now() + off; } } window.Date = FD; }
  if (/[?&]fresh/.test(location.search)) { for (const k of Object.keys(localStorage)) if (k.startsWith('iota.')) localStorage.removeItem(k); }
  const iso = (d, h, m = 0) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x.toISOString(); };
  const settings = [['name', 'Alex'], ['employer', "McDonald's (Oxford Road)"], ['rateHourly', 12.64], ['payFrequency', 'fortnightly'], ['payAnchor', '2026-08-13'], ['travelCampusMin', 15], ['travelWorkMin', 30], ['travelTrackMin', 40], ['loadingMin', 15], ['travelMode', 'walk'], ['homeAddress', '90 Royce Road, Hulme, Manchester'], ['workAddress', "McDonald's, Oxford Road, Manchester"], ['trackAddress', 'Victoria Karting (Team Sport), Manchester'], ['campusAddress', 'MMU Business School, Lyceum Place'], ['termWeeks', 12], ['breakRule', { overHours: 6, longBreakMin: 45, shortBreakMin: 30 }], ['studentFinance', { provider: 'Student Finance England', kind: 'maintenance loan', year: '2026/27', total: 5048, drops: [{ date: '2026-09-28', amount: 1665.84, status: 'awaiting_confirmation' }, { date: '2027-01-11', amount: 1665.84, status: 'awaiting_confirmation' }, { date: '2027-04-12', amount: 1716.32, status: 'awaiting_confirmation' }] }]].map(([key, value]) => ({ key, value }));
  const fx = {
    settings,
    shifts: [
      { id: 's1', owner: U, starts_at: iso(-1, 16), ends_at: iso(-1, 22), role: 'Crew', status: 'worked', break_min: 30, source: 'claude' },
      { id: 's2', owner: U, starts_at: iso(0, 22), ends_at: iso(1, 6), role: 'Crew', status: 'planned', break_min: 45, source: 'claude' },
      { id: 's3', owner: U, starts_at: iso(3, 16), ends_at: iso(3, 22), role: 'Crew', status: 'planned', break_min: 30, source: 'claude' },
      { id: 's4', owner: U, starts_at: iso(5, 17), ends_at: iso(6, 0), role: 'Crew', status: 'planned', break_min: 45, source: 'claude' },
      { id: 's5', owner: U, starts_at: iso(-16, 16), ends_at: iso(-16, 22), role: 'Crew', status: 'worked', break_min: 30, source: 'claude' },
      { id: 's6', owner: U, starts_at: iso(-19, 12), ends_at: iso(-19, 21), role: 'Crew', status: 'worked', break_min: 45, source: 'claude' },
      { id: 's7', owner: U, starts_at: iso(-30, 22), ends_at: iso(-29, 6), role: 'Crew', status: 'worked', break_min: 45, source: 'claude' },
      { id: 's8', owner: U, starts_at: iso(-33, 16), ends_at: iso(-33, 22), role: 'Crew', status: 'worked', break_min: 30, source: 'claude' },
      { id: 's9', owner: U, starts_at: iso(-44, 12), ends_at: iso(-44, 20), role: 'Crew', status: 'worked', break_min: 45, source: 'claude' },
      { id: 's10', owner: U, starts_at: iso(9, 12), ends_at: iso(9, 20), role: 'Crew', status: 'planned', break_min: 45, source: 'claude' },
    ],
    pay_rates: [{ id: 'r1', employer: "McDonald's (Oxford Road)", role: 'Crew member', hourly: 12.64, effective_from: '2026-08-01' }],
    events: [

    ],
    societies: [
      { id: 'so1', name: 'MMU Karting', status: 'committee', role: 'Committee', colour: '#4DA3FF', links: [{ label: 'Society app', url: 'https://magicjoynson.github.io/mmu-karting/' }], notes: 'Flagship', sort: 0 },
      { id: 'so2', name: 'Football', status: 'prospective', colour: '#4ADE80', links: [], notes: "Try to join a team — check at Freshers' Fair", sort: 1 },
      { id: 'so3', name: 'Badminton', status: 'prospective', colour: '#FACC15', links: [], notes: 'Maybe', sort: 2 },
    ],
    watches: [{ id: 'w1', text: 'MMU timetable arrives — import into Iota', expected_by: '2026-08-18', status: 'open' }],
    tasks: [],
    time_off: [{ id: 'to1', title: 'BUKC Round 1', starts_on: iso(9, 9).slice(0, 10), ends_on: iso(10, 9).slice(0, 10), ask_by: iso(2, 9).slice(0, 10), reason: 'kart', status: 'needed' }, { id: 'to2', title: 'Home for the weekend', starts_on: iso(20, 9).slice(0, 10), ends_on: iso(21, 9).slice(0, 10), ask_by: null, reason: 'personal', status: 'asked' }],
    modules: [{ id: 'm1', code: 'ITFI', name: 'International Trade and Firm Internationalisation', colour: '#F472B6', lecturer: 'Dr Example', room: 'BS 3.12', credits: 20, links: [], status: 'current', kind: 'course' },
      { id: 'jpn', code: 'JPN', name: '日本語 · Japanese', colour: '#FF6B6B', kind: 'language', status: 'current', notes: 'Year abroad Sept 2027' },
      { id: 'pm1', name: 'Introduction to Management', colour: '#67E8F9', status: 'completed', kind: 'course', year_label: 'Foundation Year', period: '2024-25', semester: null, source_folder: '00 Foundation Year/Introduction to Management', topics: ['PESTLE analysis', 'Five Forces'], final_mark: null },
      { id: 'pm2', name: 'International Marketing', colour: '#D8B4FE', status: 'completed', kind: 'course', year_label: 'Year 1', period: '2025-26', semester: 2, source_folder: '01 Year 1/Semester 2/International Marketing', topics: ['CAGE', 'Entry modes'], final_mark: 68 }],
    module_reviews: [{ id: 'r1', module_id: 'pm1', kind: 'www', text: 'Carried a large share of the group work', draft: true }, { id: 'r2', module_id: 'pm1', kind: 'ebi', text: 'Flag low-attendance teammates early', draft: true }],
    theories: [{ id: 'th1', name: 'PESTLE', learned_in: ['pm1'], returns_in: ['ITFI', 'Year 3 strategy'], note: 'Macro scan' }, { id: 'th2', name: 'CAGE distance', learned_in: ['pm2'], returns_in: ['ITFI'], note: 'Distance framework' }, { id: 'th3', name: 'Gibbs', learned_in: [], returns_in: ['BYPP'], note: '' }],
    notes: [{ id: 'n1', section: 'uni', module_id: 'm1', week: 1, title: 'Lecture 1 — the 4 Ps', md: 'Product, price, place, promotion. Reading: ch. 1–2.', tags: [], created_at: iso(-1, 10) }, { id: 'n2', section: 'uni', module_id: null, title: null, md: 'Ask about the group project split', tags: [], created_at: iso(-2, 10) }],
    assessments: [{ id: 'a1', module_id: 'm1', title: 'Marketing report', weight_pct: 40, due_at: iso(20, 16), status: 'not_started' }],
    renewals: [{ id: 'rn1', name: '16–25 Railcard', expires_on: '2027-03-01', notes: null }],
    briefings: [], captures: [], jp_srs: [], jp_reviews: [], projects: [],
  };
  window.__previewWrites = [];
  try { const saved = JSON.parse(localStorage.getItem('iota.previewdb') || 'null'); if (saved) Object.assign(fx, saved); } catch (_) {}
  const savePv = () => { try { const c = { ...fx }; delete c.settings; localStorage.setItem('iota.previewdb', JSON.stringify(c)); } catch (_) {} };
  // In-memory PostgREST: GET returns the table, POST upserts, PATCH/DELETE by id — so writes survive a sync.
  SB.rest = async (method, path, opts) => {
    const table = path.split('?')[0], id = (path.match(/id=eq\.([^&]+)/) || [])[1];
    const t = fx[table] = fx[table] || [];
    if (method === 'GET') return t.slice();
    window.__previewWrites.push({ method, path, body: opts && opts.body });
    if (method === 'POST' && table !== 'settings') { for (const r of [].concat(opts.body)) { const i = t.findIndex(x => x.id === r.id); if (i < 0) t.push({ ...r }); else if (!/ignore/.test(opts.prefer || '')) t[i] = { ...t[i], ...r }; } }
    if (method === 'PATCH' && id) { const i = t.findIndex(x => x.id === id); if (i >= 0) t[i] = { ...t[i], ...opts.body }; }
    if (method === 'DELETE' && id) fx[table] = t.filter(x => x.id !== id);
    savePv();
    return null;
  };
  Object.defineProperty(SB, 'session', { get: () => ({ access_token: 'preview', user: { email: 'alex.joynson@hotmail.co.uk' } }), configurable: true });
  Object.defineProperty(SB, 'user', { get: () => SB.session.user, configurable: true });
  console.info('Iota preview mode: fixtures, no network');
})();
