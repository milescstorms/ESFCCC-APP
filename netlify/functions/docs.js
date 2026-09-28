import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { ROSTER } from '../roster.js';
import { STAFF_LOGINS } from '../staff.js';
import { sendMail, backupTo } from '../mail.js';

const KEY = 'live-content';
const MAX = 4.5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = (await req.json().catch(() => null)) || {};
  const main = getStore({ name: 'council-app', consistency: 'strong' });
  const docs = getStore({ name: 'council-docs', consistency: 'strong' });
  const data = (await main.get(KEY, { type: 'json' })) || {};
  const { action } = body;

  let owner = null, by = '', facility = '';
  const overrides0 = data.overrides || {};
  const roster0 = [...(data.members || []), ...ROSTER.map(r => ({ ...r, ...(overrides0[String(r.id)] || {}) }))];
  if (body.staffLogin) {
    const over = data.staffPw || {};
    const staff = STAFF_LOGINS.find(s => s.login.toLowerCase() === String(body.staffLogin).trim().toLowerCase() &&
      (over[s.login] || s.pw) === String(body.staffPw || '').trim().toLowerCase());
    if (!staff) return json({ error: 'Sign in with your staff login first' }, 401);
    if (!body.memberId) return json({ error: 'Missing member' }, 400);
    owner = String(body.memberId).trim().toUpperCase(); by = staff.name;
    const m = roster0.find(r => String(r.id).toUpperCase() === owner); facility = (m && (m.program || m.name)) || owner;
  } else {
    const overrides = data.overrides || {};
    const all = [...(data.members || []), ...ROSTER.map(r => ({ ...r, ...(overrides[String(r.id)] || {}) }))];
    const me = all.find(r => String(r.id).toUpperCase() === String(body.id || '').trim().toUpperCase() &&
      String(r.pw).toLowerCase() === String(body.pw || '').trim().toLowerCase());
    if (!me) return json({ error: 'Sign in again' }, 401);
    owner = String(me.id).toUpperCase(); by = me.name; facility = me.program || me.name;
  }

  const idxKey = 'idx/' + owner;
  const idx = (await docs.get(idxKey, { type: 'json' })) || [];
  const list = () => json({ ok: true, docs: idx.slice().sort((a, b) => String(b.at).localeCompare(String(a.at))) });

  if (action === 'list') return list();

  if (action === 'upload') {
    const mime = String(body.mime || '').toLowerCase();
    if (!TYPES.includes(mime)) return json({ error: 'Upload a photo or PDF' }, 400);
    const bin = Buffer.from(String(body.data || ''), 'base64');
    if (!bin.length) return json({ error: 'Empty file' }, 400);
    if (bin.length > MAX) return json({ error: 'File too large' }, 413);
    if (idx.length >= 200) return json({ error: 'Too many files' }, 429);
    const entry = ((data.registrations || {})[String(body.trainingId || '')] || []).find(x => String(x.id).toUpperCase() === owner);
    if (!entry) return json({ error: 'Certificates are only for Council trainings registered in the app' }, 403);
    if (!(data.completed || {})[String(body.trainingId || '')]) return json({ error: 'Certificates can be added once the Council marks the training completed' }, 403);
    const names = entry.attendees && entry.attendees.length ? entry.attendees : [entry.name];
    if (!names.includes(String(body.person || '').trim())) return json({ error: 'That person was not registered for this training' }, 403);
    const id = randomUUID();
    await docs.set('file/' + owner + '/' + id, bin, { metadata: { mime } });
    idx.push({ id, person: String(body.person || '').trim().slice(0, 80), kind: 'Training certificate',
      trainingId: String(body.trainingId), trainingTitle: String(body.trainingTitle || entry.title || '').slice(0, 160),
      expires: String(body.expires || '').slice(0, 10), fileName: String(body.fileName || '').slice(0, 120), mime,
      size: bin.length, at: new Date().toISOString(), by });
    const doc = idx[idx.length - 1];
    const fresh = (await docs.get(idxKey, { type: 'json' })) || [];
    const merged = fresh.filter(x => x.id !== doc.id).concat(idx.filter(x => !fresh.some(f => f.id === x.id) || x.id === doc.id));
    await docs.setJSON(idxKey, merged);
    idx.length = 0; merged.forEach(x => idx.push(x));
    const ext = mime === 'application/pdf' ? 'pdf' : mime.split('/')[1].replace('jpeg', 'jpg');
    const safe = (s) => String(s || '').replace(/[^\w .-]+/g, '').trim().slice(0, 60);
    const fname = [safe(facility), safe(doc.person), safe(doc.trainingTitle)].filter(Boolean).join(', ') + '.' + ext;
    await sendMail({
      to: backupTo(),
      subject: 'Certificate backup: ' + doc.person + ', ' + (doc.trainingTitle || 'training') + ' (' + facility + ')',
      text: [
        'A certificate was uploaded to the Council member app.', '',
        'Facility: ' + facility + ' (ID ' + owner + ')',
        'Attendee: ' + doc.person,
        'Training: ' + (doc.trainingTitle || 'not listed'),
        'Expires: ' + (doc.expires || 'none given'),
        'Uploaded by: ' + by,
        'Uploaded: ' + new Date(doc.at).toLocaleString('en-US', { timeZone: 'America/New_York' }), '',
        'The file is attached. Keep this email as the backup copy. Deleting the certificate in the app does not delete this email.'
      ].join('\n'),
      attachments: [{ name: fname, mime, data: bin.toString('base64') }]
    }).catch(() => {});
    return list();
  }

  const doc = idx.find(d => d.id === body.docId);
  if (!doc) return json({ error: 'File not found' }, 404);

  if (action === 'get') {
    const buf = await docs.get('file/' + owner + '/' + doc.id, { type: 'arrayBuffer' });
    if (!buf) return json({ error: 'File not found' }, 404);
    return json({ ok: true, mime: doc.mime, data: Buffer.from(buf).toString('base64') });
  }
  if (action === 'delete') {
    await docs.delete('file/' + owner + '/' + doc.id);
    await docs.setJSON(idxKey, idx.filter(d => d.id !== doc.id));
    const left = idx.filter(d => d.id !== doc.id);
    return json({ ok: true, docs: left.sort((a, b) => String(b.at).localeCompare(String(a.at))) });
  }
  return json({ error: 'Unknown action' }, 400);
};
