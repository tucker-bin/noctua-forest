import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface CryptoPaymentRequest {
  userId: string;
  amount: number; // Amount in USD
  currency: 'BTC' | 'ETH' | 'LTC' | 'XRP' | 'ADA' | 'DOT' | 'MATIC';
  planType: 'enthusiast' | 'pro';
}

export interface CryptoPayment {
  id: string;
  userId: string;
  amountUSD: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  cryptoAddress: string;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  planType: string;
  exchangeRate: number;
  expiresAt: Date;
  createdAt: Date;
  confirmedAt?: Date;
  transactionHash?: string;
  confirmations?: number;
}

interface CryptoPriceData {
  [key: string]: {
    usd: number;
  };
}

class CryptoPaymentService {
  private paymentRef = db.collection('cryptoPayments');
  private readonly PAYMENT_EXPIRY_MINUTES = 30;
  
  // Crypto wallet addresses for receiving payments
  private readonly WALLET_ADDRESSES = {
    BTC: process.env.CRYPTO_BTC_ADDRESS || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    ETH: process.env.CRYPTO_ETH_ADDRESS || '0x742d35Cc7Eb259b4E503bf16CAf6D0a0f5b9F2b0',
    LTC: process.env.CRYPTO_LTC_ADDRESS || 'LTC7sF9A3KyGdBwv6Fw5s4oJW4KLMJ3AqN',
    XRP: process.env.CRYPTO_XRP_ADDRESS || 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
    ADA: process.env.CRYPTO_ADA_ADDRESS || 'addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3qtdj5q',
    DOT: process.env.CRYPTO_DOT_ADDRESS || '12xtAYsRUrmbniiWQqJtECiBQrMn8AypQcXhnQAc6RB6XkLW',
    MATIC: process.env.CRYPTO_MATIC_ADDRESS || '0x742d35Cc7Eb259b4E503bf16CAf6D0a0f5b9F2b0'
  };

  async getCryptoPrices(currencies: string[]): Promise<CryptoPriceData> {
    try {
      const currencyList = currencies.map(c => c.toLowerCase()).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinGeckoIds(currencies)}&vs_currencies=usd`
      );
      
      return response.data;
    } catch (error) {
      logger.error('Error fetching crypto prices:', error);
      throw new Error('Unable to fetch current cryptocurrency prices');
    }
  }

  private getCoinGeckoIds(currencies: string[]): string {
    const idMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'LTC': 'litecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'MATIC': 'matic-network'
    };
    
    return currencies.map(c => idMap[c]).filter(Boolean).join(',');
  }

  async createCryptoPayment(request: CryptoPaymentRequest): Promise<CryptoPayment> {
    try {
      // Get current crypto price
      const priceData = await this.getCryptoPrices([request.currency]);
      const coinGeckoId = this.getCoinGeckoIds([request.currency]).split(',')[0];
      const exchangeRate = priceData[coinGeckoId]?.usd;
      
      if (!exchangeRate) {
        throw new Error(`Unable to get exchange rate for ${request.currency}`);
      }

      const cryptoAmount = Number((request.amount / exchangeRate).toFixed(8));
      const expiresAt = new Date(Date.now() + this.PAYMENT_EXPIRY_MINUTES * 60 * 1000);

      const payment: Omit<CryptoPayment, 'id'> = {
        userId: request.userId,
        amountUSD: request.amount,
        cryptoCurrency: request.currency,
        cryptoAmount: cryptoAmount,
        cryptoAddress: this.WALLET_ADDRESSES[request.currency],
        status: 'pending',
        planType: request.planType,
        exchangeRate: exchangeRate,
        expiresAt: expiresAt,
        createdAt: new Date()
      };

      const docRef = await this.paymentRef.add(payment);

      const createdPayment: CryptoPayment = { ...payment
      , id: docRef.id };

      logger.info(`Crypto payment created: ${docRef.id} for ${request.amount} USD in ${request.currency}`);
      return createdPayment;
    } catch (error) {
      logger.error('Error creating crypto payment:', error);
      throw error;
    }
  }

  async getCryptoPayment(paymentId: string, userId: string): Promise<CryptoPayment | null> {
    try {
      const doc = await this.paymentRef.doc(paymentId).get();
      if (!doc.exists) return null;

      const payment = doc.data() as CryptoPayment;
      if (payment.userId !== userId) {
        throw new Error('Unauthorized access to payment');
      }

      return { ...payment
      , id: doc.id };
    } catch (error) {
      logger.error('Error getting crypto payment:', error);
      throw error;
    }
  }

  async confirmCryptoPayment(paymentId: string, transactionHash: string): Promise<CryptoPayment> {
    try {
      const docRef = this.paymentRef.doc(paymentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new Error('Payment not found');
      }

      const payment = doc.data() as CryptoPayment;
      
      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Handle both Date and Firestore Timestamp
      let expiresAt: Date;
      if (payment.expiresAt instanceof Date) {
        expiresAt = payment.expiresAt;
      } else if (payment.expiresAt && typeof (payment.expiresAt as any).toDate === 'function') {
        expiresAt = (payment.expiresAt as any).toDate();
      } else {
        expiresAt = new Date(payment.expiresAt);
      }
        
      if (new Date() > expiresAt) {
        await docRef.update({ status: 'expired' });
        throw new Error('Payment has expired');
      }

      // In a real implementation, you would verify the transaction on the blockchain
      // For now, we'll simulate confirmation
      const confirmedPayment = {
        ...payment,
        id: paymentId,
        status: 'confirmed' as const,
        transactionHash: transactionHash,
        confirmedAt: new Date(),
        confirmations: 1
      };

      await docRef.update({
        status: confirmedPayment.status,
        transactionHash: confirmedPayment.transactionHash,
        confirmedAt: confirmedPayment.confirmedAt,
        confirmations: confirmedPayment.confirmations
      });

      logger.info(`Crypto payment confirmed: ${paymentId} with tx: ${transactionHash}`);
      return confirmedPayment;
    } catch (error) {
      logger.error('Error confirming crypto payment:', error);
      throw error;
    }
  }

  async getCryptoPaymentHistory(userId: string): Promise<CryptoPayment[]> {
    try {
      const snapshot = await this.paymentRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ ...doc.data()
      , id: doc.id })) as CryptoPayment[];
    } catch (error) {
      logger.error('Error getting crypto payment history:', error);
      throw error;
    }
  }

  async expireOldPayments(): Promise<void> {
    try {
      const now = new Date();
      const snapshot = await this.paymentRef
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
      });

      await batch.commit();
      logger.info(`Expired ${snapshot.docs.length} old crypto payments`);
    } catch (error) {
      logger.error('Error expiring old payments:', error);
    }
  }

  getSupportedCurrencies(): Array<{code: string, name: string, symbol: string}> {
    return [
      { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
      { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
      { code: 'XRP', name: 'Ripple', symbol: 'XRP' },
      { code: 'ADA', name: 'Cardano', symbol: '₳' },
      { code: 'DOT', name: 'Polkadot', symbol: 'DOT' },
      { code: 'MATIC', name: 'Polygon', symbol: 'MATIC' }
    ];
  }
}

export const cryptoPaymentService = new CryptoPaymentService(); 