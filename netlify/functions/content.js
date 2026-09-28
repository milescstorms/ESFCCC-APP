import { getStore } from '@netlify/blobs';
import { STAFF_LOGINS, STAFF_ADMINS } from '../staff.js';
import { ROSTER } from '../roster.js';
import { PROSPECTS } from '../prospects.js';
import { runReminders } from '../reminders.js';

const KEY = 'live-content';
const EMPTY = { trainings: [], issues: [], resources: [], members: [], overrides: {}, hidden: [], updated: null };
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

const whoIs = (login, pw, over = {}) => STAFF_LOGINS.find(s =>
  s.login.toLowerCase() === String(login || '').trim().toLowerCase() &&
  (over[s.login] || s.pw) === String(pw || '').trim().toLowerCase()
);

const load = async (store) => {
  const d = (await store.get(KEY, { type: 'json' })) || {};
  return { ...structuredClone(EMPTY), ...d, overrides: d.overrides || {} };
};

export default async (req) => {
  const store = getStore({ name: 'council-app', consistency: 'strong' });

  if (req.method === 'GET') {
    const { trainings, issues, resources, updated, registrations, hidden, overbook, closed, completed } = await load(store);
    const signups = Object.fromEntries(Object.entries(registrations || {}).map(([k, v]) => [k, (v || []).reduce((n, x) => n + (x.seats || 1), 0)]));
    return json({ trainings, issues, resources: resources || [], updated, signups, hidden: hidden || [], overbook: overbook || {}, closed: closed || {}, completed: completed || {} });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: 'Bad request' }, 400);

  const data = await load(store);
  const staff = whoIs(body.staffLogin, body.staffPw, data.staffPw || {});
  if (!staff) return json({ error: 'Sign in with your staff login first' }, 401);
  const { action, item, id, patch } = body;
  const stamp = { by: staff.name, at: new Date().toISOString() };

  if (action === 'roster') {
    const dir = STAFF_ADMINS.includes(staff.login);
    const strip = (r) => { if (dir || !r) return r; const { pw, ...rest } = r; return rest; };
    const ovr = Object.fromEntries(Object.entries(data.overrides || {}).map(([k, v]) => [k, strip(v)]));
    return json({ base: ROSTER.map(strip), members: (data.members || []).map(strip), overrides: ovr, canSeePw: dir,
      registrations: data.registrations || {}, changeRequests: (data.changeRequests || []).filter(q => q.status === 'open'), prospects: PROSPECTS, updated: data.updated, reminderLog: data.reminderLog || {} });
  }
  if (action === 'getSettings') {
    return json({ ok: true, canEdit: STAFF_ADMINS.includes(staff.login), settings: { renewalEmails: false, registrationEmails: true, ...(data.settings || {}) } });
  }
  if (action === 'setSettings') {
    if (!STAFF_ADMINS.includes(staff.login)) return json({ error: 'Only directors can change settings' }, 403);
    const p = body.patch || {};
    const next = { renewalEmails: false, registrationEmails: true, ...(data.settings || {}) };
    for (const k of ['renewalEmails', 'registrationEmails']) if (typeof p[k] === 'boolean') { next[k] = p[k]; next[k + 'By'] = staff.name; next[k + 'At'] = stamp.at; }
    data.settings = next;
    data.updated = stamp.at;
    await store.setJSON(KEY, data);
    return json({ ok: true, settings: next });
  }
  if (action === 'staffList') {
    return json({ ok: true, canReset: STAFF_ADMINS.includes(staff.login),
      staff: STAFF_LOGINS.map(s => ({ login: s.login, name: s.name, role: s.role, email: s.email, changed: !!(data.staffPw || {})[s.login],
        ...(STAFF_ADMINS.includes(staff.login) ? { pw: (data.staffPw || {})[s.login] || s.pw } : {}) })) });
  }
  if (action === 'resetStaffPw') {
    if (!STAFF_ADMINS.includes(staff.login)) return json({ error: 'Only directors can reset staff passwords' }, 403);
    const target = STAFF_LOGINS.find(s => s.login === String(body.login || ''));
    const np = String(body.newPw || '').trim().toLowerCase();
    if (!target || np.length < 8) return json({ error: 'Bad request' }, 400);
    data.staffPw = { ...(data.staffPw || {}), [target.login]: np };
    data.updated = stamp.at;
    await store.setJSON(KEY, data);
    return json({ ok: true });
  }
  if (action === 'reminders') {
    const out = await runReminders({ dry: !body.send, manual: true });
    return json({ ok: true, list: out, off: (data.settings || {}).renewalEmails !== true });
  }

  if (action === 'addTraining') data.trainings.unshift({ ...item, ...stamp });
  else if (action === 'addIssue') data.issues.unshift({ ...item, ...stamp });
  else if (action === 'addResource') { data.resources = data.resources || []; data.resources.unshift({ ...item, ...stamp }); }
  else if (action === 'addMember') data.members.unshift({ ...item, ...stamp });
  else if (action === 'editMember') {
    if (patch && 'pw' in patch && !STAFF_ADMINS.includes(staff.login)) return json({ error: 'Only admins can reset passwords' }, 403);
    const own = data.members.find(m => String(m.id) === String(id));
    if (own) Object.assign(own, patch, { editedBy: staff.name, editedAt: stamp.at });
    else data.overrides[String(id)] = {
      ...(data.overrides[String(id)] || {}), ...patch, editedBy: staff.name, editedAt: stamp.at
    };
  } else if (action === 'publish') {
    for (const list of [data.trainings, data.issues, data.resources || []]) {
      const hit = list.find(x => x.id === id);
      if (hit) { hit.draft = false; hit.publishedBy = staff.name; hit.publishedAt = stamp.at; }
    }
  } else if (action === 'remove') {
    data.trainings = data.trainings.filter(x => x.id !== id);
    data.issues = data.issues.filter(x => x.id !== id);
    data.resources = (data.resources || []).filter(x => x.id !== id);
    data.members = data.members.filter(x => x.id !== id);
    data.hidden = Array.from(new Set((data.hidden || []).concat(id)));
    if (data.registrations) delete data.registrations[id];
  } else if (action === 'setClosed') {
    data.closed = { ...(data.closed || {}) };
    if (body.on) data.closed[body.trainingId] = { by: staff.name, at: stamp.at }; else delete data.closed[body.trainingId];
  } else if (action === 'setCompleted') {
    data.completed = { ...(data.completed || {}) };
    data.closed = { ...(data.closed || {}) };
    if (body.on) { data.completed[body.trainingId] = { by: staff.name, at: stamp.at }; data.closed[body.trainingId] = { by: staff.name, at: stamp.at }; }
    else { delete data.completed[body.trainingId]; delete data.closed[body.trainingId]; }
  } else if (action === 'setOverbook') {
    data.overbook = { ...(data.overbook || {}) };
    if (body.on) data.overbook[body.trainingId] = { by: staff.name, at: stamp.at }; else delete data.overbook[body.trainingId];
  } else if (action === 'setAttended') {
    const list = (data.registrations || {})[body.trainingId] || [];
    const entry = list.find(x => String(x.id) === String(body.memberId));
    if (!entry) return json({ error: 'Sign-up not found' }, 404);
    entry.attended = { ...(entry.attended || {}) };
    if (body.on) entry.attended[String(body.name)] = { by: staff.name, at: stamp.at }; else delete entry.attended[String(body.name)];
  } else if (action === 'resolveRequest') {
    if (!STAFF_ADMINS.includes(staff.login)) return json({ error: 'Only admins can approve changes' }, 403);
    const q = (data.changeRequests || []).find(x => x.id === body.reqId && x.status === 'open');
    if (!q) return json({ error: 'Request not found' }, 404);
    if (body.apply) {
      const list = (data.registrations || {})[q.trainingId] || [];
      const entry = list.find(x => String(x.id) === String(q.memberId));
      if (!entry) return json({ error: 'Sign-up not found' }, 404);
      entry.attendees = q.to.slice(); entry.seats = q.to.length;
      if (entry.attended) entry.attended = Object.fromEntries(Object.entries(entry.attended).filter(([n]) => q.to.includes(n))); entry.editedBy = staff.name; entry.editedAt = stamp.at;
    }
    q.status = body.apply ? 'approved' : 'declined'; q.resolvedBy = staff.name; q.resolvedAt = stamp.at;
  } else if (action === 'addAttendee') {
    const ov = data.overrides || {};
    const pool = [...(data.members || []), ...ROSTER, ...PROSPECTS.map(p => ({ nonMember: true, ...p }))];
    const add = (Array.isArray(body.names) ? body.names : []).map(n => String(n).trim()).filter(Boolean).slice(0, 20);
    if (!body.trainingId) return json({ error: 'Missing training' }, 400);
    let me;
    if (body.guest) {
      if (!add.length) return json({ error: 'Enter a name' }, 400);
      const g = body.guest || {};
      me = { id: 'G' + Date.now().toString(36).toUpperCase(), name: add[0], program: String(g.program || '').slice(0, 120), email: String(g.email || '').slice(0, 120), phone: String(g.phone || '').slice(0, 40), nonMember: true, guest: true };
    } else return json({ error: 'Facilities sign up their own staff. Staff can only add guests with no app account.' }, 403);
    if (!add.length) add.push(me.name);
    const regs = data.registrations || {};
    const list = regs[body.trainingId] || [];
    const entry = list.find(x => String(x.id) === String(me.id));
    if (entry) {
      const names = (entry.attendees && entry.attendees.length ? entry.attendees : [entry.name]).slice();
      add.forEach(n => { if (!names.some(x => x.toLowerCase() === n.toLowerCase())) names.push(n); });
      entry.attendees = names; entry.seats = names.length; entry.editedBy = staff.name; entry.editedAt = stamp.at;
    } else list.push({
      attendees: add, seats: add.length,
      id: me.id, name: me.name, program: me.program || '', email: me.email || '', phone: me.phone || '', nonMember: !!me.nonMember,
      status: me.guest ? 'guest' : me.nonMember ? 'non-member' : 'member', guest: !!me.guest, title: body.trainingTitle || '', at: stamp.at, addedBy: staff.name
    });
    regs[body.trainingId] = list;
    data.registrations = regs;
  } else if (action === 'removeAttendee') {
    const regs = data.registrations || {};
    const list = regs[body.trainingId] || [];
    const entry = list.find(x => String(x.id) === String(body.memberId));
    if (!entry) return json({ error: 'Sign-up not found' }, 404);
    const names = (entry.attendees && entry.attendees.length ? entry.attendees : [entry.name]).slice();
    if (!body.all) names.splice(Number(body.index), 1);
    if (body.all || !names.length) regs[body.trainingId] = list.filter(x => x !== entry);
    else { entry.attendees = names; entry.seats = names.length; entry.editedBy = staff.name; entry.editedAt = stamp.at; }
    data.registrations = regs;
  } else return json({ error: 'Unknown action' }, 400);

  data.updated = stamp.at;
  await store.setJSON(KEY, data);
  return json({ ok: true, updated: data.updated, by: staff.name });
};
