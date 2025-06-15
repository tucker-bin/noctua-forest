import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Local module imports
import logger from './src/config/logger.ts';
import { generalLimiter } from './src/middleware/rateLimiter.ts';
import observeRoutes from './src/routes/observeRoutes.ts';
import adminRoutes from './src/routes/adminRoutes.ts';
import metricsRoutes from './src/routes/metricsRoutes.ts';
import stripeRoutes from './src/routes/stripeRoutes.ts';
import userRoutes from './src/routes/userRoutes.ts';

const app = express();

// --- Core Middleware ---
app.use(cors({
  origin: true, 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
// Stripe webhook requires raw body, so we need to add this before express.json()
app.use('/api/stripe/webhook', express.raw({type: 'application/json'}));
app.use(express.json());
app.use(generalLimiter);

// --- Route Definitions ---
app.use('/api', observeRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);
app.use(metricsRoutes);

// --- Centralized Error Handling (Placeholder) ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
   logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
   });
   res.status(500).send('Something broke!');
});


// --- Server Initialization ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// For testing purposes, if needed
export default app;