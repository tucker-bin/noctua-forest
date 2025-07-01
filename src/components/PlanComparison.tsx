import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Token as TokenIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { useExperience } from '../contexts/ExperienceContext';
import { CryptoPaymentModal } from './modals/CryptoPaymentModal';
import { log } from '../utils/logger';

interface PlanFeature {
  name: string;
  free: boolean | string | number;
  premium: boolean | string | number;
  icon: React.ReactElement;
    highlight?: boolean;
}

const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Daily Token Allowance',
    free: '5 tokens',
    premium: '20 tokens',
    icon: <TokenIcon />,
    highlight: true
  },
  {
    name: 'Observatory Analysis',
    free: 'Basic patterns',
    premium: 'Advanced patterns + AI insights',
    icon: <PsychologyIcon />,
    highlight: true
  },
  {
    name: 'Scriptorium (Music Tool)',
    free: 'Demo mode only',
    premium: 'Full access + lyrics lookup',
    icon: <SpeedIcon />,
    highlight: true
  },
  {
    name: 'Analysis History',
    free: false,
    premium: 'Unlimited saves',
    icon: <CheckIcon />
  },
  {
    name: 'XP & Achievement Bonuses',
    free: 'Standard rates',
    premium: '2x XP + exclusive achievements',
    icon: <TrophyIcon />,
    highlight: true
  },
  {
    name: 'Streak Rewards',
    free: 'Basic rewards',
    premium: 'Premium bonuses + token gifts',
    icon: <StreakIcon />
  },
  {
    name: 'Token Gifting',
    free: false,
    premium: 'Gift tokens to other users',
    icon: <GroupsIcon />
  },
  {
    name: 'Learning Paths',
    free: 'Basic lessons',
    premium: 'Advanced courses + personalized',
    icon: <SchoolIcon />
  },
  {
    name: 'Community Features',
    free: 'View public observations',
    premium: 'Share, comment, collaborate',
    icon: <GroupsIcon />
  },
  {
    name: 'Support',
    free: 'Community forums',
    premium: 'Priority email support',
    icon: <CheckIcon />
  }
];

export const PlanComparison: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { usageInfo } = useUsage();
  const { tokens, dailyTokens, maxDailyTokens, xp, level, streak, isPremium } = useExperience();
  
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ type: 'premium', amount: number } | null>(null);

  const handleCryptoPay = () => {
    setSelectedPlan({ type: 'premium', amount: 4.05 });
    setCryptoModalOpen(true);
  };

  const handleStripePayment = async () => {
    log.userAction('Stripe payment initiated', { 
      planType: 'premium',
      amount: 4.05,
      userId: currentUser?.uid 
    });
    
    // TODO: Implement Stripe payment logic
    console.log('Stripe payment would be initiated here');
  };

  const renderFeatureValue = (value: boolean | string | number, isPremiumPlan: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon color="success" fontSize="small" />
      ) : (
        <CancelIcon color="disabled" fontSize="small" />
      );
    }
    
    return (
      <Typography 
        variant="body2" 
        color={isPremiumPlan && typeof value === 'string' ? 'primary' : 'text.secondary'}
        fontWeight={isPremiumPlan && typeof value === 'string' ? 600 : 400}
      >
        {value}
      </Typography>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          mb: 2,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('subscription.title', 'Unlock Your Creative Potential')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          {t('subscription.subtitle', 'Choose the plan that fits your creative journey')}
        </Typography>
      </Box>

      {/* Current Status for Authenticated Users */}
      {currentUser && (
        <Alert 
          severity={isPremium ? 'success' : 'info'} 
          sx={{ mb: 4, borderRadius: 2 }}
          icon={isPremium ? <StarIcon /> : <TokenIcon />}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {isPremium ? 'Premium Member' : 'Free Plan Active'}
              </Typography>
              <Typography variant="body2">
                {isPremium 
                  ? `Level ${level} • ${tokens} tokens • ${streak} day streak`
                  : `${dailyTokens}/${maxDailyTokens} daily tokens used • Level ${level}`
                }
              </Typography>
            </Box>
            {!isPremium && (
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  Daily Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(dailyTokens / maxDailyTokens) * 100}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {/* Plans Comparison */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Free Plan */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              border: '2px solid',
              borderColor: 'grey.300',
              position: 'relative'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700}>
                  Free
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  $0<Typography component="span" variant="h6" color="text.secondary">/month</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Perfect for getting started
                </Typography>
              </Box>

              <List dense>
                {PLAN_FEATURES.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={feature.name}
                      secondary={renderFeatureValue(feature.free, false)}
                    />
                  </ListItem>
                ))}
              </List>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                disabled={currentUser ? !isPremium : false}
                sx={{ mt: 3 }}
              >
                {currentUser && !isPremium ? 'Current Plan' : 'Get Started Free'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Premium Plan */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              border: '3px solid',
              borderColor: 'primary.main',
              position: 'relative',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`
            }}
          >
            <Chip
              label="Most Popular"
              color="primary"
              sx={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                fontWeight: 600
              }}
            />
            
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  Premium
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  $4.05<Typography component="span" variant="h6" color="text.secondary">/month</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  For serious creative explorers
                </Typography>
              </Box>

              <List dense>
                {PLAN_FEATURES.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="body2" 
                          fontWeight={feature.highlight ? 600 : 400}
                          color={feature.highlight ? 'primary' : 'text.primary'}
                        >
                        {feature.name}
                        </Typography>
                      }
                      secondary={renderFeatureValue(feature.premium, true)}
                    />
                  </ListItem>
                ))}
              </List>

              {!isPremium && (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleStripePayment}
                    sx={{ fontWeight: 600 }}
                  >
                    Upgrade with Card
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleCryptoPay}
                    >
                      Pay with Crypto
                  </Button>
                </Stack>
              )}

              {isPremium && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled
                  sx={{ mt: 3 }}
                >
                  Current Plan ✨
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Anonymous User CTA */}
      {!currentUser && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            🎯 New to Noctua Forest?
          </Typography>
          <Typography variant="body2">
            Try our free example in the Observatory first, then sign up to unlock your daily tokens and start your creative journey!
          </Typography>
        </Alert>
      )}

      {/* Value Propositions */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Why Upgrade to Premium?
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <TokenIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>4x More Tokens</Typography>
              <Typography variant="body2" color="text.secondary">
                20 daily tokens vs 5 free tokens
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <PsychologyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Advanced AI</Typography>
              <Typography variant="body2" color="text.secondary">
                Deeper pattern analysis with AI insights
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <TrophyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>2x XP Rewards</Typography>
              <Typography variant="body2" color="text.secondary">
                Level up faster with premium bonuses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>Full Scriptorium</Typography>
              <Typography variant="body2" color="text.secondary">
                Complete music analysis with lyrics lookup
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Crypto Payment Modal */}
      {selectedPlan && (
        <CryptoPaymentModal
          isOpen={cryptoModalOpen}
          onClose={() => setCryptoModalOpen(false)}
          planType="pro"
          amount={selectedPlan.amount}
        />
      )}
    </Container>
  );
};

export default PlanComparison;