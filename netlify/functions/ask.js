import { getStore } from '@netlify/blobs';
import { createHmac, randomUUID } from 'node:crypto';
import { ROSTER } from '../roster.js';
import { STAFF_LOGINS, STAFF_ADMINS } from '../staff.js';

const KEY = 'live-content';
const ASK = 'ask-threads';
const SECRET = process.env.ASK_SECRET || 'cccoc-ask-7f3e9b21c4';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});
const hashOf = (id) => createHmac('sha256', SECRET).update(String(id).trim().toUpperCase()).digest('hex');
const handleOf = (h) => 'Member ' + String(1000 + (parseInt(h.slice(0, 8), 16) % 9000));
const scrub = (t) => String(t || '').slice(0, 2000)
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[contact hidden]')
  .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[contact hidden]')
  .trim();
const forMember = (t) => ({ id: t.id, handle: t.handle, subject: t.subject, closed: !!t.closed, updated: t.updated,
  unread: !!t.memberUnread,
  messages: t.messages.map((m, i) => ({ i, from: m.from, text: m.removed ? 'Message removed by Council staff.' : m.text, at: m.at, removed: !!m.removed, reported: !!m.reported })) });
const forStaff = (t, suspended) => ({ id: t.id, handle: t.handle, subject: t.subject, closed: !!t.closed, updated: t.updated,
  unread: !!t.staffUnread, suspended: !!suspended[t.owner], reported: t.messages.some(m => m.reported && !m.removed),
  messages: t.messages.map((m, i) => ({ i, from: m.from, staffName: m.staffName || '', text: m.text, at: m.at, removed: !!m.removed, removedBy: m.removedBy || '', reported: !!m.reported })) });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (process.env.ASK_ENABLED !== 'true') return json({ error: 'Not available' }, 404);
  const body = (await req.json().catch(() => null)) || {};
  const store = getStore({ name: 'council-app', consistency: 'strong' });
  const box = (await store.get(ASK, { type: 'json' })) || { threads: [], suspended: {} };
  box.threads = box.threads || []; box.suspended = box.suspended || {};
  const now = new Date().toISOString();
  const save = () => store.setJSON(ASK, box);
  const { action } = body;

  if (body.staffLogin) {
    const data = (await store.get(KEY, { type: 'json' })) || {};
    const over = data.staffPw || {};
    const staff = STAFF_LOGINS.find(s => s.login.toLowerCase() === String(body.staffLogin).trim().toLowerCase() &&
      (over[s.login] || s.pw) === String(body.staffPw || '').trim().toLowerCase());
    if (!staff) return json({ error: 'Sign in with your staff login first' }, 401);
    const list = () => json({ ok: true, isAdmin: STAFF_ADMINS.includes(staff.login),
      threads: box.threads.slice().sort((a, b) => String(b.updated).localeCompare(String(a.updated))).map(t => forStaff(t, box.suspended)) });
    if (action === 'list') return list();
    const t = box.threads.find(x => x.id === body.threadId);
    if (!t) return json({ error: 'Conversation not found' }, 404);
    if (action === 'read') t.staffUnread = false;
    else if (action === 'reply') {
      const text = scrub(body.text);
      if (!text) return json({ error: 'Empty message' }, 400);
      t.messages.push({ from: 'staff', staffName: staff.name, text, at: now });
      t.updated = now; t.memberUnread = true; t.staffUnread = false; t.closed = false;
    } else if (action === 'removeMsg') {
      const m = t.messages[Number(body.index)];
      if (m) { m.removed = true; m.removedBy = staff.name; m.removedAt = now; }
    } else if (action === 'clearReport') {
      const m = t.messages[Number(body.index)];
      if (m) m.reported = false;
    } else if (action === 'suspend') {
      if (body.on) box.suspended[t.owner] = { by: staff.name, at: now }; else delete box.suspended[t.owner];
    } else if (action === 'close') {
      t.closed = !!body.on; t.updated = now;
    } else return json({ error: 'Unknown action' }, 400);
    await save();
    return list();
  }

  const { id, pw } = body;
  if (!id || !pw) return json({ error: 'Missing credentials' }, 400);
  const data = (await store.get(KEY, { type: 'json' })) || {};
  const overrides = data.overrides || {};
  const all = [...(data.members || []), ...ROSTER.map(r => ({ ...r, ...(overrides[String(r.id)] || {}) }))];
  const me = all.find(r => String(r.id).toUpperCase() === String(id).trim().toUpperCase() &&
    String(r.pw).toLowerCase() === String(pw).trim().toLowerCase());
  if (!me) return json({ error: 'Sign in again' }, 401);
  const lapsed = (() => { const x = Date.parse(String(me.expires) + ' 12:00:00'); return !isNaN(x) && x < Date.now(); })();
  if (me.nonMember || lapsed) return json({ error: 'Members only', code: 'members-only' }, 403);

  const owner = hashOf(me.id);
  const handle = handleOf(owner);
  const mine = () => json({ ok: true, handle, suspended: !!box.suspended[owner],
    threads: box.threads.filter(t => t.owner === owner).sort((a, b) => String(b.updated).localeCompare(String(a.updated))).map(forMember) });
  if (action === 'mine') return mine();
  if (box.suspended[owner] && action !== 'read' && action !== 'report') return json({ error: 'Chat paused', code: 'suspended' }, 403);

  if (action === 'post') {
    const subject = scrub(body.subject).slice(0, 120), text = scrub(body.text);
    if (!subject || !text) return json({ error: 'Add a subject and a question' }, 400);
    if (box.threads.filter(t => t.owner === owner && !t.closed).length >= 10) return json({ error: 'Too many open questions' }, 429);
    box.threads.push({ id: randomUUID(), owner, handle, subject, created: now, updated: now, staffUnread: true,
      messages: [{ from: 'member', text, at: now }] });
  } else {
    const t = box.threads.find(x => x.id === body.threadId && x.owner === owner);
    if (!t) return json({ error: 'Conversation not found' }, 404);
    if (action === 'read') t.memberUnread = false;
    else if (action === 'reply') {
      if (t.closed) return json({ error: 'This conversation is closed' }, 403);
      const text = scrub(body.text);
      if (!text) return json({ error: 'Empty message' }, 400);
      t.messages.push({ from: 'member', text, at: now });
      t.updated = now; t.staffUnread = true; t.memberUnread = false;
    } else if (action === 'report') {
      const m = t.messages[Number(body.index)];
      if (m) { m.reported = true; m.reportedAt = now; t.staffUnread = true; }
    } else return json({ error: 'Unknown action' }, 400);
  }
  await save();
  return mine();
};
