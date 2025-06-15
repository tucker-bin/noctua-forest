import React, { useContext, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { Layout } from '../components/Layout';

const plans = [
  {
    title: 'Free',
    price: '$0',
    description: 'For casual users and to try out the platform.',
    features: ['5 analyses per month', 'Basic rhyme detection', 'Community access'],
    buttonText: 'Current Plan',
    buttonVariant: 'outlined',
  },
  {
    title: 'Pro',
    price: '$10',
    subheader: 'Most Popular',
    description: 'For writers, musicians, and serious hobbyists.',
    features: [
      '100 analyses per month',
      'Advanced phonetic analysis',
      'Export results to text',
      'Priority support',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'contained',
  },
  {
    title: 'Studio',
    price: '$25',
    description: 'For professional studios and power users.',
    features: [
      '500 analyses per month',
      'All Pro features',
      'API access (coming soon)',
      'Dedicated support',
    ],
    buttonText: 'Go Studio',
    buttonVariant: 'outlined',
  },
];

const PLAN_OPTIONS = [
  { name: "Starter", price: 2, tokens: 100, stripePriceId: "price_tokens_starter_100" },
  { name: "Booster", price: 5, tokens: 300, stripePriceId: "price_tokens_booster_300" },
  { name: "Writers", price: 10, tokens: 750, stripePriceId: "price_tokens_writers_750" },
  { name: "Bard", price: 20, tokens: 2000, stripePriceId: "price_tokens_bard_2000" },
];

const Credit: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const { usageInfo } = useUsage();
  const currentUser = authCtx?.currentUser;
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  const handleTopUp = async (plan: typeof PLAN_OPTIONS[0]) => {
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
    <Layout owlMessage="Manage your subscription and tokens here!">
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Credit & Plans
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center">
          Upgrade your plan or top up your tokens for more analyses and features.
        </Typography>
      </Box>

      {/* Subscription Plans Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" gutterBottom>Subscription Plans</Typography>
        <Grid container spacing={4} alignItems="flex-end">
          {plans.map((plan) => (
            <Grid item key={plan.title} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: plan.title === 'Pro' ? '2px solid' : '',
                  borderColor: plan.title === 'Pro' ? 'secondary.main' : '',
                  position: 'relative',
                }}
              >
                {plan.subheader && (
                  <Chip
                    color="secondary"
                    label={plan.subheader}
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 'bold',
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography component="h2" variant="h4" color="text.primary" gutterBottom>
                    {plan.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                    <Typography component="h2" variant="h3" color="text.primary">
                      {plan.price}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      /month
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>
                  <ul>
                    {plan.features.map((line) => (
                      <Typography component="li" variant="subtitle1" align="left" key={line} sx={{ mb: 1 }}>
                        <CheckCircle sx={{ verticalAlign: 'middle', mr: 1, color: 'secondary.main' }} />
                        {line}
                      </Typography>
                    ))}
                  </ul>
                </CardContent>
                <CardActions>
                  <Button fullWidth variant={plan.buttonVariant as 'contained' | 'outlined' | 'text'} color="secondary">
                    {plan.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* Token Top-Up Section */}
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
    </Layout>
  );
};

export default Credit; 