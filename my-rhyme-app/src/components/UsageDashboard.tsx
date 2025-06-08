import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Button,
  Chip,
  Divider,
  useTheme,
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

const UsageDashboard: React.FC = () => {
  const { usageInfo, isLoading } = useUsage();
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const theme = useTheme();

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

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Usage Overview Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Usage Overview</Typography>
                <Button
                  variant="outlined"
                  startIcon={<UpgradeIcon />}
                  onClick={() => setShowPlanComparison(true)}
                >
                  Upgrade Plan
                </Button>
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
                      {formatDate(lastAnalysisDate)}
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

        {/* Progress Cards */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Analysis Progress
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
      </Grid>

      <PlanComparison
        open={showPlanComparison}
        onClose={() => setShowPlanComparison(false)}
        onSelectPlan={(plan) => {
          // Handle plan selection
          console.log('Selected plan:', plan);
          setShowPlanComparison(false);
        }}
      />
    </Box>
  );
};

export default UsageDashboard; 