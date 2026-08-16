/* Localhost-only preview hook: `http://localhost:…/?preview` boots the app signed-in against
   in-memory fixtures (no network) so the signed-in screens can be screenshotted/verified.
   Inert anywhere but localhost/127.0.0.1. Not referenced by the service worker. */
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || !/[?&]preview/.test(location.search)) return;
  const U = '236d3551-7600-4ff2-abc5-f46f71100c0d';
  const iso = (d, h, m = 0) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x.toISOString(); };
  const settings = [['name', 'Alex'], ['employer', "McDonald's (Oxford Road)"], ['rateHourly', 12.64], ['payFrequency', 'fortnightly'], ['payAnchor', '2026-08-13'], ['travelCampusMin', 15], ['travelWorkMin', 30], ['travelTrackMin', 40], ['loadingMin', 15], ['travelMode', 'walk'], ['homeAddress', '90 Royce Road, Hulme, Manchester'], ['workAddress', "McDonald's, Oxford Road, Manchester"], ['trackAddress', 'Victoria Karting (Team Sport), Manchester'], ['campusAddress', 'MMU Business School, Lyceum Place'], ['termWeeks', 12], ['breakRule', { overHours: 6, longBreakMin: 45, shortBreakMin: 30 }]].map(([key, value]) => ({ key, value }));
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
      { id: 'e1', kind: 'uni', title: 'Lecture — Marketing Principles', module_id: 'm1', starts_at: iso(2, 9), ends_at: iso(2, 11), location: 'BS 3.12', status: 'planned', source: 'claude' },
      { id: 'e2', kind: 'kart', title: "Freshers' Fair — day 1", starts_at: '2026-09-29T09:00:00+00:00', ends_at: '2026-09-29T15:00:00+00:00', location: 'MMU campus', status: 'planned', source: 'claude' },
    ],
    societies: [
      { id: 'so1', name: 'MMU Karting', status: 'committee', role: 'Committee', colour: '#4DA3FF', links: [{ label: 'Society app', url: 'https://magicjoynson.github.io/mmu-karting/' }], notes: 'Flagship', sort: 0 },
      { id: 'so2', name: 'Football', status: 'prospective', colour: '#4ADE80', links: [], notes: "Try to join a team — check at Freshers' Fair", sort: 1 },
      { id: 'so3', name: 'Badminton', status: 'prospective', colour: '#FACC15', links: [], notes: 'Maybe', sort: 2 },
    ],
    watches: [{ id: 'w1', text: 'MMU timetable arrives — import into Iota', expected_by: '2026-08-18', status: 'open' }],
    tasks: [{ id: 't1', title: 'Sort student finance letter', section: 'personal', due: iso(4, 12), status: 'open' }],
    time_off: [{ id: 'to1', title: 'BUKC Round 1', starts_on: iso(9, 9).slice(0, 10), ends_on: iso(10, 9).slice(0, 10), ask_by: iso(2, 9).slice(0, 10), reason: 'kart', status: 'needed' }, { id: 'to2', title: 'Home for the weekend', starts_on: iso(20, 9).slice(0, 10), ends_on: iso(21, 9).slice(0, 10), ask_by: null, reason: 'personal', status: 'asked' }],
    modules: [{ id: 'm1', code: 'BUS101', name: 'Marketing Principles', colour: '#F472B6', lecturer: 'Dr Example', room: 'BS 3.12', credits: 20, links: [] }],
    notes: [{ id: 'n1', section: 'uni', module_id: 'm1', week: 1, title: 'Lecture 1 — the 4 Ps', md: 'Product, price, place, promotion. Reading: ch. 1–2.', tags: [], created_at: iso(-1, 10) }, { id: 'n2', section: 'uni', module_id: null, title: null, md: 'Ask about the group project split', tags: [], created_at: iso(-2, 10) }],
    assessments: [{ id: 'a1', module_id: 'm1', title: 'Marketing report', weight_pct: 40, due_at: iso(20, 16), status: 'not_started' }],
    renewals: [{ id: 'rn1', name: '16–25 Railcard', expires_on: '2027-03-01', notes: null }],
    briefings: [], captures: [],
  };
  window.__previewWrites = [];
  SB.rest = async (method, path, opts) => { if (method === 'GET') return fx[path.split('?')[0]] || []; window.__previewWrites.push({ method, path, body: opts && opts.body }); return null; };
  Object.defineProperty(SB, 'session', { get: () => ({ access_token: 'preview', user: { email: 'alex.joynson@hotmail.co.uk' } }), configurable: true });
  Object.defineProperty(SB, 'user', { get: () => SB.session.user, configurable: true });
  console.info('Iota preview mode: fixtures, no network');
})();
