import React, { useState } from 'react';
import { useUsage } from '../contexts/UsageContext';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface BuyTokensModalProps {
  open: boolean;
  onClose: () => void;
}

const TOKEN_PACKAGES = [
  { amount: 50, label: '50 Tokens' },
  { amount: 100, label: '100 Tokens' },
  { amount: 250, label: '250 Tokens' },
  { amount: 500, label: '500 Tokens' },
];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm: React.FC<{ selectedPackage: number; onSuccess: () => void }> = ({ selectedPackage, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !currentUser) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card information is required.');
      return;
    }
    
    setProcessing(true);
    setError(null);

    try {
      // Create payment intent with better error handling
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: selectedPackage * 0.01, // $0.01 per token
          tokenPackage: selectedPackage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const { clientSecret } = await response.json();

      // Confirm payment with enhanced error handling
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: currentUser.email,
          },
        },
      });

      if (result.error) {
        // Handle specific Stripe errors
        let errorMessage = 'Payment failed. Please try again.';
        
        switch (result.error.code) {
          case 'card_declined':
            errorMessage = 'Your card was declined. Please try a different payment method.';
            break;
          case 'insufficient_funds':
            errorMessage = 'Insufficient funds. Please check your account balance.';
            break;
          case 'expired_card':
            errorMessage = 'Your card has expired. Please use a different card.';
            break;
          case 'incorrect_cvc':
            errorMessage = 'Your card\'s security code is incorrect.';
            break;
          case 'processing_error':
            errorMessage = 'An error occurred while processing your card. Please try again.';
            break;
          default:
            errorMessage = result.error.message || errorMessage;
        }
        
        setError(errorMessage);
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : `Buy ${selectedPackage} Tokens`}
      </button>
    </form>
  );
};

const BuyTokensModal: React.FC<BuyTokensModalProps> = ({ open, onClose }) => {
  const { usageInfo, updateTokenBalance } = useUsage();
  const [selectedPackage, setSelectedPackage] = useState(TOKEN_PACKAGES[0].amount);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Calculate price based on region
  const getPrice = (amount: number) => {
    if (!usageInfo || !usageInfo.userRegion) return `$${amount}`;
    // Example: $1 per 10 tokens, with regional multiplier
    const basePrice = amount / 10;
    const multiplier = usageInfo.planLimits?.regionalPricing?.tokenMultiplier || 1;
    const currency = usageInfo.planLimits?.regionalPricing?.currency || 'USD';
    const price = (basePrice * multiplier).toFixed(2);
    return `${currency} ${price}`;
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    // Simulate purchase delay
    setTimeout(async () => {
      await updateTokenBalance(selectedPackage);
      setSuccess(true);
      setIsPurchasing(false);
    }, 1200);
  };

  if (!open) return null;

  return (
    <Elements stripe={stripePromise}>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 transition-all">
          <h2 className="text-2xl font-extrabold mb-6 text-blue-700">Buy Tokens</h2>
          {success ? (
            <div className="text-center animate-bounce">
              <p className="text-green-600 font-semibold mb-4">Purchase successful!</p>
              {/* Confetti animation */}
              <div className="flex justify-center mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {TOKEN_PACKAGES.map(pkg => (
                  <label key={pkg.amount} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-blue-50 transition-all">
                    <input
                      type="radio"
                      name="tokenPackage"
                      value={pkg.amount}
                      checked={selectedPackage === pkg.amount}
                      onChange={() => setSelectedPackage(pkg.amount)}
                      className="accent-blue-600"
                    />
                    <span className="font-medium text-base">{pkg.label}</span>
                    <span className="ml-auto text-gray-600">{getPrice(pkg.amount)}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isPurchasing}
                >
                  Cancel
                </button>
                <PaymentForm selectedPackage={selectedPackage} onSuccess={onClose} />
              </div>
            </>
          )}
        </div>
      </div>
    </Elements>
  );
};

export default BuyTokensModal; 