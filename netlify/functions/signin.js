import { getStore } from '@netlify/blobs';
import { ROSTER } from '../roster.js';
import { STAFF_LOGINS, STAFF_ADMINS } from '../staff.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

const daysLeft = (expires) => {
  const t = Date.parse(String(expires) + ' 12:00:00');
  return isNaN(t) ? 0 : Math.round((t - Date.now()) / 86400000);
};

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { id, pw, newPw } = (await req.json().catch(() => ({}))) || {};
  if (!id || !pw) return json({ error: 'Missing credentials' }, 400);

  const store = getStore({ name: 'council-app', consistency: 'strong' });
  const live = (await store.get('live-content', { type: 'json' })) || {};
  const overrides = live.overrides || {};
  const staffPw = live.staffPw || {};
  const clean = String(newPw || '').trim().toLowerCase();
  const badNew = newPw != null && (clean.length < 8 || /\s/.test(clean));
  if (badNew) return json({ ok: false, reason: 'weak' });

  const staff = STAFF_LOGINS.find(s =>
    s.login.toLowerCase() === String(id).trim().toLowerCase() &&
    (staffPw[s.login] || s.pw) === String(pw).trim().toLowerCase());
  if (staff) {
    if (newPw != null) {
      live.staffPw = { ...staffPw, [staff.login]: clean };
      await store.setJSON('live-content', live);
      return json({ ok: true, changed: true });
    }
    return json({ ok: true, staff: { login: staff.login, name: staff.name, role: staff.role, isAdmin: STAFF_ADMINS.includes(staff.login) } });
  }

  const base = ROSTER.map(r => ({ ...r, ...(overrides[String(r.id)] || {}) }));
  const all = [...(live.members || []), ...base];

  const found = all.find(r =>
    String(r.id).toUpperCase() === String(id).trim().toUpperCase() &&
    String(r.pw).toLowerCase() === String(pw).trim().toLowerCase()
  );

  if (!found) return json({ ok: false, reason: 'nomatch' });
  if (newPw != null) {
    const own = (live.members || []).find(m => String(m.id) === String(found.id));
    if (own) own.pw = clean;
    else live.overrides = { ...overrides, [String(found.id)]: { ...(overrides[String(found.id)] || {}), pw: clean, pwChangedAt: new Date().toISOString() } };
    await store.setJSON('live-content', live);
    return json({ ok: true, changed: true });
  }
  const { pw: _drop, ...safe } = found;
  const days = daysLeft(found.expires);
  return json({ ok: true, member: { ...safe, days }, expired: days < 0 });
};
