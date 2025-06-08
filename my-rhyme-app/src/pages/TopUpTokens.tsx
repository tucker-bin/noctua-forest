import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useUsage } from '../contexts/UsageContext';
import { useAuth } from '../contexts/AuthContext';

const tokenPackages = [
  {
    name: 'Starter Pack',
    tokens: 100,
    price: 5,
    bonus: 0,
  },
  {
    name: 'Poet\'s Pack',
    tokens: 500,
    price: 20,
    bonus: 50,
  },
  {
    name: 'Master\'s Pack',
    tokens: 1000,
    price: 35,
    bonus: 150,
  },
];

const TopUpTokens: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usageInfo, updateTokenBalance } = useUsage();
  const { currentUser } = useAuth();

  const handleTopUp = async (amount: number) => {
    if (!currentUser) {
      setError('Please log in to top up tokens');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update token balance
      await updateTokenBalance(amount);
      
      // Reset form
      setSelectedPackage(null);
      setCustomAmount('');
      
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      console.error('Top-up error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomTopUp = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    handleTopUp(amount);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Top Up Your Tokens
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Choose a package or enter a custom amount
        </Typography>
        {usageInfo && (
          <Typography variant="body1" color="text.secondary">
            Current balance: {usageInfo.tokenBalance} tokens
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4} justifyContent="center">
        {tokenPackages.map((pkg, index) => (
          <Grid item xs={12} md={4} key={pkg.name}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedPackage === index ? '2px solid primary.main' : 'none',
              }}
              onClick={() => setSelectedPackage(index)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {pkg.name}
                </Typography>
                <Typography variant="h3" component="div" gutterBottom>
                  {pkg.tokens}
                  <Typography
                    component="span"
                    variant="subtitle1"
                    color="text.secondary"
                  >
                    {' '}
                    tokens
                  </Typography>
                </Typography>
                {pkg.bonus > 0 && (
                  <Typography variant="body1" color="success.main" gutterBottom>
                    +{pkg.bonus} bonus tokens
                  </Typography>
                )}
                <Typography variant="h6" color="primary" gutterBottom>
                  ${pkg.price}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Custom Amount
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Number of tokens"
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={isProcessing}
          />
          <Button
            variant="contained"
            onClick={handleCustomTopUp}
            disabled={isProcessing || !customAmount}
            sx={{ minWidth: 120 }}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Top Up'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => selectedPackage !== null && handleTopUp(tokenPackages[selectedPackage].tokens)}
          disabled={isProcessing || selectedPackage === null}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Purchase Selected Package'}
        </Button>
      </Box>
    </Container>
  );
};

export default TopUpTokens; 