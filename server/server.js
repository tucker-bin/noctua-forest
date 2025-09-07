// Express server with optimized static file serving
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import NodeCache from 'node-cache';
import fs from 'fs';
import crypto from 'crypto';
import Stripe from 'stripe';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Cache configuration
const paCache = new NodeCache({ 
    stdTTL: 86400,  // 24h TTL
    checkperiod: 3600,  // Check every hour
    useClones: false  // Disable cloning for better performance
});

const app = express();
const PORT = process.env.PORT || 8080;

// Compression
app.use(compression());

// Security headers with CSP for Firebase
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://www.gstatic.com",
                "https://www.googletagmanager.com"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "https://firestore.googleapis.com",
                "https://www.googleapis.com",
                "https://securetoken.googleapis.com"
            ],
            frameSrc: ["'self'", "https://connect.stripe.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));

// Static file serving with caching
const staticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Cache static assets for 1 year
        if (path.endsWith('.js') || path.endsWith('.css') || path.match(/\.(jpg|jpeg|png|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        } else {
            // HTML files - no cache
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
};

// Serve built files from dist directory
app.use(express.static(path.join(__dirname, '../dist'), staticOptions));

// Stripe webhook requires raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Basic middleware
app.use(express.json({ limit: '1mb' }));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    app.use((req, res, next) => {
        if (req.secure || req.path === '/healthz') {
            next();
        } else {
            res.redirect('https://' + req.headers.host + req.url);
        }
    });
}

// Rate limiting
const emailLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
});

// Email configuration
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

// API Routes
app.post('/api/email/contact', emailLimiter, async (req, res) => {
    try {
        const { fromEmail, subject, message, userId } = req.body || {};
        if (!subject || !message) {
            return res.status(400).json({ error: 'subject and message required' });
        }

        const transport = getTransporter();
        if (!transport) {
            return res.status(503).json({ error: 'email not configured' });
        }

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

        res.json({ ok: true, id: result.messageId });
    } catch (err) {
        console.error('[email contact] failed', err);
        res.status(500).json({ error: 'failed to send' });
    }
});

// Health check endpoint
app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/welcome.html'));
});

// Start server
console.log('=== Noctua Forest Server Starting ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Port:', PORT);

// Verify directories
try {
    const distDir = path.join(__dirname, '../dist');
    console.log('Checking dist directory:', distDir);
    if (!fs.existsSync(distDir)) {
        throw new Error(`Dist directory ${distDir} does not exist`);
    }
    console.log('Dist directory exists');

    console.log('Checking welcome.html...');
    const welcomePath = path.join(distDir, 'welcome.html');
    if (!fs.existsSync(welcomePath)) {
        throw new Error(`${welcomePath} not found`);
    }
    console.log('welcome.html exists');

    console.log('Directory contents:');
    fs.readdirSync(distDir).forEach(file => {
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