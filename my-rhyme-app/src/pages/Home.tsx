import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Advanced Analysis',
      description: 'Get detailed insights into your rhyme patterns and poetic techniques.',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Real-time Processing',
      description: 'Instant feedback on your writing with our powerful analysis engine.',
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: 'Learn & Improve',
      description: 'Understand your writing style and discover new techniques.',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Rhyme App
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Your AI-powered poetry analysis companion
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/analysis')}
          sx={{ mt: 2 }}
        >
          Start Analyzing
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <Typography gutterBottom variant="h5" component="h2">
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => navigate('/analysis')}
                >
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h4" gutterBottom>
          Ready to elevate your poetry?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Join thousands of poets who use Rhyme App to improve their craft
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/analysis')}
          sx={{ mt: 2 }}
        >
          Get Started Now
        </Button>
      </Box>
    </Container>
  );
};

export default Home; 