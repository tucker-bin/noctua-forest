import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import apiRouter from './routes/api';
import userRouter from './routes/userRoutes';
import lessonRouter from './routes/lessonRoutes';
import analysisRouter from './routes/analysisRoutes';
import puzzleRouter from './routes/puzzleRoutes';
import { errorHandler } from './middleware/errorHandler';
import './config/i18n';
import { i18nMiddleware } from './config/i18n';

// The application now assumes environment variables are set externally,
// both for local development and in production. There is no more .env file loading.

const app = express();
const port = process.env.PORT || 3001;
app.set('trust proxy', 1); // Trust Docker/Nginx proxy for correct IP handling

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
// app.use('/api/admin', adminRouter);
// app.use('/api/stripe', stripeRouter);
// app.use('/api/metrics', metricsRouter);
app.use('/api/lessons', lessonRouter); // Keep for now, may contain engine logic
app.use('/api/analysis', analysisRouter); // Keep for now, may contain engine logic
// app.use('/api/payment', paymentRouter);
// app.use('/api/batch', batchRouter);
// app.use('/api/privacy', privacyRouter);
app.use('/api/puzzles', puzzleRouter); // Use the new puzzle router

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