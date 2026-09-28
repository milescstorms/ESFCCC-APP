import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { STAFF_LOGINS } from '../staff.js';

// Resource files (PDFs and images) that staff upload from the portal's Resources tab.
// Staff upload with their login; anyone with a resource's link can open it (ids are random).
const MAX = 4 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

export default async (req) => {
  const files = getStore({ name: 'esfccc-files', consistency: 'strong' });

  if (req.method === 'GET') {
    const id = String(new URL(req.url).searchParams.get('id') || '').replace(/[^a-f0-9-]/gi, '');
    if (!id) return new Response('Not found', { status: 404 });
    const [b64, meta] = await Promise.all([files.get('f/' + id), files.get('meta/' + id, { type: 'json' })]);
    if (!b64 || !meta) return new Response('Not found', { status: 404 });
    const safeName = String(meta.name || 'file').replace(/[^\w .()-]/g, '_');
    return new Response(Buffer.from(b64, 'base64'), { headers: {
      'content-type': meta.mime,
      'content-disposition': 'inline; filename="' + safeName + '"',
      'cache-control': 'private, max-age=3600',
      'x-content-type-options': 'nosniff'
    } });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = (await req.json().catch(() => null)) || {};

  const main = getStore({ name: 'council-app', consistency: 'strong' });
  const over = ((await main.get('live-content', { type: 'json' })) || {}).staffPw || {};
  const staff = STAFF_LOGINS.find(s => s.login.toLowerCase() === String(body.staffLogin || '').trim().toLowerCase() &&
    (over[s.login] || s.pw) === String(body.staffPw || '').trim().toLowerCase());
  if (!staff) return json({ error: 'Sign in with your staff login first' }, 401);

  const mime = String(body.mime || '').toLowerCase();
  if (!TYPES.includes(mime)) return json({ error: 'Upload a PDF or a photo' }, 400);
  const b64 = String(body.data || '');
  if (!/^[A-Za-z0-9+/=]+$/.test(b64)) return json({ error: 'Bad file' }, 400);
  const size = Buffer.byteLength(b64, 'base64');
  if (!size) return json({ error: 'Empty file' }, 400);
  if (size > MAX) return json({ error: 'File too large' }, 413);

  const id = randomUUID();
  await files.set('f/' + id, b64);
  await files.setJSON('meta/' + id, { mime, name: String(body.name || '').slice(0, 120), size, by: staff.name, at: new Date().toISOString() });
  return json({ ok: true, url: '/.netlify/functions/files?id=' + id });
};
