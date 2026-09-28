import { getStore } from '@netlify/blobs';
import { STAFF_LOGINS } from '../staff.js';

const MAX = 1500000;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  const store = getStore({ name: 'council-photos', consistency: 'strong' });
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const id = String(url.searchParams.get('id') || '').replace(/[^a-z0-9-]/gi, '');
    if (!id) return new Response('Not found', { status: 404 });
    const b64 = await store.get(id);
    if (!b64) return new Response('Not found', { status: 404 });
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Response(bin, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: 'Bad request' }, 400);
  // Accept a staff password changed in the app, not only the one in staff.js.
  const over = ((await getStore({ name: 'council-app', consistency: 'strong' }).get('live-content', { type: 'json' })) || {}).staffPw || {};
  const staff = STAFF_LOGINS.find(s => s.login.toLowerCase() === String(body.staffLogin || '').trim().toLowerCase() && (over[s.login] || s.pw) === String(body.staffPw || '').trim().toLowerCase());
  if (!staff) return json({ error: 'Sign in with your staff login first' }, 401);
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.data || ''));
  if (!m) return json({ error: 'Send a JPEG photo' }, 400);
  if (m[1].length > MAX) return json({ error: 'Photo is too large' }, 413);
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await store.set(id, m[1]);
  return json({ ok: true, url: '/.netlify/functions/photo?id=' + id });
};
