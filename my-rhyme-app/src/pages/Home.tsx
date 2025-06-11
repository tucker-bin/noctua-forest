import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { BarChart, Functions, Share } from '@mui/icons-material';

const HeroWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  textAlign: 'center',
  padding: theme.spacing(4, 0),
}));

const FeatureCard = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'rgba(43, 58, 103, 0.5)',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid rgba(255, 215, 0, 0.1)',
  textAlign: 'center',
  height: '100%',
}));

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Discover Patterns',
      description: 'Uncover the hidden patterns in your favorite songs and poems with data-rich analysis.',
    },
    {
      icon: <Functions sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Learn & Create',
      description: 'Understand complex rhyme schemes and create your own poetic masterpieces.',
    },
    {
      icon: <Share sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Share & Connect',
      description: 'Export your findings and share your lyrical discoveries with the community.',
    },
  ];

  return (
    <Layout
      owlMessage="Welcome to the Rhyme Observatory! Ready to unlock the music in your words?"
    >
      <Container maxWidth="lg">
        <HeroWrapper>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'secondary.main',
                fontFamily: '"Space Grotesk", sans-serif',
                mb: 2,
              }}
            >
              Unlock the Music in Your Words
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              Our AI-powered analysis tool reveals the hidden secrets in your favorite lyrics and poems, turning art into science.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/analyze')}
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                padding: '15px 40px',
                fontSize: '1.2rem',
                borderRadius: '50px',
              }}
            >
              Start Analyzing for Free
            </Button>
          </motion.div>
        </HeroWrapper>

        <Box sx={{ py: 8 }}>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)',
                  }}
                >
                  {feature.icon}
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'secondary.main',
                      fontFamily: '"Space Grotesk", sans-serif',
                      my: 2,
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {feature.description}
                  </Typography>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Layout>
  );
};

export default Home; 