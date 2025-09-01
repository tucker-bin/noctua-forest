// Minimal Express server to serve static files and provide Gmail email endpoints
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const NodeCache = require('node-cache');
const fs = require('fs');

// PA API cache (24h TTL, check every hour for expired items)
const paCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Sample books data for API (in production, this would come from Firestore)
const SAMPLE_BOOKS = [
  {
    id: "whispers-in-the-wind",
    title: "Whispers in the Wind",
    author: "Elena Rodriguez",
    blurb: "A haunting tale of love and loss set against the backdrop of the Spanish Civil War. Elena's grandmother's journal reveals secrets that span three generations.",
    tags: ["Historical Fiction", "Romance", "Spain"],
    language: "English",
    region: "Spain",
    rating: 4.7,
    publicationYear: 2023,
    coverUrl: "/images/book-covers/whispers-wind.jpg"
  },
  {
    id: "digital-nomad-chronicles",
    title: "Digital Nomad Chronicles",
    author: "Marcus Chen",
    blurb: "An honest account of building a successful remote business while traveling the world. Practical insights mixed with personal adventures from Silicon Valley to rural Vietnam.",
    tags: ["Memoir", "Business", "Travel"],
    language: "English",
    region: "Global",
    rating: 4.5,
    publicationYear: 2023,
    coverUrl: "/images/book-covers/digital-nomad.jpg"
  },
  {
    id: "midnight-calculations",
    title: "Midnight Calculations",
    author: "Dr. Sarah Kim",
    blurb: "A brilliant mathematician discovers a pattern in prime numbers that could revolutionize cryptography. But someone is willing to kill to keep it secret.",
    tags: ["Thriller", "Science", "Mystery"],
    language: "English",
    region: "South Korea",
    rating: 4.8,
    publicationYear: 2024,
    coverUrl: "/images/book-covers/midnight-calc.jpg"
  }
];

const app = express();
const PORT = process.env.PORT || 8080;

// Static files - serve before other middleware
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir, { extensions: ['html'] }));

// Basic middleware
app.use(express.json({ limit: '1mb' }));

// Apply Helmet middleware with relaxed CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
      fontSrc: ["'self'", "data:", "https:", "http:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Force HTTPS in production (except for health checks)
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    // Skip HTTPS redirect for health checks
    if (req.secure || req.path === '/healthz') {
      next();
    } else {
      res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

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
      lines.push(`Thank you for your application. After review, we aren't able to move forward at this time.`);
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
        <p>${status === 'approved'
          ? 'Great news — your application has been approved.'
          : (status === 'rejected'
              ? 'Thank you for your application. After review, we aren\'t able to move forward at this time.'
              : ('Your application status: ' + status))}
        </p>
        ${ (title || author)
            ? ('<p>Submission: <strong>' + (title || 'Untitled') + '</strong>' + (author ? ' — ' + author : '') + '</p>')
            : '' }
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
      lines.push('Thanks for applying to contribute to Noctua Forest. We\'ll review your application and get back to you.');
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
          : 'Thanks for applying to contribute to Noctua Forest. We\'ll review your application and get back to you.'}
        </p>
        ${ (title || author)
            ? ('<p>Submission: <strong>' + (title || 'Untitled') + '</strong>' + (author ? ' — ' + author : '') + '</p>')
            : '' }
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

// PA API endpoint with caching
app.get('/api/pa/items', async (req, res) => {
  const { asin } = req.query;
  if (!asin) {
    return res.status(400).json({ error: 'ASIN required' });
  }

  // Check cache first
  const cached = paCache.get(asin);
  if (cached) {
    return res.json(cached);
  }

  try {
    // TODO: Replace with actual PA API call
    // For now, return a placeholder that matches our schema
    const mockData = {
      asin,
      title: 'Book Title',
      author: 'Author Name',
      imageUrl: `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`,
      detailPageUrl: `https://www.amazon.com/dp/${asin}?tag=noctuaforest-20`
    };

    // Cache the result
    paCache.set(asin, mockData);
    res.json(mockData);
  } catch (error) {
    console.error('PA API error:', error);
    res.status(500).json({ error: 'Failed to fetch product data' });
  }
});

// Admin: email logs (JSON)
app.get('/api/admin/email-logs', (req, res) => {
  try {
    res.json({ ok: true, logs: emailLogs.slice().reverse() });
  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
});

// Lightweight affiliate click tracking (memory-only in production)
let affiliateEvents = [];
app.post('/api/track/affiliate', (req, res) => {
  try {
    const { t, r, bId, bTitle, bAuthor, vendor } = req.body || {};
    const entry = {
      ts: new Date().toISOString(),
      t: Number(t) || Date.now(),
      r: (r || '').toString().slice(0, 64),
      bId: (bId || '').toString().slice(0, 64),
      bTitle: (bTitle || '').toString().slice(0, 160),
      bAuthor: (bAuthor || '').toString().slice(0, 120),
      vendor: (vendor || 'unknown').toString().slice(0, 32),
      ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().slice(0, 64),
      ua: (req.headers['user-agent'] || '').toString().slice(0, 160)
    };
    affiliateEvents.push(entry);
    if (affiliateEvents.length > 5000) affiliateEvents.shift();
    res.json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: true }); // never block client
  }
});

// Admin: fetch recent affiliate events (simple JSON)
app.get('/api/admin/affiliate-events', (req, res) => {
  try {
    res.json({ ok: true, events: affiliateEvents.slice(-500).reverse() });
  } catch (err) {
    res.status(500).json({ error: 'failed' });
  }
});

// Public API: Books endpoints
app.get('/api/books', (req, res) => {
  try {
    // Add CORS headers for API access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Support query parameters for filtering
    const { language, region, author, tag, search, limit = 50 } = req.query;
    
    let filteredBooks = [...SAMPLE_BOOKS];
    
    // Apply filters
    if (language) {
      filteredBooks = filteredBooks.filter(book => 
        book.language?.toLowerCase().includes(language.toLowerCase())
      );
    }
    if (region) {
      filteredBooks = filteredBooks.filter(book => 
        book.region?.toLowerCase().includes(region.toLowerCase())
      );
    }
    if (author) {
      filteredBooks = filteredBooks.filter(book => 
        book.author?.toLowerCase().includes(author.toLowerCase())
      );
    }
    if (tag) {
      filteredBooks = filteredBooks.filter(book => 
        book.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower) ||
        book.blurb?.toLowerCase().includes(searchLower) ||
        book.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply limit
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 books per request
    filteredBooks = filteredBooks.slice(0, limitNum);
    
    res.json({
      success: true,
      count: filteredBooks.length,
      total: SAMPLE_BOOKS.length,
      books: filteredBooks
    });
  } catch (err) {
    console.error('API /books error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch books' 
    });
  }
});

app.get('/api/books/:id', (req, res) => {
  try {
    // Add CORS headers for API access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    const { id } = req.params;
    const book = SAMPLE_BOOKS.find(b => b.id === id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      book: book
    });
  } catch (err) {
    console.error('API /books/:id error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch book' 
    });
  }
});

// Test endpoints
app.get('/test', (req, res) => {
  res.json({ status: 'running', env: process.env.NODE_ENV });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// SPA-like fallback to welcome.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'welcome.html'));
});

// Log startup
console.log('=== Noctua Forest Server Starting ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Port:', PORT);
console.log('Public directory:', publicDir);

// Verify directories and files
try {
  console.log('Checking public directory...');
  if (!fs.existsSync(publicDir)) {
    throw new Error(`Public directory ${publicDir} does not exist`);
  }
  console.log('Public directory exists');

  console.log('Checking welcome.html...');
  const welcomePath = path.join(publicDir, 'welcome.html');
  if (!fs.existsSync(welcomePath)) {
    throw new Error(`${welcomePath} not found`);
  }
  console.log('welcome.html exists');

  // List directory contents for debugging
  console.log('Directory contents:');
  fs.readdirSync(publicDir).forEach(file => {
    console.log(`- ${file}`);
  });
} catch (err) {
  console.error('Startup check failed:', err);
  process.exit(1);
}

// Start server with error handling
console.log('Starting HTTP server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Server running on port ${PORT} ===`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});