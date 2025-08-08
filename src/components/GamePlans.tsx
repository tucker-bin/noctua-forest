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
  Divider,
} from '@mui/material';
import {
  Games as RegularIcon,
  AutoAwesome as CustomIcon,
  Star as StarIcon,
  AllInclusive as UnlimitedIcon,
  Psychology as AnalysisIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useGameSession } from '../contexts/GameSessionContext';

const GAME_PLANS = [
  {
    id: 'free_session',
    name: 'Free Session',
    price: 0,
    description: 'Try our linguistic games (resets on page reload)',
    features: [
      '10 regular games per session',
      'Community-generated puzzles',
      'Basic pattern analysis',
      'No custom games',
      'Session-based (no save)'
    ],
    icon: <RegularIcon />,
    buttonText: 'Playing Now',
    gamesIncluded: {
      regular: 10,
      custom: 0
    }
  },
  {
    id: 'game_player',
    name: 'Game Player',
    price: 4.99,
    description: 'Unlimited games + create custom puzzles',
    features: [
      'Unlimited regular games',
      'Unlimited custom games',
      'Observatory text analysis',
      'Save progress & history',
      'Vote on community content',
      'Pattern insights'
    ],
    icon: <CustomIcon />,
    buttonText: 'Subscribe Now',
    popular: true,
    gamesIncluded: {
      regular: 'unlimited',
      custom: 'unlimited'
    }
  },
  {
    id: 'corpus_builder',
    name: 'Corpus Builder',
    price: 9.99,
    description: 'Help shape the future of linguistic gaming',
    features: [
      'Everything in Game Player',
      'Content moderation privileges',
      'Revenue sharing from submissions',
      'Early access features',
      'Advanced analytics',
      'Developer feedback channel'
    ],
    icon: <AnalysisIcon />,
    buttonText: 'Build Corpus',
    gamesIncluded: {
      regular: 'unlimited',
      custom: 'unlimited'
    }
  }
];

export const GamePlans: React.FC = () => {
  const { currentUser } = useAuth();
  const { remainingRegularGames } = useGameSession();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    if (planId === 'free_session') return; // Already using free
    setSelectedPlan(planId);
    // Integrate with existing payment system
    console.log('Subscribing to plan:', planId);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 700 }}>
        Linguistic Gaming Plans
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Play community puzzles or create custom games with Observatory
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
                  <Box sx={{ color: 'primary.main', mb: 1, fontSize: 48 }}>
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

                {/* Game Type Breakdown */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                    What's Included:
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Regular Games
                      </Typography>
                      <Chip
                        size="small"
                        label={plan.gamesIncluded.regular === 'unlimited' ? 'Unlimited' : plan.gamesIncluded.regular}
                        color={plan.gamesIncluded.regular === 'unlimited' ? 'success' : 'default'}
                        icon={plan.gamesIncluded.regular === 'unlimited' ? <UnlimitedIcon /> : undefined}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Custom Games
                      </Typography>
                      <Chip
                        size="small"
                        label={plan.gamesIncluded.custom === 'unlimited' ? 'Unlimited' : plan.gamesIncluded.custom || 'None'}
                        color={plan.gamesIncluded.custom === 'unlimited' ? 'success' : plan.gamesIncluded.custom === 0 ? 'error' : 'default'}
                        icon={plan.gamesIncluded.custom === 'unlimited' ? <UnlimitedIcon /> : undefined}
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

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
                  variant={plan.popular ? "contained" : plan.id === 'free_session' ? "outlined" : "outlined"}
                  size="large"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.id === 'free_session' && !currentUser}
                  sx={{ mt: 2, fontWeight: 600 }}
                >
                  {plan.id === 'free_session' && !currentUser 
                    ? `${remainingRegularGames} games left` 
                    : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Game Types Explanation */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
          Two Ways to Play
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ h: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <RegularIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  Regular Games
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Play puzzles created from community-submitted content. 
                  No AI calls needed, so they're free with session limits for anonymous users.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ h: '100%', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <CustomIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  Custom Games
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Input your own text and Observatory will analyze it to create 
                  a unique puzzle just for you. Requires subscription.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 