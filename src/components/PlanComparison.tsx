import React, { useState } from 'react';
import { CryptoPaymentModal } from './modals/CryptoPaymentModal';
import { log } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  name: string;
  price: string;
  priceFrequency: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  color: 'primary' | 'success' | 'warning';
  isPopular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: false },
      { name: "Analysis history", included: false },
      { name: "Ad-free experience", included: false },
      { name: "Email support", included: false },
      { name: "Priority support", included: false },
      { name: "Early access to new features", included: false },
    ],
    color: "primary",
  },
  {
    name: "Rhyme Enthusiast",
    price: "$1.89", // Reduced from $7
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: true, highlight: true },
      { name: "Analysis history (30 days)", included: true, highlight: true },
      { name: "Ad-free experience", included: true },
      { name: "Email support", included: true },
      { name: "Priority support", included: false },
      { name: "Early access to new features", included: false },
    ],
    color: "success",
    isPopular: true,
  },
  {
    name: "Pro Poet",
    price: "$4.05", // Reduced from $15
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: true },
      { name: "Analysis history (30 days)", included: true },
      { name: "Ad-free experience", included: true },
      { name: "Email support", included: true },
      { name: "Priority support", included: true, highlight: true },
      { name: "Early access to new features", included: true, highlight: true },
    ],
    color: "warning",
  },
];

export const PlanComparison: React.FC = () => {
  const { currentUser } = useAuth();
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ type: 'enthusiast' | 'pro', amount: number } | null>(null);

  const handleCryptoPay = (planType: 'enthusiast' | 'pro', amount: number) => {
    setSelectedPlan({ type: planType, amount });
    setCryptoModalOpen(true);
  };

  const handleStripePayment = async (planType: string, amount: number) => {
    log.userAction('Stripe payment initiated', { 
      planType, 
      amount,
      userId: currentUser?.uid 
    });
    
    // Implement Stripe payment logic here
    // This would typically redirect to Stripe Checkout or use Stripe Elements
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600">
            Unlock the full potential of pattern observation with our flexible pricing options
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg overflow-hidden relative ${
                plan.isPopular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.priceFrequency}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full mr-3 mt-0.5 ${
                        feature.included 
                          ? 'bg-green-500 text-white flex items-center justify-center'
                          : 'bg-gray-200'
                      }`}>
                        {feature.included && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included ? 'text-gray-900' : 'text-gray-400'
                      } ${
                        feature.highlight ? 'font-semibold' : ''
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.name !== 'Free' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStripePayment(
                        plan.name === 'Rhyme Enthusiast' ? 'enthusiast' : 'pro',
                        parseFloat(plan.price.replace('$', ''))
                      )}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        plan.color === 'success'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : plan.color === 'warning'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Pay with Card
                    </button>
                    
                    <button
                      onClick={() => handleCryptoPay(
                        plan.name === 'Rhyme Enthusiast' ? 'enthusiast' : 'pro',
                        parseFloat(plan.price.replace('$', ''))
                      )}
                      className="w-full py-2 px-4 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Pay with Crypto
                    </button>
                  </div>
                )}

                {plan.name === 'Free' && (
                  <button className="w-full py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed">
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-600 mb-4">
            💰 Pay with Bitcoin, Ethereum, Litecoin, and other major cryptocurrencies
          </p>
          <p className="text-xs text-gray-500">
            All prices are in USD. Cryptocurrency payments are processed instantly and securely.
          </p>
        </div>
      </div>

      {selectedPlan && (
        <CryptoPaymentModal
          isOpen={cryptoModalOpen}
          onClose={() => setCryptoModalOpen(false)}
          planType={selectedPlan.type}
          amount={selectedPlan.amount}
        />
      )}
    </div>
  );
};

export default PlanComparison;