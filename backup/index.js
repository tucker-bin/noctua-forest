const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const promClient = require('prom-client');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const admin = require('firebase-admin');
const crypto = require('crypto');
const winston = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();
const Stripe = require('stripe');

const app = express();
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json());

// Rate limiting (similar to Flask-Limiter)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for analysis
  message: 'You are sending requests too quickly. Please wait and try again.'
});

app.use('/api/', limiter);
app.use('/api/analyze', apiLimiter);

// In-memory cache (similar to MemoryEfficientCache)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120, maxKeys: 1000 });

// Prometheus metrics (mirroring Flask)
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

const requestCount = new promClient.Counter({
  name: 'rhyme_analysis_requests_total',
  help: 'Total number of rhyme analysis requests',
  labelNames: ['method', 'endpoint', 'status'],
});

const requestLatency = new promClient.Histogram({
  name: 'rhyme_analysis_request_latency_seconds',
  help: 'Request latency in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const analysisCharacters = new promClient.Histogram({
  name: 'rhyme_analysis_characters',
  help: 'Number of characters analyzed',
  buckets: [100, 500, 1000, 2000, 5000, 10000]
});

const cacheHits = new promClient.Counter({
  name: 'rhyme_analysis_cache_hits_total',
  help: 'Total number of cache hits'
});

const cacheMisses = new promClient.Counter({
  name: 'rhyme_analysis_cache_misses_total',
  help: 'Total number of cache misses'
});

const patternCounts = new promClient.Counter({
  name: 'rhyme_analysis_patterns_total',
  help: 'Number of patterns found by type',
  labelNames: ['pattern_type']
});

const segmentCounts = new promClient.Counter({
  name: 'rhyme_analysis_segments_total',
  help: 'Number of segments found by type',
  labelNames: ['segment_type']
});

const avgPatternLength = new promClient.Gauge({
  name: 'rhyme_analysis_avg_pattern_length',
  help: 'Average length of patterns found'
});

const patternDistribution = new promClient.Histogram({
  name: 'rhyme_analysis_pattern_distribution',
  help: 'Distribution of pattern lengths',
  buckets: [10, 20, 50, 100, 200, 500]
});

// Performance monitoring (mirrors Flask's PerformanceMonitor)
class PerformanceMonitor {
  constructor(maxSamples = 1000) {
    this.responseTimes = [];
    this.patternCounts = [];
    this.segmentCounts = [];
    this.maxSamples = maxSamples;
  }

  recordResponseTime(timeMs) {
    this.responseTimes.push(timeMs);
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
  }

  recordPatternCount(count) {
    this.patternCounts.push(count);
    if (this.patternCounts.length > this.maxSamples) {
      this.patternCounts.shift();
    }
  }

  recordSegmentCount(count) {
    this.segmentCounts.push(count);
    if (this.segmentCounts.length > this.maxSamples) {
      this.segmentCounts.shift();
    }
  }

  getStats() {
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      avg_response_time: avg(this.responseTimes),
      avg_patterns: avg(this.patternCounts),
      avg_segments: avg(this.segmentCounts)
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

// Middleware to monitor requests
function monitorRequest(req, res, next) {
  const startTime = Date.now();
  
  // Capture the original end method
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const status = res.statusCode;
    
    requestCount.labels(req.method, req.route?.path || req.path, status).inc();
    requestLatency.labels(req.method, req.route?.path || req.path).observe(duration);
    
    // Call the original end method
    originalEnd.apply(res, args);
  };
  
  next();
}

app.use(monitorRequest);

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    console.log('Firebase Admin SDK initialized with service account');
  } else {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized with default credentials');
  }
} catch (e) {
  console.error('Error initializing Firebase Admin SDK:', e);
}
const db = admin.firestore();

// Helper to check if a user is admin
async function isFirebaseAdminUser(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data().admin) {
      return true;
    }
  } catch (e) {
    console.error('Auth error:', e);
  }
  return false;
}

// Middleware to check for Bearer token and admin status (for /metrics)
async function requireAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Missing or invalid token.' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  if (!(await isFirebaseAdminUser(idToken))) {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
  }
  req.adminToken = idToken;
  next();
}

// Winston logger setup (mirrors Flask's rotating JSON logs)
const transport = new winston.transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  dirname: path.join(__dirname, 'logs'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.json()
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    transport,
    new winston.transports.Console({ 
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log environment variables (masking sensitive values)
function maskEnvValue(key, value) {
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
    return value ? value.slice(0, 4) + '***' : '';
  }
  return value;
}

logger.info('--- ENVIRONMENT VARIABLES ---');
Object.entries(process.env).forEach(([k, v]) => {
  logger.info({ [k]: maskEnvValue(k, v) });
});
logger.info('-----------------------------');

// Performance stats logging interval
setInterval(() => {
  const stats = performanceMonitor.getStats();
  logger.info({ 
    event: 'performance_stats', 
    ...stats
  });
}, 60000); // Log every 60 seconds

// Prometheus metrics endpoint (admin protected)
app.get('/metrics', requireAdminToken, async (req, res) => {
  logger.info({ event: 'metrics_access', adminUid: req.adminToken });
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Landing page (mirrors Flask landing page)
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
        <title>Welcome to My Rhyme App</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; color: #222; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 60px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); padding: 40px 32px; }
            h1 { color: #3f51b5; margin-bottom: 0.5em; }
            p { font-size: 1.15em; line-height: 1.6; }
            .features { margin: 2em 0; }
            .feature { margin-bottom: 1em; }
            .cta { margin-top: 2em; }
            .cta a { background: #3f51b5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1.1em; transition: background 0.2s; }
            .cta a:hover { background: #283593; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to My Rhyme App</h1>
            <p><b>My Rhyme App</b> is your modern, AI-powered tool for rhyme and lyric analysis. Instantly analyze your lyrics, poems, or rap bars with advanced language models and get deep insights into rhyme schemes, patterns, and more.</p>
            <div class="features">
                <div class="feature">🎤 <b>AI-Powered Analysis:</b> Get instant feedback and suggestions for your lyrics.</div>
                <div class="feature">🔒 <b>Secure & Private:</b> Sign in with Google or email using Firebase Authentication. Your data is protected.</div>
                <div class="feature">📊 <b>Usage Dashboard:</b> Track your analysis history and usage.</div>
                <div class="feature">🌍 <b>International Friendly:</b> Works with lyrics and poetry in many languages.</div>
            </div>
            <div class="cta">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Try the Rhyme Analyzer</a>
            </div>
            <p style="margin-top:2em;font-size:0.95em;color:#888;">&copy; 2024 My Rhyme App &mdash; Powered by Firebase & Anthropic</p>
        </div>
    </body>
    </html>
  `);
});

// Input validation (mirrors Flask validate_text_input)
function validateTextInput(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid input: text must not be empty');
  }
  if (trimmed.length > 10000) {
    throw new Error('Text too long: maximum 10000 characters');
  }
  return trimmed;
}

// Cache key generation (mirrors Flask generate_cache_key)
function generateCacheKey(text, rhymeScheme) {
  return crypto.createHash('md5').update(`${text}:${rhymeScheme}`).digest('hex');
}

// Claude API response formatting
function formatClaudeResponse(content) {
  // This function attempts to parse Claude's response and format it
  // to match the expected frontend format
  
  // If content is already an array of patterns, return it
  if (Array.isArray(content)) {
    return content;
  }
  
  // If it's a string that looks like JSON, try to parse it
  if (typeof content === 'string' && content.trim().startsWith('[')) {
    try {
      return JSON.parse(content);
    } catch (e) {
      // Fall through to mock response
    }
  }
  
  // Return a mock structured response for now
  // In production, you would parse Claude's actual response
  return [
    {
      phonetic_link_id: "rhyme_group_1",
      pattern_description: "End rhyme with 'ay' sound",
      segments: [
        { globalStartIndex: 10, globalEndIndex: 13, text: "day" },
        { globalStartIndex: 25, globalEndIndex: 28, text: "way" },
        { globalStartIndex: 40, globalEndIndex: 43, text: "say" }
      ]
    },
    {
      phonetic_link_id: "rhyme_group_2",
      pattern_description: "Internal rhyme with 'ight' sound",
      segments: [
        { globalStartIndex: 50, globalEndIndex: 55, text: "night" },
        { globalStartIndex: 70, globalEndIndex: 75, text: "light" }
      ]
    }
  ];
}

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text, rhyme_scheme } = req.body;
    
    if (!text) {
      logger.warn({ event: 'api_analyze_error', error: 'Missing text parameter' });
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const textToAnalyze = validateTextInput(text);
    const rhymeSchemeKey = rhyme_scheme || 'phonetic_architecture';

    // Record character count metric
    analysisCharacters.observe(textToAnalyze.length);

    // Generate cache key
    const cacheKey = generateCacheKey(textToAnalyze, rhymeSchemeKey);
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      cacheHits.inc();
      logger.info({ event: 'cache_hit', cacheKey });
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordResponseTime(responseTime);
      return res.json(cached);
    }
    
    cacheMisses.inc();
    logger.info({ event: 'cache_miss', cacheKey });

    let result;
    
    // Check if Anthropic API key is configured
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      // Call Anthropic Claude
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        temperature: 0.7,
        system: "You are a helpful assistant that analyzes text for rhyme patterns and schemes. Return your analysis as a JSON array of pattern objects, each with phonetic_link_id, pattern_description, and segments array.",
        messages: [
          {
            role: "user",
            content: `Analyze this text for rhyme patterns and schemes: ${textToAnalyze}`
          }
        ]
      });

      // Format the response
      result = formatClaudeResponse(response.content[0].text);
    } else {
      // Use mock analysis for development/demo
      logger.info({ event: 'using_mock_analysis', reason: 'Anthropic API key not configured' });
      
      // Simple mock analysis - find basic rhyming patterns
      const words = textToAnalyze.toLowerCase().split(/\s+/);
      const patterns = [];
      const endingGroups = {};
      
      // Group words by endings
      words.forEach((word, index) => {
        if (word.length > 2) {
          const ending = word.slice(-2);
          if (!endingGroups[ending]) {
            endingGroups[ending] = [];
          }
          const startIndex = textToAnalyze.indexOf(word, index > 0 ? endingGroups[ending].slice(-1)[0]?.globalEndIndex || 0 : 0);
          endingGroups[ending].push({
            text: word,
            globalStartIndex: startIndex,
            globalEndIndex: startIndex + word.length
          });
        }
      });
      
      // Create patterns from groups with multiple words
      let patternId = 1;
      Object.entries(endingGroups).forEach(([ending, segments]) => {
        if (segments.length > 1) {
          patterns.push({
            phonetic_link_id: `rhyme_group_${patternId}`,
            pattern_description: `Words ending with '${ending}'`,
            segments: segments
          });
          patternId++;
        }
      });
      
      // Add some variety to the mock data
      if (patterns.length === 0) {
        patterns.push({
          phonetic_link_id: "demo_pattern_1",
          pattern_description: "Sample rhyme pattern (demo mode)",
          segments: [
            { globalStartIndex: 0, globalEndIndex: Math.min(10, textToAnalyze.length), text: textToAnalyze.slice(0, 10) }
          ]
        });
      }
      
      result = patterns;
    }
    
    // Record metrics
    const patternCount = result.length;
    const segmentCount = result.reduce((acc, pattern) => acc + pattern.segments.length, 0);
    
    performanceMonitor.recordPatternCount(patternCount);
    performanceMonitor.recordSegmentCount(segmentCount);
    
    patternCounts.labels('total').inc(patternCount);
    segmentCounts.labels('total').inc(segmentCount);
    
    // Calculate average pattern length
    const avgLength = segmentCount > 0 ? 
      result.reduce((acc, pattern) => 
        acc + pattern.segments.reduce((segAcc, seg) => 
          segAcc + (seg.globalEndIndex - seg.globalStartIndex), 0), 0) / segmentCount : 0;
    
    avgPatternLength.set(avgLength);
    patternDistribution.observe(avgLength);

    // Cache the result
    cache.set(cacheKey, result);
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordResponseTime(responseTime);
    
    logger.info({ 
      event: 'api_analyze_success', 
      responseTime,
      patternCount,
      segmentCount,
      textLength: textToAnalyze.length
    });

    res.json(result);
  } catch (err) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordResponseTime(responseTime);
    
    if (err.message && err.message.includes('Invalid input')) {
      logger.warn({ event: 'api_analyze_validation_error', error: err.message });
      return res.status(400).json({ error: err.message });
    }
    
    if (err.message && err.message.includes('rate limit')) {
      logger.warn({ event: 'api_analyze_rate_limit', error: err.message });
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    
    logger.error({ event: 'api_analyze_error', error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/feedback
app.post('/api/feedback', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { type, comment, userId, email } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Feedback comment cannot be empty' });
    }
    
    // Verify auth token if provided
    let verifiedUserId = 'anonymous';
    let verifiedEmail = 'anonymous';
    
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        verifiedUserId = decodedToken.uid;
        verifiedEmail = decodedToken.email || 'anonymous';
      } catch (e) {
        logger.warn({ event: 'feedback_auth_error', error: e.message });
      }
    }
    
    // Save feedback to Firestore
    const feedbackData = {
      type: type || 'general',
      comment: comment.trim(),
      userId: verifiedUserId,
      email: verifiedEmail,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString(),
    };
    
    const feedbackRef = await db.collection('feedback').add(feedbackData);
    
    logger.info({ 
      event: 'feedback_submitted', 
      feedbackId: feedbackRef.id,
      type: feedbackData.type,
      userId: verifiedUserId
    });
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedbackId: feedbackRef.id 
    });
  } catch (err) {
    logger.error({ event: 'feedback_error', error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/feedback (admin only)
app.get('/api/feedback', requireAdminToken, async (req, res) => {
  try {
    const feedbackSnapshot = await db.collection('feedback')
      .orderBy('submittedAt', 'desc')
      .limit(100)
      .get();
    
    const feedback = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(feedback);
  } catch (err) {
    logger.error({ event: 'feedback_fetch_error', error: err.message });
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/newsletter/status
app.get('/api/newsletter/status', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const subscribed = userData.newsletterSubscription?.subscribed || false;

    res.json({ subscribed });
  } catch (err) {
    logger.error({ event: 'newsletter_status_error', error: err.message });
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// POST /api/newsletter/subscribe
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subscribed } = req.body;
    if (typeof subscribed !== 'boolean') {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Update user's newsletter subscription
    await db.collection('users').doc(uid).set({
      newsletterSubscription: {
        subscribed,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      email: decodedToken.email,
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info({ 
      event: 'newsletter_subscription_updated', 
      uid, 
      subscribed 
    });

    res.json({ 
      success: true, 
      subscribed,
      message: subscribed ? 'Subscribed to newsletter' : 'Unsubscribed from newsletter'
    });
  } catch (err) {
    logger.error({ event: 'newsletter_subscribe_error', error: err.message });
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Serve static files from the React app build
const buildPath = path.join(__dirname, '../my-rhyme-app/dist');
app.use(express.static(buildPath));

// Catch-all: serve index.html for any non-API route (for React Router)
app.get(/^\/(?!api\/).*/, (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If no build exists, redirect to the API landing page
    res.redirect('/');
  }
});

// Error handlers
app.use((err, req, res, next) => {
  if (err.status === 400) {
    return res.status(400).json({ error: 'Bad Request', message: err.message });
  }
  if (err.status === 429) {
    return res.status(429).json({ error: 'Too Many Requests', message: err.message });
  }
  next(err);
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource was not found.' });
});

app.use((err, req, res, next) => {
  logger.error({ event: 'unhandled_error', error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});

// GET /api/admin/check
app.get('/api/admin/check', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const isAdmin = await isFirebaseAdminUser(idToken);
    
    res.json({ isAdmin });
  } catch (err) {
    logger.error({ event: 'admin_check_error', error: err.message });
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', requireAdminToken, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users')
      .limit(500)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(users);
  } catch (err) {
    logger.error({ event: 'admin_users_fetch_error', error: err.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/tokens
app.post('/api/admin/users/tokens', requireAdminToken, async (req, res) => {
  try {
    const { uid, tokenBalance } = req.body;
    
    if (!uid || typeof tokenBalance !== 'number') {
      return res.status(400).json({ error: 'Invalid request: uid and tokenBalance required' });
    }
    
    // Update user's token balance
    await db.collection('users').doc(uid).set({
      tokenBalance,
      lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp(),
      lastModified: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    logger.info({ 
      event: 'admin_tokens_updated', 
      adminUid: req.adminToken,
      targetUid: uid, 
      tokenBalance 
    });
    
    res.json({ 
      success: true, 
      message: 'Token balance updated',
      uid,
      tokenBalance
    });
  } catch (err) {
    logger.error({ event: 'admin_tokens_update_error', error: err.message });
    res.status(500).json({ error: 'Failed to update token balance' });
  }
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout session for token top-up
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId } = req.body;
    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${process.env.FRONTEND_URL}/top-up-tokens?success=1`,
      cancel_url: `${process.env.FRONTEND_URL}/top-up-tokens?canceled=1`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook endpoint
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const priceId = session.line_items && session.line_items[0] && session.line_items[0].price ? session.line_items[0].price : session.metadata.priceId;
    // Map priceId to token amount
    const priceToTokens = {
      'price_tokens_starter_100': 100,
      'price_tokens_booster_300': 300,
      'price_tokens_writers_750': 750,
      'price_tokens_bard_2000': 2000,
    };
    const tokens = priceToTokens[priceId] || 0;
    if (userId && tokens > 0) {
      try {
        const userDocRef = db.collection('users').doc(userId);
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userDocRef);
          const prev = userDoc.exists && userDoc.data().tokenBalance ? userDoc.data().tokenBalance : 0;
          t.set(userDocRef, { tokenBalance: prev + tokens, lastTokenUpdate: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
        console.log(`Credited ${tokens} tokens to user ${userId}`);
      } catch (err) {
        console.error('Failed to credit tokens:', err);
        return res.status(500).send('Failed to credit tokens');
      }
    }
  }
  res.status(200).send('Received');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info({ event: 'server_started', port: PORT });
  console.log(`Server running on port ${PORT}`);
});