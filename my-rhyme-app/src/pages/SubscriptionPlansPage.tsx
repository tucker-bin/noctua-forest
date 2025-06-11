import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
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

const SubscriptionPlansPage: React.FC = () => {
  return (
    <Layout owlMessage="Choose the plan that fits your creative flow!">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Pricing Plans
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Simple, transparent pricing for every level of creator.
        </Typography>
      </Box>

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
                <Button fullWidth variant={plan.buttonVariant as any} color="secondary">
                  {plan.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
};

export default SubscriptionPlansPage;
