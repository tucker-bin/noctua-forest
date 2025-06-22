import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';

import { cryptoPaymentService } from '../services/cryptoPaymentService';
import { logger } from '../utils/logger';

export const createCryptoPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, currency, planType } = req.body;
    const userId = req.user.uid;

    if (!amount || !currency || !planType) {
      res.status(400).json({ 
        error: 'Amount, currency, and plan type are required' 
      });
      return;
    }

    const supportedCurrencies = cryptoPaymentService.getSupportedCurrencies().map(c => c.code);
    if (!supportedCurrencies.includes(currency)) {
      res.status(400).json({ 
        error: `Unsupported currency. Supported currencies: ${supportedCurrencies.join(', ')}` 
      });
      return;
    }

    const payment = await cryptoPaymentService.createCryptoPayment({
      userId,
      amount,
      currency,
      planType
    });

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error creating crypto payment:', error);
    res.status(500).json({ 
      error: 'Failed to create crypto payment' 
    });
  }
};

export const confirmCryptoPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId, transactionHash } = req.body;
    const userId = req.user.uid;

    if (!paymentId || !transactionHash) {
      res.status(400).json({ 
        error: 'Payment ID and transaction hash are required' 
      });
      return;
    }

    // Verify payment belongs to user
    const existingPayment = await cryptoPaymentService.getCryptoPayment(paymentId, userId);
    if (!existingPayment) {
      res.status(404).json({ 
        error: 'Payment not found' 
      });
      return;
    }

    const confirmedPayment = await cryptoPaymentService.confirmCryptoPayment(paymentId, transactionHash);

    res.json({
      success: true,
      data: confirmedPayment
    });
  } catch (error) {
    logger.error('Error confirming crypto payment:', error);
    res.status(500).json({ 
      error: 'Failed to confirm crypto payment' 
    });
  }
};

export const getCryptoPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.uid;

    const payment = await cryptoPaymentService.getCryptoPayment(paymentId, userId);
    
    if (!payment) {
      res.status(404).json({ 
        error: 'Payment not found' 
      });
      return;
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error getting crypto payment:', error);
    res.status(500).json({ 
      error: 'Failed to get crypto payment' 
    });
  }
};

export const getCryptoPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.uid;
    const history = await cryptoPaymentService.getCryptoPaymentHistory(userId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting crypto payment history:', error);
    res.status(500).json({ 
      error: 'Failed to get payment history' 
    });
  }
};

export const getSupportedCurrencies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currencies = cryptoPaymentService.getSupportedCurrencies();
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    logger.error('Error getting supported currencies:', error);
    res.status(500).json({ 
      error: 'Failed to get supported currencies' 
    });
  }
};

export const getCryptoPrices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supportedCurrencies = cryptoPaymentService.getSupportedCurrencies().map(c => c.code);
    const prices = await cryptoPaymentService.getCryptoPrices(supportedCurrencies);

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    logger.error('Error getting crypto prices:', error);
    res.status(500).json({ 
      error: 'Failed to get crypto prices' 
    });
  }
}; 