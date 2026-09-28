import { runReminders } from '../reminders.js';

export default async () => {
  const out = await runReminders();
  console.log('renewal reminders', JSON.stringify(out.map(x => [x.id, x.stage, x.sent])));
  return new Response(JSON.stringify({ ok: true, count: out.length }), { headers: { 'content-type': 'application/json' } });
};

export const config = { schedule: '0 14 * * *' };
