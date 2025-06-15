import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import logger from '../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount) {
      res.status(400).json({ error: 'Amount is required' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json({ error: 'Payment intent ID is required' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    res.json({ status: paymentIntent.status });
  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 