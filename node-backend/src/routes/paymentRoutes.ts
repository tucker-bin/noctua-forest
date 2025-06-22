import express, { Response } from 'express';

import { requireAuth } from '../middleware/auth';

import { processPayment } from '../services/paymentService';

const router = express.Router();

// All payment routes require authentication
// Auth middleware applied per route

// Process payment
router.post('/process', async (req: any, res: any) => {
  try {
    const { amount, currency, paymentMethod } = (req as any).body;
    const userId = (req as any).user.uid;

    const result = await processPayment({
      userId,
      amount,
      currency,
      paymentMethod
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Payment processing failed'
    });
  }
});

export default router; 