import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'), // project root
  path.resolve(__dirname, '../.env'),    // node-backend parent
  path.resolve(__dirname, '.env'),       // node-backend/src
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`Environment loaded from: ${envPath}`);
    break;
  }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import apiRouter from './routes/api';
import userRouter from './routes/userRoutes';
import adminRouter from './routes/adminRoutes';
import stripeRouter from './routes/stripeRoutes';
import metricsRouter from './routes/metricsRoutes';
import lessonRouter from './routes/lessonRoutes';
import analysisRouter from './routes/analysisRoutes';
import paymentRouter from './routes/paymentRoutes';
import batchRouter from './routes/batchRoutes';
import privacyRouter from './routes/privacyRoutes';
import { errorHandler } from './middleware/errorHandler';
import './config/i18n';
import { i18nMiddleware } from './config/i18n';

const app = express();
app.set('trust proxy', 1); // Trust Docker/Nginx proxy for correct IP handling
const port = process.env.PORT || 3001;

// --- Core Middleware ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(i18nMiddleware);

// Stripe webhook must use express.raw BEFORE express.json
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// --- Rate Limiting ---
// If you have a generalLimiter or specific limiter, use it here
// import { generalLimiter } from './middleware/rateLimiter';
// app.use(generalLimiter);

// --- Route Definitions ---
app.use('/api', apiRouter);
app.use('/api', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/batch', batchRouter);
app.use('/api/privacy', privacyRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- Centralized Error Handling ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  res.status(500).send('Something broke!');
});
app.use(errorHandler);

// --- Server Initialization ---
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
  });
}

export default app; 