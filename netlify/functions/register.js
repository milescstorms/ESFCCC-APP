import { getStore } from '@netlify/blobs';
import { ROSTER } from '../roster.js';
import { STAFF_LOGINS, STAFF_ADMINS } from '../staff.js';
import { sendMail } from '../mail.js';

const KEY = 'live-content';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { id, pw, action, trainingId, trainingTitle, trainer, trainingWhen, trainingWhere, attendees, note } = (await req.json().catch(() => ({}))) || {};
  if (!id || !pw) return json({ error: 'Missing credentials' }, 400);

  const store = getStore({ name: 'council-app', consistency: 'strong' });
  const data = (await store.get(KEY, { type: 'json' })) || {};
  const overrides = data.overrides || {};
  const all = [...(data.members || []), ...ROSTER.map(r => ({ ...r, ...(overrides[String(r.id)] || {}) }))];
  const me = all.find(r =>
    String(r.id).toUpperCase() === String(id).trim().toUpperCase() &&
    String(r.pw).toLowerCase() === String(pw).trim().toLowerCase());
  if (!me) return json({ error: 'Sign in again' }, 401);

  const regs = data.registrations || {};
  const mine = () => Object.keys(regs).filter(t => (regs[t] || []).some(x => String(x.id) === String(me.id)));

  const attending = () => Object.fromEntries(Object.entries(regs).map(([t, l]) => [t, ((l || []).find(x => String(x.id) === String(me.id)) || {}).attendees]).filter(([, a]) => a));
  const pending = () => (data.changeRequests || []).filter(q => q.status === 'open' && String(q.memberId) === String(me.id)).map(q => q.trainingId);
  const attended = () => Object.fromEntries(Object.entries(regs).map(([t, l]) => [t, ((l || []).find(x => String(x.id) === String(me.id)) || {}).attended]).filter(([, a]) => a));
  if (action === 'mine') return json({ ok: true, trainings: mine(), attending: attending(), attended: attended(), pending: pending() });
  if (action === 'requestChange') {
    const entry = ((data.registrations || {})[trainingId] || []).find(x => String(x.id) === String(me.id));
    if (!entry) return json({ error: 'Not registered' }, 404);
    const to = (Array.isArray(attendees) ? attendees : []).map(n => String(n || '').trim().slice(0, 80)).filter(Boolean).slice(0, 20);
    if (!to.length) return json({ error: 'Add at least one name' }, 400);
    const from = entry.attendees && entry.attendees.length ? entry.attendees : [entry.name];
    const q = { id: 'cr' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), trainingId, title: trainingTitle || entry.title || '',
      memberId: me.id, memberName: me.name, program: me.program || '', from, to, note: String(note || '').slice(0, 500), at: new Date().toISOString(), status: 'open' };
    data.changeRequests = (data.changeRequests || []).filter(x => !(x.status === 'open' && x.trainingId === trainingId && String(x.memberId) === String(me.id))).concat(q);
    await store.setJSON(KEY, data);
    const mailOn = (data.settings || {}).registrationEmails !== false;
    if (mailOn) {
      const admins = STAFF_LOGINS.filter(s => STAFF_ADMINS.includes(s.login) && s.email);
      await Promise.all(admins.map(a => sendMail({
        to: a.email, replyTo: me.email || undefined,
        subject: 'Attendee change request: ' + me.name + ', ' + (q.title || 'training'),
        text: [
          'Hi ' + a.name.split(' ')[0] + ',', '',
          me.name + (me.program ? ' (' + me.program + ')' : '') + ' asked to change who attended ' + (q.title || 'a training') + '.', '',
          'On file now: ' + from.join(', '),
          'Requested: ' + to.join(', '),
          q.note ? 'Note: ' + q.note : '', '',
          'Approve or decline it in the staff portal: Members, open ' + me.name + ', then Trainings.', '',
          'ESFCCC member app'
        ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n')
      }).catch(() => null)));
    }
    return json({ ok: true, pending: pending() });
  }
  if (!trainingId) return json({ error: 'Missing training' }, 400);

  const list = regs[trainingId] || [];
  const wasIn = list.some(x => String(x.id) === String(me.id));
  const allow = Number(me.seatsCovered) > 0 && !me.nonMember ? Number(me.seatsCovered) : (me.nonMember ? 1 : /\+1/.test(me.level || '') ? 2 : /center|school-age/i.test(me.level || '') ? 8 : 1) + (Number(me.extraSeats) || 0);
  const names = (Array.isArray(attendees) ? attendees : []).map(n => String(n || '').trim().slice(0, 80)).filter(Boolean).slice(0, allow);
  if (!names.length) names.push(me.name);
  const prevEntry = list.find(x => String(x.id) === String(me.id));
  const namesChanged = !!prevEntry && JSON.stringify(prevEntry.attendees || [prevEntry.name]) !== JSON.stringify(names);
  const lapsed = (() => { const t = Date.parse(String(me.expires) + ' 12:00:00'); return !isNaN(t) && t < Date.now(); })();
  if (action === 'register' && !wasIn && (data.closed || {})[trainingId]) return json({ error: 'Registration closed' }, 403);
  if ((data.completed || {})[trainingId] && action === 'register' && (!wasIn || namesChanged)) return json({ error: 'Training completed. Send a change request instead.' }, 403);
  if (action === 'register' && !wasIn && (me.nonMember || lapsed)) {
    const t = (data.trainings || []).find(x => x.id === trainingId);
    const opens = t && t.earlyDays && t.publishedAt ? Date.parse(t.publishedAt) + t.earlyDays * 86400000 : 0;
    if (opens > Date.now()) return json({ error: 'Members register first', opens }, 403);
    if (t && !t.full && me.nonMember) return json({ error: 'Members only' }, 403);
  }
  if (action === 'register') {
    if (prevEntry) { prevEntry.attendees = names; prevEntry.seats = names.length; }
    if (!wasIn) list.push({
      attendees: names, seats: names.length,
      id: me.id, name: me.name, program: me.program, email: me.email || '', phone: me.phone || '', nonMember: !!me.nonMember,
      status: me.nonMember ? 'non-member' : lapsed ? 'expired' : 'member',
      title: trainingTitle || '', at: new Date().toISOString()
    });
    regs[trainingId] = list;
  } else if (action === 'cancel') {
    regs[trainingId] = list.filter(x => String(x.id) !== String(me.id));
  } else return json({ error: 'Unknown action' }, 400);

  data.registrations = regs;
  await store.setJSON(KEY, data);

  const host = STAFF_LOGINS.find(s => s.name.toLowerCase() === String(trainer || '').trim().toLowerCase())
    || STAFF_LOGINS.find(s => s.login === 'miles') || STAFF_LOGINS[0];
  const changed = action === 'register' ? (!wasIn || namesChanged) : wasIn;
  const seatTotal = (regs[trainingId] || []).reduce((n, x) => n + (x.seats || 1), 0);
  const who = names.length > 1 ? 'Attending (' + names.length + '): ' + names.join(', ') : '';
  const mailOn = (data.settings || {}).registrationEmails !== false;
  let notified = false;
  if (mailOn && host && host.email && changed) {
    const n = seatTotal;
    const joined = action === 'register';
    const res = await sendMail({
      to: host.email,
      replyTo: me.email || undefined,
      subject: (joined ? 'New sign-up: ' : 'Cancelled: ') + me.name + ', ' + (trainingTitle || 'training'),
      text: [
        'Hi ' + host.name.split(' ')[0] + ',', '',
        me.name + (joined ? ' signed up for ' : ' cancelled their spot in ') + (trainingTitle || 'a training') + '.', '',
        'Program: ' + (me.program || 'not listed'),
        'Email: ' + (me.email || 'none on file'),
        'Phone: ' + (me.phone || 'none on file'),
        who,
        (me.nonMember ? 'Non-member ID: ' : 'Member ID: ') + me.id + (me.nonMember ? ' (pays the non-member rate)' : ''), '',
        n + (n === 1 ? ' person is' : ' people are') + ' signed up now. The full list is in the staff portal under Trainings.', '',
        'ESFCCC member app'
      ].join('\n')
    });
    notified = res.sent;
  }

  let confirmed = false;
  if (mailOn && me.email && changed) {
    const joined = action === 'register';
    const first = String(me.name).trim().split(/\s+/)[0];
    const res = await sendMail({
      to: me.email,
      replyTo: host && host.email ? host.email : undefined,
      subject: joined ? 'You are signed up: ' + (trainingTitle || 'ESFCCC event') : 'Your spot was released: ' + (trainingTitle || 'ESFCCC event'),
      text: (joined ? [
        'Hi ' + first + ',', '',
        'You are signed up for ' + (trainingTitle || 'an ESFCCC event') + '.', '',
        who,
        trainingWhen ? 'When: ' + trainingWhen : '',
        trainingWhere ? 'Where: ' + trainingWhere : '',
        host ? 'Trainer: ' + host.name : '', '',
        'Questions? Reply to this email and it goes straight to ' + (host ? host.name.split(' ')[0] : 'your coach') + '.',
        'Can no longer make it? Open the ESFCCC app, tap the event, and tap Registered to cancel so someone else can have the seat.', '',
        'Empire State Family Child Care Collaborative, Child Care Council of Orange County',
        '(845) 294-4012'
      ] : [
        'Hi ' + first + ',', '',
        'Your spot in ' + (trainingTitle || 'the training') + ' has been released. Thank you for letting us know.', '',
        'You can sign up for another date any time in the ESFCCC app.', '',
        'Empire State Family Child Care Collaborative, Child Care Council of Orange County',
        '(845) 294-4012'
      ]).filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n')
    });
    confirmed = res.sent;
  }

  return json({ ok: true, trainings: mine(), attending: attending(), count: seatTotal, notified, confirmed });
};
