import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';

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

interface PlanComparisonProps {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: false },
      { name: "Analysis history", included: false },
      { name: "Ad-free experience", included: false },
      { name: "Email support", included: false },
      { name: "Priority support", included: false },
      { name: "Early access to new features", included: false },
    ],
    color: "primary",
  },
  {
    name: "Rhyme Enthusiast",
    price: "$7",
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: true, highlight: true },
      { name: "Analysis history (30 days)", included: true, highlight: true },
      { name: "Ad-free experience", included: true },
      { name: "Email support", included: true },
      { name: "Priority support", included: false },
      { name: "Early access to new features", included: false },
    ],
    color: "success",
    isPopular: true,
  },
  {
    name: "Pro Poet",
    price: "$15",
    priceFrequency: "/month",
    features: [
      { name: "5 initial analyses (anonymous)", included: true },
      { name: "1 daily analysis (anonymous)", included: true },
      { name: "10 analyses/month (signed-in)", included: true },
      { name: "Standard rhyme detection", included: true },
      { name: "Community support", included: true },
      { name: "Advanced rhyme patterns", included: true },
      { name: "Analysis history (30 days)", included: true },
      { name: "Ad-free experience", included: true },
      { name: "Email support", included: true },
      { name: "Priority support", included: true, highlight: true },
      { name: "Early access to new features", included: true, highlight: true },
    ],
    color: "warning",
  },
];

const PlanComparison: React.FC<PlanComparisonProps> = ({ open, onClose, onSelectPlan }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ textAlign: 'center', mb: 1 }}>
          Compare Plans
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Choose the perfect plan for your creative journey
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }}>Features</TableCell>
                {plans.map((plan) => (
                  <TableCell
                    key={plan.name}
                    align="center"
                    sx={{
                      backgroundColor: theme.palette[plan.color].main,
                      color: theme.palette[plan.color].contrastText,
                      position: 'relative',
                    }}
                  >
                    {plan.isPopular && (
                      <Chip
                        label="Most Popular"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    )}
                    <Typography variant="h6" sx={{ mt: plan.isPopular ? 2 : 0 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1 }}>
                      {plan.price}
                      <Typography
                        component="span"
                        variant="subtitle1"
                        sx={{ display: 'block' }}
                      >
                        {plan.priceFrequency}
                      </Typography>
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {plans[0].features.map((feature, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2">{feature.name}</Typography>
                  </TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.name} align="center">
                      {plan.features[index].included ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          <CheckIcon color="success" />
                          {plan.features[index].highlight && (
                            <StarIcon color="warning" fontSize="small" />
                          )}
                        </Box>
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
        {plans.map((plan) => (
          <Button
            key={plan.name}
            variant="contained"
            color={plan.color}
            onClick={() => onSelectPlan(plan)}
            sx={{ minWidth: 200 }}
          >
            Choose {plan.name}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};

export default PlanComparison; 