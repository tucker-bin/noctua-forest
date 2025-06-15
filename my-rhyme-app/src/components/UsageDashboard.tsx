import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Button,
  Chip,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Token as TokenIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import { useUsage } from '../contexts/UsageContext';
import PlanComparison from './PlanComparison';
import { formatDate } from '../utils/localeFormat';
import { useTranslation } from 'react-i18next';

// Plan interface for the component
interface Plan {
  name: string;
  price: string;
  priceFrequency: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  color: 'primary' | 'success' | 'warning';
  isPopular?: boolean;
}

// Mock recent activity data
const MOCK_ACTIVITY = [
  { id: 'a1', date: '2024-06-14', snippet: 'The owl glides through moonlit air...', result: 'Phonetic: assonance, Rhyme: ABAB' },
  { id: 'a2', date: '2024-06-12', snippet: 'Night falls, the city hums below...', result: 'Phonetic: consonance, Rhyme: AABB' },
];

// Add fade-in animation CSS
const fadeInStyle = {
  animation: 'fadeIn 0.7s ease',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'none' }
  }
};

const UsageDashboard: React.FC = () => {
  // Runtime check for debugging
  try {
    useUsage();
  } catch (e) {
    throw new Error('UsageDashboard must be rendered within a UsageProvider.');
  }
  const { usageInfo, isLoading } = useUsage();
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPlanComparison(false);
    // Here you would typically navigate to a checkout page or show a payment modal
  };

  if (isLoading || !usageInfo) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  const {
    tokenBalance,
    analysesThisMonth,
    tokensUsedThisMonth,
    planLimits,
    lastAnalysisDate,
  } = usageInfo;

  const analysesProgress = (analysesThisMonth / planLimits.monthlyAnalyses) * 100;
  const tokensProgress = (tokensUsedThisMonth / planLimits.tokenLimit) * 100;

  const displayDate = lastAnalysisDate ? formatDate(lastAnalysisDate) : t('never');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Usage Dashboard
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/observatory')}>
          Back to Observatory
        </Button>
      </Box>
      <Grid container spacing={3}>
        {/* Usage Overview Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Usage Overview</Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TokenIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {tokenBalance}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Tokens
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {analysesThisMonth}/{planLimits.monthlyAnalyses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyses This Month
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <HistoryIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h4" sx={{ mt: 1 }}>
                      {displayDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Analysis
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Progress Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Usage
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={analysesProgress}
                    color={analysesProgress >= 90 ? 'error' : 'primary'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(analysesProgress)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analysesThisMonth} of {planLimits.monthlyAnalyses} analyses used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Token Usage Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Usage
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={tokensProgress}
                    color={tokensProgress >= 90 ? 'error' : 'primary'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(tokensProgress)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {tokensUsedThisMonth} of {planLimits.tokenLimit} tokens used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {planLimits.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    color="primary"
                    variant="outlined"
                    icon={<StarIcon />}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Observatory Activity */}
        <Grid item xs={12}>
          <Card style={fadeInStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Observatory Activity
              </Typography>
              {MOCK_ACTIVITY.length ? (
                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                  {MOCK_ACTIVITY.map(a => (
                    <Box component="li" key={a.id} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', pb: 1, mb: 1 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2, display: 'inline' }}>{formatDate(a.date)}</Typography>
                        <Typography variant="body2" sx={{ display: 'inline', color: 'text.primary' }}>{a.snippet}</Typography>
                        <Typography variant="caption" sx={{ ml: 2, color: 'primary.main' }}>{a.result}</Typography>
                      </Box>
                      <Tooltip title="View details" placement="top">
                        <Button variant="outlined" size="small" sx={{ mt: { xs: 1, md: 0 } }} aria-label="View details">
                          View
                        </Button>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No recent activity.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <PlanComparison
        open={showPlanComparison}
        onClose={() => setShowPlanComparison(false)}
        onSelectPlan={handleSelectPlan}
      />
    </Box>
  );
};

export default UsageDashboard; 