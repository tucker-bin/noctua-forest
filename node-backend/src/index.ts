import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import observeRouter from './routes/observeRoutes';
import stripeRouter from './routes/stripeRoutes';
import paymentRouter from './routes/paymentRoutes';
import metricsRouter from './routes/metricsRoutes';
import analysisRouter from './routes/analysisRoutes';
import adminRouter from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';
import './config/i18n';
import { i18nMiddleware } from './config/i18n';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(i18nMiddleware);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false, 
});
app.use(limiter);

// Routes
app.use('/api', observeRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/admin', adminRouter);
app.use('/metrics', metricsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Error handler middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server is listening on port ${port}`);
    });
}

export default app; 