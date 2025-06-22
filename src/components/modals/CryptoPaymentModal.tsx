import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '../../utils/logger';

// Simple icon components
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Copy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M10 10h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z" />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'enthusiast' | 'pro';
  amount: number;
}

interface CryptoCurrency {
  code: string;
  name: string;
  symbol: string;
}

interface CryptoPayment {
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
}

export const CryptoPaymentModal: React.FC<CryptoPaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  amount,
}) => {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [supportedCurrencies, setSupportedCurrencies] = useState<CryptoCurrency[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: { usd: number } }>({});
  const [payment, setPayment] = useState<CryptoPayment | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch supported currencies on component mount
  useEffect(() => {
    const fetchSupportedCurrencies = async () => {
      try {
        const response = await fetch('/api/crypto-payments/currencies');
        const data = await response.json();
        if (data.success) {
          setSupportedCurrencies(data.data);
          setSelectedCurrency(data.data[0]?.code || '');
        }
      } catch (error) {
        log.error('Error fetching currencies:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      }
    };

    if (isOpen) {
      fetchSupportedCurrencies();
    }
  }, [isOpen]);

  // Fetch crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/crypto-payments/prices');
        const data = await response.json();
        if (data.success) {
          setCryptoPrices(data.data);
        }
      } catch (error) {
        log.error('Error fetching prices:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      }
    };

    if (isOpen && supportedCurrencies.length > 0) {
      fetchPrices();
      // Refresh prices every 30 seconds
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, supportedCurrencies]);

  // Timer for payment expiry
  useEffect(() => {
    if (payment && payment.status === 'pending') {
      const expiryTime = new Date(payment.expiresAt).getTime();
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const timeRemaining = Math.max(0, expiryTime - now);
        setTimeLeft(timeRemaining);
        
        if (timeRemaining === 0) {
          clearInterval(timer);
          setPayment(prev => prev ? { ...prev, status: 'expired' } : null);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [payment]);

  const createPayment = async () => {
    if (!selectedCurrency) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/crypto-payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: selectedCurrency,
          planType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        log.error('Failed to create payment', { 
          error: data.error || 'Failed to create payment',
          currency: selectedCurrency,
          amount 
        });
        setError(data.error || 'Failed to create payment');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPayment(data.data);
      } else {
        console.error(data.error || 'Failed to create payment');
      }
    } catch (error) {
      log.error('Error creating payment:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!payment || !transactionHash.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/crypto-payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          transactionHash: transactionHash.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        log.error('Failed to confirm payment', { 
          error: data.error || 'Failed to confirm payment',
          paymentId: payment.id 
        });
        setError(data.error || 'Failed to confirm payment');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setPayment(data.data);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error(data.error || 'Failed to confirm payment');
      }
    } catch (error) {
      log.error('Error confirming payment:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (payment?.cryptoAddress) {
      await navigator.clipboard.writeText(payment.cryptoAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCryptoAmount = (currencyCode: string) => {
    const coinGeckoIds: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'LTC': 'litecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'MATIC': 'matic-network'
    };
    
    const coinId = coinGeckoIds[currencyCode];
    const price = cryptoPrices[coinId]?.usd;
    return price ? (amount / price).toFixed(8) : '0';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Cryptocurrency Payment</h2>
              <p className="text-gray-600">
                Pay for your {planType === 'enthusiast' ? 'Rhyme Enthusiast' : 'Pro Poet'} subscription with cryptocurrency
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!payment ? (
            // Currency selection step
            <div className="space-y-6">
              <div>
                <label className="block text-base font-medium mb-3">Select Cryptocurrency</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedCurrencies.map((currency) => (
                    <div
                      key={currency.code}
                      className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                        selectedCurrency === currency.code
                          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCurrency(currency.code)}
                    >
                      <div className="text-2xl mb-2">{currency.symbol}</div>
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-sm text-gray-600">{currency.name}</div>
                      {cryptoPrices && (
                        <div className="text-sm font-medium text-green-600 mt-2">
                          ~{getCryptoAmount(currency.code)} {currency.code}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={createPayment}
                  disabled={!selectedCurrency || isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Payment...' : `Pay $${amount} USD`}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Payment details step
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    payment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status.toUpperCase()}
                  </span>
                  {payment.status === 'pending' && (
                    <div className="flex items-center gap-1 text-sm text-orange-600">
                      <Clock className="w-4 h-4" />
                      {formatTime(timeLeft)} left
                    </div>
                  )}
                </div>
                {payment.status === 'confirmed' && (
                  <Check className="w-6 h-6 text-green-600" />
                )}
              </div>

              <div className="border rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {payment.cryptoAmount} {payment.cryptoCurrency}
                  </div>
                  <div className="text-sm text-gray-600">
                    ${payment.amountUSD} USD at {payment.exchangeRate.toFixed(2)} USD per {payment.cryptoCurrency}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">Payment Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={payment.cryptoAddress}
                      readOnly
                      className="flex-1 p-2 border rounded font-mono text-sm bg-gray-50"
                    />
                    <button
                      onClick={copyAddress}
                      className="p-2 border rounded hover:bg-gray-50"
                    >
                      {addressCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Payment Instructions:</div>
                    <ul className="mt-1 space-y-1 text-gray-700">
                      <li>• Send exactly {payment.cryptoAmount} {payment.cryptoCurrency}</li>
                      <li>• Use the address above</li>
                      <li>• Payment expires in {formatTime(timeLeft)}</li>
                      <li>• Enter transaction hash below after sending</li>
                    </ul>
                  </div>
                </div>
              </div>

              {payment.status === 'pending' && (
                <div className="space-y-3">
                  <label htmlFor="txHash" className="block text-sm font-medium">
                    Transaction Hash
                  </label>
                  <input
                    id="txHash"
                    placeholder="Enter transaction hash after sending payment"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                  />
                  <button
                    onClick={confirmPayment}
                    disabled={!transactionHash.trim() || isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                </div>
              )}

              {payment.status === 'confirmed' && (
                <div className="text-center py-4">
                  <div className="text-green-600 font-medium mb-2">
                    Payment Confirmed! 🎉
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Your {planType === 'enthusiast' ? 'Rhyme Enthusiast' : 'Pro Poet'} subscription is now active.
                  </div>
                </div>
              )}

              {payment.status === 'expired' && (
                <div className="text-center py-4">
                  <div className="text-red-600 font-medium mb-2">
                    Payment Expired
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    This payment has expired. Please create a new payment to continue.
                  </div>
                  <button
                    onClick={() => setPayment(null)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Create New Payment
                  </button>
                </div>
              )}
            </div>
          )}
                 </div>
       </div>
     </div>
   );
 }; 