import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'rgba(26, 37, 71, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
}));

const FeatureCard = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(43, 58, 103, 0.5)',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid rgba(255, 215, 0, 0.1)',
  textAlign: 'center',
}));

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Discover Patterns',
      description: 'Uncover the hidden patterns in your favorite songs and poems',
    },
    {
      title: 'Learn & Create',
      description: 'Understand rhyme schemes and create your own masterpieces',
    },
    {
      title: 'Share & Connect',
      description: 'Share your discoveries with the community',
    },
  ];

  return (
    <Layout
      owlMessage="Welcome to the Rhyme Observatory! Let's explore the patterns in your favorite songs and poems."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StyledPaper elevation={3}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: 'secondary.main',
              fontFamily: '"Space Grotesk", sans-serif',
              marginBottom: 2,
            }}
          >
            Welcome to Rhyme Observatory
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              marginBottom: 4,
            }}
          >
            Discover the patterns in your favorite songs and poems
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/analyze')}
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              padding: '12px 32px',
            }}
          >
            Start Analyzing
          </Button>
        </StyledPaper>
      </motion.div>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mt: 6,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'secondary.main',
                fontFamily: '"Space Grotesk", sans-serif',
                marginBottom: 2,
              }}
            >
              {feature.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
              }}
            >
              {feature.description}
            </Typography>
          </FeatureCard>
        ))}
      </Box>
    </Layout>
  );
};

export default Home; 