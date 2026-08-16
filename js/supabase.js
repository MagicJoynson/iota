/* ============================================================
   Tiny Supabase client — lifted from the karting app's pattern:
   password grant · refresh-on-401 · localStorage session.
   Talks to the `iota` schema via PostgREST profile headers.
   ============================================================ */
(function () {
  'use strict';

  const URL = 'https://cvezetucviaemriljgck.supabase.co';
  const KEY = 'sb_publishable_tE3HFqQzfZl5UE6_pspiqg_Ivp_mV-K'; // publishable — public by design
  const SCHEMA = 'iota';
  const SESSION_KEY = 'iota.session';

  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) {}
  const listeners = new Set();
  function saveSession(s) {
    session = s;
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY);
    for (const fn of listeners) fn(s);
  }

  async function authPost(path, body, useBearer) {
    const h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (useBearer && session) h.Authorization = 'Bearer ' + session.access_token;
    const r = await fetch(URL + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || ('Error ' + r.status));
    return j;
  }
  async function signIn(email, password) {
    const j = await authPost('/auth/v1/token?grant_type=password', { email, password });
    saveSession(j); return j;
  }
  let refreshing = null;
  async function refresh() {
    if (!session || !session.refresh_token) return false;
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try { const j = await authPost('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token }); saveSession(j); return true; }
      catch (_) { saveSession(null); return false; }
      finally { refreshing = null; }
    })();
    return refreshing;
  }
  async function signOut() {
    try { if (session) await fetch(URL + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + session.access_token } }); } catch (_) {}
    saveSession(null);
  }
  /** Proactively refresh if the token is within 2 minutes of expiry. */
  async function ensureFresh() {
    if (!session) return false;
    const exp = session.expires_at ? session.expires_at * 1000 : 0;
    if (exp && exp - Date.now() < 120000) return refresh();
    return true;
  }

  /**
   * REST call against the iota schema.
   * rest('GET', 'events?order=starts_at')          → rows
   * rest('POST', 'events', {body:[...]})            → inserted rows (Prefer: return=representation)
   * rest('PATCH', 'events?id=eq.X', {body:{...}})   → updated rows
   * rest('DELETE', 'events?id=eq.X')
   */
  async function rest(method, path, opts = {}, retry = true) {
    if (!session) throw new Error('Not signed in');
    await ensureFresh();
    const h = { apikey: KEY, Authorization: 'Bearer ' + session.access_token, 'Accept-Profile': SCHEMA, 'Content-Profile': SCHEMA };
    if (opts.body !== undefined) h['Content-Type'] = 'application/json';
    h.Prefer = opts.prefer || (method === 'GET' ? '' : 'return=representation');
    if (!h.Prefer) delete h.Prefer;
    const r = await fetch(URL + '/rest/v1/' + path, { method, headers: h, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    if (r.status === 401 && retry && await refresh()) return rest(method, path, opts, false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.message || ('Data error ' + r.status)); e.status = r.status; e.details = j; throw e; }
    if (r.status === 204) return null;
    const txt = await r.text(); return txt ? JSON.parse(txt) : null;
  }

  window.SB = {
    URL, KEY, SCHEMA,
    get session() { return session; },
    get user() { return session && session.user; },
    onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    signIn, signOut, refresh, rest,
    async changePassword(pw) {
      await ensureFresh();
      const r = await fetch(URL + '/auth/v1/user', { method: 'PUT', headers: { apikey: KEY, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.msg || j.message || 'Could not change password'); return j;
    },
    /** Re-authenticate with the current password (fresh password grant). Throws if wrong. */
    async verifyPassword(pw) {
      if (!session?.user?.email) throw new Error('Not signed in');
      const j = await authPost('/auth/v1/token?grant_type=password', { email: session.user.email, password: pw });
      saveSession(j); return true;
    },
    /** Forgot password: email a recovery code (the "Reset password" email template must include {{ .Token }}). */
    async requestReset(email) { return authPost('/auth/v1/recover', { email }); },
    /** Exchange the emailed code for a session, then the caller sets a new password. */
    async verifyResetCode(email, token) {
      const j = await authPost('/auth/v1/verify', { type: 'recovery', email, token });
      saveSession(j); return j;
    },
  };
})();
