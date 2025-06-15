import { Router } from 'express';
import { createPaymentIntent, confirmPayment } from '../controllers/paymentController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Create payment intent for token purchase
router.post('/create-payment-intent', authenticateUser, createPaymentIntent);

// Confirm payment and update user tokens
router.post('/confirm-payment', authenticateUser, confirmPayment);

export default router; 