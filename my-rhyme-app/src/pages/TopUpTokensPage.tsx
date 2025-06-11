import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext'; // To display current balance
import { Button, Typography, Box, Card, CardContent, CardActions, Grid } from '@mui/material';

// Simple PageView type for navigation prop
export type PageView = 'dashboard' | 'topup' | 'plans';

interface PlanOption {
  name: string;
  price: number;
  tokens: number;
  stripePriceId?: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  { name: "Starter", price: 2, tokens: 100, stripePriceId: "price_tokens_starter_100" },
  { name: "Booster", price: 5, tokens: 300, stripePriceId: "price_tokens_booster_300" },
  { name: "Writers", price: 10, tokens: 750, stripePriceId: "price_tokens_writers_750" },
  { name: "Bard", price: 20, tokens: 2000, stripePriceId: "price_tokens_bard_2000" },
];

interface TopUpTokensPageProps {
  onNavigate?: (view: PageView) => void;
}

const TopUpTokensPage: React.FC<TopUpTokensPageProps> = ({ onNavigate }) => {
  const authCtx = useContext(AuthContext);
  const { usageInfo } = useUsage();
  const currentUser = authCtx?.currentUser;
  const currentTokenBalance = usageInfo?.tokenBalance;

  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  const handleTopUp = async (plan: PlanOption) => {
    if (!currentUser || currentUser.isAnonymous) {
      alert("Please ensure you are fully signed in to purchase tokens.");
      return;
    }
    setIsRedirecting(plan.stripePriceId || null);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.stripePriceId, userId: currentUser.uid }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout.');
        setIsRedirecting(null);
      }
    } catch (err) {
      alert('Failed to start checkout.');
      setIsRedirecting(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Top Up Tokens</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <b>Note:</b> This is a demo. No real payment is processed. Token top-up is simulated.
      </Typography>
      <Grid container spacing={2}>
        {PLAN_OPTIONS.map((plan) => (
          <Grid item xs={12} sm={6} md={3} key={plan.name}>
            <Card>
              <CardContent>
                <Typography variant="h6">{plan.name}</Typography>
                <Typography variant="body2">{plan.tokens} tokens</Typography>
                <Typography variant="body2">${plan.price}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!!isRedirecting}
                  onClick={() => handleTopUp(plan)}
                >
                  {isRedirecting === plan.stripePriceId ? 'Redirecting...' : 'Top Up'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TopUpTokensPage;
