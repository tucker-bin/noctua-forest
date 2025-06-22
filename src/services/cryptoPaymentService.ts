import { auth } from '../config/firebase';

export interface CryptoCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface CryptoPayment {
  id: string;
  amountUSD: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  cryptoAddress: string;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  planType: string;
  exchangeRate: number;
  expiresAt: string;
  createdAt: string;
  confirmedAt?: string;
  transactionHash?: string;
  confirmations?: number;
}

export interface CryptoPaymentRequest {
  amount: number;
  currency: string;
  planType: 'enthusiast' | 'pro';
}

class CryptoPaymentService {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`/api/crypto-payments${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async getSupportedCurrencies(): Promise<CryptoCurrency[]> {
    const response = await this.makeRequest('/currencies');
    return response.data;
  }

  async getCryptoPrices(): Promise<{ [key: string]: { usd: number } }> {
    const response = await this.makeRequest('/prices');
    return response.data;
  }

  async createPayment(request: CryptoPaymentRequest): Promise<CryptoPayment> {
    const response = await this.makeRequest('/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async confirmPayment(paymentId: string, transactionHash: string): Promise<CryptoPayment> {
    const response = await this.makeRequest('/confirm', {
      method: 'POST',
      body: JSON.stringify({
        paymentId,
        transactionHash,
      }),
    });
    return response.data;
  }

  async getPayment(paymentId: string): Promise<CryptoPayment> {
    const response = await this.makeRequest(`/${paymentId}`);
    return response.data;
  }

  async getPaymentHistory(): Promise<CryptoPayment[]> {
    const response = await this.makeRequest('/history/all');
    return response.data;
  }

  // Utility methods
  formatCryptoAmount(amount: number, currency: string): string {
    return `${amount.toFixed(8)} ${currency}`;
  }

  formatUSDAmount(amount: number): string {
    return `$${amount.toFixed(2)} USD`;
  }

  calculateCryptoAmount(usdAmount: number, exchangeRate: number): number {
    return Number((usdAmount / exchangeRate).toFixed(8));
  }

  getBlockchainExplorerUrl(currency: string, transactionHash: string): string {
    const explorerUrls: { [key: string]: string } = {
      'BTC': `https://blockstream.info/tx/${transactionHash}`,
      'ETH': `https://etherscan.io/tx/${transactionHash}`,
      'LTC': `https://blockchair.com/litecoin/transaction/${transactionHash}`,
      'XRP': `https://xrpscan.com/tx/${transactionHash}`,
      'ADA': `https://cardanoscan.io/transaction/${transactionHash}`,
      'DOT': `https://polkascan.io/transaction/${transactionHash}`,
      'MATIC': `https://polygonscan.com/tx/${transactionHash}`,
    };

    return explorerUrls[currency] || `https://blockchain.info/tx/${transactionHash}`;
  }

  isPaymentExpired(payment: CryptoPayment): boolean {
    return new Date() > new Date(payment.expiresAt);
  }

  getTimeUntilExpiry(payment: CryptoPayment): number {
    return Math.max(0, new Date(payment.expiresAt).getTime() - new Date().getTime());
  }

  formatTimeLeft(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const cryptoPaymentService = new CryptoPaymentService(); 