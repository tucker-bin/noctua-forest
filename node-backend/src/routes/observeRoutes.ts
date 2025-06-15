import express from 'express';
import { observe } from '../controllers/observeController';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/observe', apiLimiter, observe);

export default router; 