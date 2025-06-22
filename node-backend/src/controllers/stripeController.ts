import { Request, Response } from 'express';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

// Lazy initialization of Stripe to avoid crashes when key is not set
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripe;
}

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  try {
    const stripeClient = getStripe();
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Rhyme Analysis',
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });
    
    res.json({ id: session.id });
  } catch (error) {
    logger.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    const stripeClient = getStripe();
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error(`Webhook signature verification failed.`, (err as Error).message);
    res.sendStatus(400);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      logger.info('Payment was successful for session:', session.id);
      // Fulfill the purchase...
      break;
    default:
      logger.warn(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}