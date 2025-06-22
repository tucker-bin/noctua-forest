import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cryptoPaymentService, CryptoPayment } from '../../services/cryptoPaymentService';
import { log } from '../../utils/logger';

// Simple icon components
const ExternalLink = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const Refresh = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const CryptoPaymentHistory: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<CryptoPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const paymentHistory = await cryptoPaymentService.getPaymentHistory();
      setPayments(paymentHistory);
    } catch (err) {
      log.error('Error fetching payment history:', { error: err instanceof Error ? err.message : String(err) }, err instanceof Error ? err : undefined);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openBlockchainExplorer = (payment: CryptoPayment) => {
    if (payment.transactionHash) {
      const url = cryptoPaymentService.getBlockchainExplorerUrl(
        payment.cryptoCurrency,
        payment.transactionHash
      );
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Cryptocurrency Payment History
          </h3>
          <button
            onClick={fetchPayments}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="Refresh"
          >
            <Refresh className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No payments yet
            </h4>
            <p className="text-gray-500">
              Your cryptocurrency payment history will appear here after your first payment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </span>
                  </div>
                  {payment.transactionHash && (
                    <button
                      onClick={() => openBlockchainExplorer(payment)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Transaction
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Plan</div>
                    <div className="font-medium capitalize">
                      {payment.planType === 'enthusiast' ? 'Rhyme Enthusiast' : 'Pro Poet'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Amount</div>
                    <div className="font-medium">
                      {cryptoPaymentService.formatCryptoAmount(
                        payment.cryptoAmount,
                        payment.cryptoCurrency
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {cryptoPaymentService.formatUSDAmount(payment.amountUSD)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Rate</div>
                    <div className="font-medium">
                      ${payment.exchangeRate.toFixed(2)} USD per {payment.cryptoCurrency}
                    </div>
                    {payment.status === 'confirmed' && payment.confirmedAt && (
                      <div className="text-sm text-green-600">
                        Confirmed {formatDate(payment.confirmedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {payment.status === 'pending' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm text-yellow-800">
                      <strong>Pending:</strong> Waiting for blockchain confirmation.
                      {cryptoPaymentService.isPaymentExpired(payment) ? (
                        <span className="text-red-600 ml-2">Payment expired</span>
                      ) : (
                        <span className="ml-2">
                          Expires in {cryptoPaymentService.formatTimeLeft(
                            cryptoPaymentService.getTimeUntilExpiry(payment)
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {payment.status === 'expired' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm text-red-800">
                      <strong>Expired:</strong> This payment was not completed within the time limit.
                    </div>
                  </div>
                )}

                {payment.transactionHash && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-500 mb-1">Transaction Hash</div>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {payment.transactionHash}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 