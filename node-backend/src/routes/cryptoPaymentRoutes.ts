import express from 'express';
import { RequestHandler } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createCryptoPayment,
  confirmCryptoPayment,
  getCryptoPayment,
  getCryptoPaymentHistory,
  getSupportedCurrencies,
  getCryptoPrices
} from '../controllers/cryptoPaymentController';

const router = express.Router();

// All crypto payment routes require authentication
// Auth middleware applied per route

// Get supported cryptocurrencies
router.get('/currencies', getSupportedCurrencies as any);

// Get current cryptocurrency prices
router.get('/prices', getCryptoPrices as any);

// Create a new crypto payment
router.post('/create', createCryptoPayment as any);

// Confirm a crypto payment with transaction hash
router.post('/confirm', confirmCryptoPayment as any);

// Get specific crypto payment
router.get('/:paymentId', getCryptoPayment as any);

// Get user's crypto payment history
router.get('/history/all', getCryptoPaymentHistory as any);

export default router; 