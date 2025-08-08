import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Games as GameIcon,
  Star as StarIcon,
  Lightbulb as PuzzleIcon,
  People as CommunityIcon,
  TrendingUp as ProgressIcon,
  Verified as QualityIcon,
} from '@mui/icons-material';

const GAME_PLANS = [
  {
    id: 'free_player',
    name: 'Free Player',
    price: 0,
    description: 'Try our linguistic games with community content',
    features: [
      '3 daily puzzles',
      'Community-submitted content',
      'Basic difficulty levels',
      'Submit 1 text per day',
      'Vote on community content'
    ],
    icon: <GameIcon />,
    buttonText: 'Play Free'
  },
  {
    id: 'puzzle_enthusiast',
    name: 'Puzzle Enthusiast',
    price: 4.99,
    description: 'Unlimited access to our growing puzzle corpus',
    features: [
      'Unlimited daily puzzles',
      'Premium curated content',
      'All difficulty levels',
      'Submit unlimited texts',
      'Priority voting weight',
      'Exclusive contributor rewards',
      'Advanced pattern insights'
    ],
    icon: <PuzzleIcon />,
    buttonText: 'Subscribe Now',
    popular: true
  },
  {
    id: 'corpus_contributor',
    name: 'Corpus Contributor',
    price: 9.99,
    description: 'Help build the future of linguistic gaming',
    features: [
      'Everything in Enthusiast',
      'Revenue sharing from submissions',
      'Content moderation privileges',
      'Early access to new features',
      'Contributor leaderboard',
      'Monthly corpus analytics',
      'Direct feedback to developers'
    ],
    icon: <CommunityIcon />,
    buttonText: 'Become Contributor'
  }
];

export const GameSubscriptionPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    // Integrate with existing payment system
    console.log('Subscribing to plan:', planId);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 700 }}>
        Linguistic Game Subscriptions
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Play community-driven puzzles, contribute content, earn rewards
      </Typography>

      <Grid container spacing={4}>
        {GAME_PLANS.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? 'primary.main' : 'grey.300',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {plan.popular && (
                <Chip 
                  label="Most Popular" 
                  color="primary" 
                  size="small"
                  sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {plan.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    ${plan.price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {plan.price > 0 ? '/month' : ''}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.description}
                  </Typography>
                </Box>

                <List dense sx={{ flexGrow: 1 }}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <StarIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant={plan.popular ? "contained" : "outlined"}
                  size="large"
                  onClick={() => handleSubscribe(plan.id)}
                  sx={{ mt: 2, fontWeight: 600 }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Community Corpus Stats */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
          Community Corpus Statistics
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                12.4K+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Community Submissions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                94.7%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Quality Score
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                2.1K
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Active Contributors
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                45K+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Puzzles Generated
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 