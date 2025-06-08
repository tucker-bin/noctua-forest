import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UsageContext } from '../contexts/UsageContext'; // To display current balance

// Simple PageView type for navigation prop
type PageView = 'analysis' | 'account' | 'subscriptionPlans' | 'topUpTokens';

interface TopUpTokensPageProps {
  navigateTo: (page: PageView) => void;
}

interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  description: string;
  ctaText: string;
  stripePriceId?: string; // Placeholder for actual Stripe Price ID
  isPopular?: boolean;
}

const TopUpTokensPage: React.FC<TopUpTokensPageProps> = ({ navigateTo }) => {
  const authCtx = useContext(AuthContext);
  const usageCtx = useContext(UsageContext);
  const currentUser = authCtx?.currentUser;
  const currentTokenBalance = usageCtx?.usageInfo?.tokenBalance;

  const [isRedirecting, setIsRedirecting] = useState<string | null>(null); // Plan ID being redirected

  const tokenPacks: TokenPack[] = [
    {
      id: "starter100",
      name: "Starter Pack",
      tokens: 100,
      price: 1.30,
      description: "Approx. 5-10 long song analyses.",
      ctaText: "Buy Now",
      stripePriceId: "price_tokens_starter_100", // Example ID
    },
    {
      id: "booster300",
      name: "Booster Pack",
      tokens: 300,
      price: 3.50,
      description: "Approx. 15-30 long song analyses.",
      ctaText: "Buy Now",
      isPopular: true,
      stripePriceId: "price_tokens_booster_300", // Example ID
    },
    {
      id: "writer750",
      name: "Writer's Pack",
      tokens: 750,
      price: 7.00,
      description: "Approx. 37-75 long song analyses.",
      ctaText: "Buy Now",
      stripePriceId: "price_tokens_writers_750", // Example ID
    },
     {
      id: "bard2000",
      name: "Bard's Treasury",
      tokens: 2000,
      price: 15.00,
      description: "Approx. 100-200 long song analyses.",
      ctaText: "Buy Now",
      stripePriceId: "price_tokens_bard_2000", // Example ID
    },
  ];

  const handlePurchaseTokens = async (pack: TokenPack) => {
    if (!currentUser || currentUser.isAnonymous) {
      alert("Please ensure you are fully signed in to purchase tokens.");
      // In a more integrated app, this might call navigateTo('analysis') to show AuthForm
      return;
    }

    setIsRedirecting(pack.id);

    // --- Simulating Backend Interaction for Stripe Checkout ---
    console.log(`User ${currentUser.uid} chose to buy ${pack.name} (${pack.tokens} tokens) for $${pack.price}. Stripe Price ID: ${pack.stripePriceId}`);
    // --- End Simulation ---

    setTimeout(() => {
      alert(`Redirecting to secure checkout for ${pack.name}... (Simulation)
After successful payment, your ${pack.tokens} tokens will be added to your account.`);
      setIsRedirecting(null);
      // Potentially call usageCtx?.fetchUsage(); here to refresh balance after mock purchase
    }, 2000);
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">Top Up Your Tokens</h1>
        <p className="lead text-muted">
          Keep your creativity flowing! Purchase tokens to continue analyzing your rhymes.
        </p>
        {currentTokenBalance !== undefined && (
          <p className="fs-4">Your current balance: <strong className="text-primary">{currentTokenBalance} Tokens</strong></p>
        )}
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        {tokenPacks.map((pack) => (
          <div key={pack.id} className="col">
            <div className={`card h-100 shadow-sm ${pack.isPopular ? 'border-primary border-2' : ''}`}>
              {pack.isPopular && (
                <div className="position-absolute top-0 start-50 translate-middle-x bg-primary text-white px-3 py-1 rounded-bottom fs-7">
                  POPULAR
                </div>
              )}
              <div className="card-header bg-light py-3">
                <h4 className="my-0 fw-normal text-center">{pack.name}</h4>
              </div>
              <div className="card-body d-flex flex-column">
                <div className="text-center mb-3">
                    <span className="display-4 fw-bold">{pack.tokens}</span>
                    <span className="ms-1 text-muted">Tokens</span>
                </div> 
                <p className="text-center text-muted small">{pack.description}</p>
                <div className="mt-auto">
                    <h2 className="card-title pricing-card-title text-center mb-3">
                        ${pack.price.toFixed(2)}
                    </h2>
                    <button 
                    type="button" 
                    className={`w-100 btn btn-lg ${pack.isPopular ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handlePurchaseTokens(pack)}
                    disabled={isRedirecting !== null}
                    >
                    {isRedirecting === pack.id ? (
                        <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                        </>
                    ) : pack.ctaText}
                    </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-center">
        <p className="text-muted">
          Payments are processed securely. Tokens are added to your account immediately after successful purchase.
          <br />Need more? Consider our <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('subscriptionPlans'); }}>Subscription Plans</a> for unlimited analyses.
        </p>
      </div>
    </div>
  );
};

export default TopUpTokensPage;
