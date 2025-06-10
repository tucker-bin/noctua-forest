import React, { useContext, useState } from 'react';
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
  onNavigate: (view: PageView) => void;
}

const TopUpTokensPage: React.FC<TopUpTokensPageProps> = ({ onNavigate }) => {
  const authCtx = useContext(AuthContext);
  const { usageInfo } = useUsage();
  const currentUser = authCtx?.currentUser;
  const currentTokenBalance = usageInfo?.tokenBalance;

  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  const handleTopUp = (plan: PlanOption) => {
    if (!currentUser || currentUser.isAnonymous) {
      alert("Please ensure you are fully signed in to purchase tokens.");
      // In a more integrated app, this might call onNavigate('topup') to show AuthForm
      return;
    }

    setIsRedirecting(plan.stripePriceId || null);
    // Simulate payment processing and update token balance
    setTimeout(() => {
      setIsRedirecting(null);
      // Potentially call usageInfo?.fetchUsage(); here to refresh balance after mock purchase
    }, 2000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Top Up Tokens</Typography>
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
