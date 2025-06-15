import { Router, Request, Response, RequestHandler } from 'express';
import express from 'express';
import { createCheckoutSession, handleStripeWebhook } from '../controllers/stripeController';

const router = Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), (async (req: Request, res: Response): Promise<void> => {
  try {
    // Implement webhook handling logic here
    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

export default router; 