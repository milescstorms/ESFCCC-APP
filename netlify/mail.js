import tls from 'node:tls';

const smtpSend = ({ host, port, user, pass, from, fromName, to, subject, text, replyTo, attachments }) => new Promise((resolve, reject) => {
  const sock = tls.connect({ host, port, servername: host });
  sock.setEncoding('utf8');
  sock.setTimeout(20000, () => { sock.destroy(); reject(new Error('timeout')); });
  let buf = '';
  const waiters = [];
  sock.on('data', (d) => {
    buf += d;
    let idx;
    while ((idx = buf.search(/^\d{3} .*\r?\n/m)) !== -1) {
      const lineEnd = buf.indexOf('\n', idx) + 1;
      const chunk = buf.slice(0, lineEnd); buf = buf.slice(lineEnd);
      const w = waiters.shift(); if (w) w(chunk);
    }
  });
  sock.on('error', reject);
  const next = () => new Promise(r => waiters.push(r));
  const cmd = async (line, ok) => {
    if (line !== null) sock.write(line + '\r\n');
    const res = await next();
    const code = parseInt(res.trim().split('\n').pop().slice(0, 3), 10);
    if (!ok.includes(code)) throw new Error('SMTP ' + code + ': ' + res.trim().slice(0, 200));
    return res;
  };
  const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
  const hdr = (s) => /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=';
  (async () => {
    await cmd(null, [220]);
    await cmd('EHLO council-app', [250]);
    await cmd('AUTH PLAIN ' + b64('\u0000' + user + '\u0000' + pass), [235]);
    await cmd('MAIL FROM:<' + from + '>', [250]);
    await cmd('RCPT TO:<' + to + '>', [250, 251]);
    await cmd('DATA', [354]);
    const body = String(text || '').replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    const msg = [
      'From: ' + hdr(fromName) + ' <' + from + '>',
      'To: <' + to + '>',
      replyTo ? 'Reply-To: <' + replyTo + '>' : null,
      'Subject: ' + hdr(subject || ''),
      'Date: ' + new Date().toUTCString(),
      'Message-ID: <' + Date.now() + '.' + Math.random().toString(36).slice(2) + '@council-app>',
      'MIME-Version: 1.0'
    ].filter(l => l !== null);
    const files = attachments || [];
    if (!files.length) msg.push('Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', body);
    else {
      const bnd = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      msg.push('Content-Type: multipart/mixed; boundary="' + bnd + '"', '',
        '--' + bnd, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', body);
      for (const f of files) msg.push('--' + bnd,
        'Content-Type: ' + f.mime + '; name="' + hdr(f.name) + '"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="' + hdr(f.name) + '"', '',
        String(f.data).replace(/(.{76})/g, '$1\r\n'));
      msg.push('--' + bnd + '--');
    }
    msg.push('.');
    await cmd(msg.join('\r\n'), [250]);
    sock.write('QUIT\r\n'); sock.end();
    resolve({ sent: true });
  })().catch((e) => { sock.destroy(); reject(e); });
});

const viaGmail = async ({ to, subject, text, replyTo, attachments }) => {
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return smtpSend({ host: 'smtp.gmail.com', port: 465, user: user.trim(), pass: String(pass).replace(/\s+/g, ''),
    from: user.trim(), fromName: process.env.MAIL_FROM_NAME || 'ESFCCC', to: to === 'SELF' ? user.trim() : to, subject, text, replyTo, attachments });
};

const viaAppsScript = async ({ to, subject, text, replyTo, attachments }) => {
  const url = process.env.APPS_SCRIPT_URL, key = process.env.APPS_SCRIPT_KEY;
  if (!url || !key) return null;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ key, to, subject, text, replyTo: replyTo || '', name: process.env.MAIL_FROM_NAME || 'ESFCCC', attachments: attachments || [] }),
    redirect: 'follow'
  });
  const out = await r.json().catch(() => ({}));
  return { sent: !!out.ok };
};

const viaGraph = async ({ to, subject, text, replyTo, attachments }) => {
  const tenant = process.env.MS_TENANT_ID, client = process.env.MS_CLIENT_ID;
  const secret = process.env.MS_CLIENT_SECRET, sender = process.env.MAIL_SENDER;
  if (!tenant || !client || !secret || !sender) return null;
  const tok = await fetch('https://login.microsoftonline.com/' + encodeURIComponent(tenant) + '/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: client, client_secret: secret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' })
  }).then(r => r.ok ? r.json() : null);
  if (!tok || !tok.access_token) return { sent: false, reason: 'auth' };
  const r = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(sender) + '/sendMail', {
    method: 'POST',
    headers: { 'authorization': 'Bearer ' + tok.access_token, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: text },
        toRecipients: [{ emailAddress: { address: to === 'SELF' ? sender : to } }],
        ...(attachments && attachments.length ? { attachments: attachments.map(f => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: f.name, contentType: f.mime, contentBytes: f.data })) } : {}),
        ...(replyTo ? { replyTo: [{ emailAddress: { address: replyTo } }] } : {})
      },
      saveToSentItems: true
    })
  });
  return { sent: r.status === 202 };
};

const viaResend = async ({ to, subject, text, replyTo, attachments }) => {
  const key = process.env.RESEND_API_KEY, from = process.env.FROM_EMAIL;
  if (!key || !from || to === 'SELF') return null;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments && attachments.length ? { attachments: attachments.map(f => ({ filename: f.name, content: f.data })) } : {}) })
  });
  return { sent: r.ok };
};

export const backupTo = () => process.env.CERT_BACKUP_EMAIL || 'SELF';

export const sendMail = async (msg) => {
  if (!msg.to) return { sent: false, reason: 'no recipient' };
  for (const way of [viaAppsScript, viaGmail, viaGraph, viaResend]) {
    try {
      const res = await way(msg);
      if (res) return res;
    } catch (e) {
      console.log('mail error', e && e.message);
      return { sent: false, reason: 'error' };
    }
  }
  return { sent: false, reason: 'not configured' };
};
