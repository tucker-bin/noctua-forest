import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import type { Palette } from '@mui/material';
import {
  Star as StarIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

type PlanColor = 'primary' | 'success' | 'warning';

interface Plan {
  name: string;
  price: string;
  period: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  color: PlanColor;
  isPopular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'month',
    features: [
      { name: '5 initial analyses (anonymous)', included: true },
      { name: '1 daily analysis (anonymous)', included: true },
      { name: '10 analyses/month (signed-in)', included: true },
      { name: 'Standard rhyme detection', included: true },
      { name: 'Community support', included: true },
      { name: 'Advanced rhyme patterns', included: false },
      { name: 'Analysis history', included: false },
      { name: 'Ad-free experience', included: false },
      { name: 'Email support', included: false },
      { name: 'Priority support', included: false },
      { name: 'Early access to new features', included: false },
    ],
    color: 'primary',
  },
  {
    name: 'Rhyme Enthusiast',
    price: '$7',
    period: 'month',
    features: [
      { name: '5 initial analyses (anonymous)', included: true },
      { name: '1 daily analysis (anonymous)', included: true },
      { name: '10 analyses/month (signed-in)', included: true },
      { name: 'Standard rhyme detection', included: true },
      { name: 'Community support', included: true },
      { name: 'Advanced rhyme patterns', included: true, highlight: true },
      { name: 'Analysis history (30 days)', included: true, highlight: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: false },
      { name: 'Early access to new features', included: false },
    ],
    color: 'success',
    isPopular: true,
  },
  {
    name: 'Pro Poet',
    price: '$15',
    period: 'month',
    features: [
      { name: '5 initial analyses (anonymous)', included: true },
      { name: '1 daily analysis (anonymous)', included: true },
      { name: '10 analyses/month (signed-in)', included: true },
      { name: 'Standard rhyme detection', included: true },
      { name: 'Community support', included: true },
      { name: 'Advanced rhyme patterns', included: true },
      { name: 'Analysis history (30 days)', included: true },
      { name: 'Ad-free experience', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: true, highlight: true },
      { name: 'Early access to new features', included: true, highlight: true },
    ],
    color: 'warning',
  },
];

const SubscriptionPlans: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const getBorderColor = (color: PlanColor) => {
    const palette = theme.palette as Palette & Record<PlanColor, { main: string }>;
    return palette[color].main;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Select the perfect plan for your creative journey
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.name}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.isPopular
                  ? `2px solid ${getBorderColor(plan.color)}`
                  : 'none',
              }}
            >
              {plan.isPopular && (
                <Chip
                  label="Most Popular"
                  color={plan.color}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              <CardContent sx={{ flexGrow: 1, pt: plan.isPopular ? 4 : 2 }}>
                <Typography
                  variant="h4"
                  component="h2"
                  gutterBottom
                  color={plan.color}
                >
                  {plan.name}
                </Typography>
                <Typography variant="h3" component="div" gutterBottom>
                  {plan.price}
                  <Typography
                    component="span"
                    variant="subtitle1"
                    color="text.secondary"
                  >
                    /{plan.period}
                  </Typography>
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {plan.features.map((feature, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        gap: 1,
                      }}
                    >
                      {feature.included ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                      <Typography
                        variant="body2"
                        color={feature.included ? 'text.primary' : 'text.secondary'}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        {feature.name}
                        {feature.highlight && (
                          <StarIcon
                            color="warning"
                            fontSize="small"
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color={plan.color}
                  size="large"
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SubscriptionPlans; 