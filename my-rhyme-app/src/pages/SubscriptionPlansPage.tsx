import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Container, Box, Typography, Grid, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, CardActions, Button, Chip, Alert, CircularProgress } from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Email from '@mui/icons-material/Email';

interface Plan {
    name: string;
    price: string;
    priceFrequency: string;
    features: string[];
    ctaText: string;
    isCurrent?: boolean;
    isPopular?: boolean;
    stripePriceId: string;
    color: 'primary' | 'success' | 'warning';
    icon: string;
}

const SubscriptionPlansPage: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      name: "Free",
      price: "$0",
      priceFrequency: "/month",
      features: [
        "5 initial analyses (anonymous)",
        "1 daily analysis (anonymous)",
        "10 analyses/month (signed-in)",
        "Standard rhyme detection",
        "Community support"
      ],
      ctaText: currentUser && !currentUser.isAnonymous ? "Your Current Plan" : "Get Started",
      isCurrent: currentUser ? true : false,
      stripePriceId: "price_free_tier_id",
      color: "primary",
      icon: "🎵"
    },
    {
      name: "Rhyme Enthusiast",
      price: "$7",
      priceFrequency: "/month",
      features: [
        "200 analyses/month",
        "Advanced rhyme patterns",
        "Analysis history (30 days)",
        "Ad-free experience",
        "Email support"
      ],
      ctaText: "Choose Plan",
      isPopular: true,
      stripePriceId: "price_enthusiast_tier_id",
      color: "success",
      icon: "🎸"
    },
    {
      name: "Pro Poet",
      price: "$15",
      priceFrequency: "/month",
      features: [
        "Unlimited analyses",
        "All advanced patterns & metrics",
        "Full analysis history",
        "Ad-free experience",
        "Priority email support",
        "Early access to new features"
      ],
      ctaText: "Choose Plan",
      stripePriceId: "price_pro_tier_id",
      color: "warning",
      icon: "🎹"
    },
  ];

  const handlePlanSelect = async (plan: Plan) => {
    if (plan.isCurrent) return;
    
    setIsRedirecting(plan.stripePriceId);
    setError(null);
    setSuccess(null);

    try {
      // Mock subscription flow - replace with actual Stripe integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(`Successfully subscribed to ${plan.name} plan!`);
    } catch (err: any) {
      setError(err.message || 'Failed to process subscription');
    } finally {
      setIsRedirecting(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Select the perfect plan for your creative journey. Upgrade or downgrade anytime.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.name}>
            <Card
              elevation={plan.isPopular ? 8 : 2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                },
                border: plan.isPopular ? 2 : 0,
                borderColor: 'primary.main',
              }}
            >
              {plan.isPopular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {plan.icon}
                  </Typography>
                  <Typography variant="h4" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                    {plan.price}
                    <Typography
                      component="span"
                      variant="h6"
                      color="text.secondary"
                    >
                      {plan.priceFrequency}
                    </Typography>
                  </Typography>
                </Box>

                <List sx={{ mb: 3 }}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>

              <CardActions sx={{ p: 4, pt: 0 }}>
                <Button
                  fullWidth
                  variant={plan.isCurrent ? "outlined" : "contained"}
                  color={plan.color}
                  size="large"
                  onClick={() => handlePlanSelect(plan)}
                  disabled={plan.isCurrent || isRedirecting === plan.stripePriceId}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  {isRedirecting === plan.stripePriceId ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    plan.ctaText
                  )}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Need a custom plan?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Contact us for enterprise solutions or custom requirements
        </Typography>
        <Button
          variant="outlined"
          size="large"
          startIcon={<Email />}
          href="mailto:support@rhymeapp.com"
        >
          Contact Sales
        </Button>
      </Box>
    </Container>
  );
};

export default SubscriptionPlansPage;
