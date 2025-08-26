// Minimal Express server to serve static files and provide Gmail email endpoints
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers (CSP centralized)
const csp = [
  "default-src 'self' data:",
  "script-src 'self' https://www.gstatic.com https://www.gstatic.com/firebasejs/ https://apis.google.com 'unsafe-inline'",
  "connect-src 'self' https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com https://www.gstatic.com https://apis.google.com https://www.google.com",
  "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.googleusercontent.com https://*.gstatic.com https://firebasestorage.googleapis.com https://www.google.com https://images.unsplash.com",
  "frame-src 'self' https://accounts.google.com https://apis.google.com https://my-rhyme-app.firebaseapp.com"
].join('; ');

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Basic rate limits
const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// In-memory email logs (last 200)
const emailLogs = [];
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name ? (name[0] + '***') : '***';
  return `${maskedName}@${domain}`;
}
function logEmail(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    type: event.type || 'unknown',
    status: event.status || 'unknown',
    to: maskEmail(event.to || ''),
    subject: event.subject || '',
    messageId: event.messageId || '',
    error: event.error ? String(event.error).slice(0, 200) : undefined,
  };
  emailLogs.push(entry);
  if (emailLogs.length > 200) emailLogs.shift();
}

// Email transporter (Gmail)
// Requires env: GMAIL_USER, GMAIL_APP_PASSWORD
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn('[email] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars; email disabled');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  return transporter;
}

// API: send application decision email
app.post('/api/email/applications', emailLimiter, async (req, res) => {
  try {
    const { to, status, title, author } = req.body || {};
    if (!to || !status) return res.status(400).json({ error: 'to and status required' });

    const transport = getTransporter();
    if (!transport) return res.status(503).json({ error: 'email not configured' });

    const subject = status === 'approved'
      ? `Your application has been approved — Noctua Forest`
      : `Your application decision — Noctua Forest`;

    const lines = [];
    lines.push(`Hello,`);
    if (status === 'approved') {
      lines.push(`Great news — your application has been approved.`);
    } else if (status === 'rejected') {
      lines.push(`Thank you for your application. After review, we aren’t able to move forward at this time.`);
    } else {
      lines.push(`Your application status: ${status}`);
    }
    if (title || author) {
      lines.push('');
      lines.push(`Submission: ${title || 'Untitled'}${author ? ` — ${author}` : ''}`);
    }
    lines.push('');
    lines.push('— Noctua Forest');

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#222">
        <p>Hello,</p>
        <p>${status === 'approved' ? 'Great news — your application has been approved.' : (status === 'rejected' ? 'Thank you for your application. After review, we aren’t able to move forward at this time.' : `Your application status: ${status}`)}</p>
        ${(title || author) ? `<p>Submission: <strong>${title || 'Untitled'}</strong>${author ? ` — ${author}` : ''}</p>` : ''}
        <p style="margin-top:24px">— Noctua Forest</p>
      </div>`;

    const result = await transport.sendMail({
      from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
      to,
      subject,
      text: lines.join('\n'),
      html
    });
    logEmail({ type: 'applications', status: 'sent', to, subject, messageId: result.messageId });
    res.json({ ok: true, id: result.messageId });
  } catch (err) {
    console.error('[email applications] failed', err);
    try { logEmail({ type: 'applications', status: 'error', to: (req.body||{}).to, subject: 'applications', error: err.message }); } catch (_) {}
    res.status(500).json({ error: 'failed to send' });
  }
});

// API: contact us
app.post('/api/email/contact', emailLimiter, async (req, res) => {
  try {
    const { fromEmail, subject, message, userId, honeypot, startedAtMs } = req.body || {};
    if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });

    // Honeypot and time-based check
    const now = Date.now();
    if (honeypot) return res.status(400).json({ error: 'spam detected' });
    if (startedAtMs && (now - Number(startedAtMs) < 1500)) return res.status(400).json({ error: 'too fast' });

    const transport = getTransporter();
    if (!transport) return res.status(503).json({ error: 'email not configured' });

    const to = process.env.GMAIL_TO_ADMIN || process.env.GMAIL_USER;
    const text = [
      `New contact message from ${fromEmail || 'anonymous user'}`,
      userId ? `User ID: ${userId}` : '',
      '',
      message
    ].filter(Boolean).join('\n');

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#222">
        <p><strong>From:</strong> ${fromEmail || 'anonymous user'}</p>
        ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : ''}
        <hr style="margin:16px 0;border:none;border-top:1px solid #eee" />
        <pre style="white-space:pre-wrap">${String(message).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>
      </div>`;

    const result = await transport.sendMail({
      from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
      to,
      subject: `[Noctua Contact] ${subject}`,
      replyTo: fromEmail || undefined,
      text,
      html
    });
    logEmail({ type: 'contact', status: 'sent', to, subject: `[Noctua Contact] ${subject}`, messageId: result.messageId });
    res.json({ ok: true, id: result.messageId });
  } catch (err) {
    console.error('[email contact] failed', err);
    try { logEmail({ type: 'contact', status: 'error', to: (process.env.GMAIL_TO_ADMIN || process.env.GMAIL_USER), subject: 'contact', error: err.message }); } catch (_) {}
    res.status(500).json({ error: 'failed to send' });
  }
});

// API: auto-reply for submissions/applications
app.post('/api/email/auto-reply', emailLimiter, async (req, res) => {
  try {
    const { to, type, title, author } = req.body || {};
    if (!to || !type) return res.status(400).json({ error: 'to and type required' });

    const transport = getTransporter();
    if (!transport) return res.status(503).json({ error: 'email not configured' });

    const isBook = type === 'book';
    const subject = isBook
      ? 'Thanks for your submission — Noctua Forest'
      : 'Thanks for your application — Noctua Forest';

    const lines = [];
    lines.push('Hello,');
    if (isBook) {
      lines.push('Thanks for submitting your book to Noctua Forest. Our team will review your submission and follow up.');
    } else {
      lines.push('Thanks for applying to contribute to Noctua Forest. We’ll review your application and get back to you.');
    }
    if (title || author) {
      lines.push('');
      lines.push(`Submission: ${title || 'Untitled'}${author ? ` — ${author}` : ''}`);
    }
    lines.push('');
    lines.push('— Noctua Forest');

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#222">
        <p>Hello,</p>
        <p>${isBook
          ? 'Thanks for submitting your book to Noctua Forest. Our team will review your submission and follow up.'
          : 'Thanks for applying to contribute to Noctua Forest. We’ll review your application and get back to you.'}</p>
        ${(title || author) ? `<p>Submission: <strong>${title || 'Untitled'}</strong>${author ? ` — ${author}` : ''}</p>` : ''}
        <p style="margin-top:24px">— Noctua Forest</p>
      </div>`;

    const result = await transport.sendMail({
      from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
      to,
      subject,
      text: lines.join('\n'),
      html
    });
    logEmail({ type: 'auto-reply', status: 'sent', to, subject, messageId: result.messageId });
    res.json({ ok: true, id: result.messageId });
  } catch (err) {
    console.error('[email auto-reply] failed', err);
    try { logEmail({ type: 'auto-reply', status: 'error', to: (req.body||{}).to, subject: 'auto-reply', error: err.message }); } catch (_) {}
    res.status(500).json({ error: 'failed to send' });
  }
});

// Static files
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir, { extensions: ['html'] }));

// Admin: email logs (JSON)
app.get('/api/admin/email-logs', (req, res) => {
  try {
    res.json({ ok: true, logs: emailLogs.slice().reverse() });
  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
});

// SPA-like fallback to welcome.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'welcome.html'));
});

app.listen(PORT, () => {
  console.log(`Noctua Forest server running on port ${PORT}`);
});


