import { db } from '../config/firebase';
import { logger } from '../utils/logger';

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class PaymentService {
  private paymentRef = db.collection('payments');

  async processPayment(request: PaymentRequest): Promise<Payment> {
    try {
      const payment: Omit<Payment, 'id'> = {
        userId: request.userId,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.paymentMethod,
        status: 'pending',
        createdAt: new Date()
      };

      // In a real implementation, this would integrate with a payment provider
      // For now, we'll simulate a successful payment
      const docRef = await this.paymentRef.add(payment);

      const completedPayment: Payment = { ...payment,
        status: 'completed',
        completedAt: new Date()
      , id: docRef.id };

      await docRef.update({
        status: completedPayment.status,
        completedAt: completedPayment.completedAt
      });

      return completedPayment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async getPaymentHistory(userId: string): Promise<Payment[]> {
    try {
      const snapshot = await this.paymentRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ ...doc.data()
      , id: doc.id })) as Payment[];
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string, userId: string): Promise<Payment | null> {
    try {
      const doc = await this.paymentRef.doc(paymentId).get();
      if (!doc.exists) return null;

      const payment = doc.data() as Payment;
      if (payment.userId !== userId) {
        throw new Error('Unauthorized access to payment');
      }

      return { ...payment
      , id: doc.id };
    } catch (error) {
      logger.error('Error getting payment:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export const processPayment = paymentService.processPayment.bind(paymentService); 