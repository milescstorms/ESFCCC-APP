import { getStore } from '@netlify/blobs';
import { ROSTER } from './roster.js';
import { sendMail } from './mail.js';

const letter = (m, stage, d) => {
  const first = String(m.name).trim().split(/\s+/)[0];
  const app = (process.env.URL || '');
  const when = stage === 'd0' ? (d === 0 ? 'ends today, ' + m.expires : 'ended on ' + m.expires)
    : 'ends on ' + m.expires + (d === 1 ? ', tomorrow' : ', in ' + d + ' days');
  const subject = stage === 'd0' ? 'Your ESFCCC membership year has ended'
    : stage === 'd7' ? 'One week left in your ESFCCC membership year'
    : 'Time to renew your ESFCCC membership';
  const text = [
    'Hi ' + first + ',', '',
    'Your Empire State Family Child Care Collaborative membership for ' + m.program + ' ' + when + '.', '',
    'Membership is free. To keep your child care software, benefits and coaching, your coach will help you renew your MOU.', '',
    'Call your coach at (845) 294-4012 ext. 230, or reply to this email.',
    app ? 'Your member app: ' + app : '', '',
    'Already renewed? Thank you. Your coach will update your membership within a business day, so you can ignore this email.', '',
    'Empire State Family Child Care Collaborative',
    'Child Care Council of Orange County'
  ].join('\n');
  return { subject, text };
};

export const runReminders = async ({ dry = false, manual = false } = {}) => {
  const store = getStore({ name: 'council-app', consistency: 'strong' });
  const data = (await store.get('live-content', { type: 'json' })) || {};
  if ((data.settings || {}).renewalEmails !== true && !(manual && dry)) return [];
  const ov = data.overrides || {};
  const all = [...(data.members || []), ...ROSTER.map(r => ({ ...r, ...(ov[String(r.id)] || {}) }))]
    .filter((r, i, a) => a.findIndex(x => String(x.id) === String(r.id)) === i)
    .filter(r => !r.nonMember && r.email);
  const log = data.reminderLog || {};
  const out = [];
  for (const m of all) {
    const d = daysLeft(m.expires), stage = stageFor(d);
    if (!stage) continue;
    const prev = log[m.id] || {};
    if (prev.expires === m.expires && (prev.stages || []).includes(stage)) continue;
    const { subject, text } = letter(m, stage, d);
    let sent = false;
    if (!dry) {
      const res = await sendMail({ to: m.email, replyTo: process.env.REMINDER_REPLY_TO || undefined, subject, text });
      sent = !!(res && res.sent);
      if (sent) log[m.id] = { expires: m.expires, stages: (prev.expires === m.expires ? prev.stages || [] : []).concat(stage), last: new Date().toISOString(), lastStage: stage };
    }
    out.push({ id: m.id, name: m.name, email: m.email, stage, days: d, sent });
  }
  if (!dry && out.some(x => x.sent)) {
    const fresh = (await store.get('live-content', { type: 'json' })) || {};
    fresh.reminderLog = { ...(fresh.reminderLog || {}), ...log };
    await store.setJSON('live-content', fresh);
  }
  return out;
};
