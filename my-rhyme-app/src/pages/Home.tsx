import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/Layout';
import { OrionOwl } from '../components/OrionOwl';
import { BarChart, Functions, Share } from '@mui/icons-material';

const HeroWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '60vh',
  padding: theme.spacing(4, 0),
  gap: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    textAlign: 'center',
  },
}));

const MascotSection = styled(Box)(({ theme }) => ({
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    order: 2,
  },
}));

const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    order: 1,
  },
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
  const { t } = useTranslation();

  const features = [
    {
      icon: <BarChart sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: t('explore_forest_title', 'Explore the Forest'),
      description: t('explore_forest_desc', 'Uncover the hidden patterns in your favorite songs and poems with data-rich analysis.'),
    },
    {
      icon: <Functions sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: t('learn_create_title', 'Learn & Create'),
      description: t('learn_create_desc', 'Understand complex rhyme schemes and create your own poetic masterpieces.'),
    },
    {
      icon: <Share sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: t('share_connect_title', 'Share & Connect'),
      description: t('share_connect_desc', 'Export your findings and share your lyrical journeys in the Forest with the community.'),
    },
  ];

  return (
    <Layout>
      <Container maxWidth="lg">
        <HeroWrapper>
          <MascotSection>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <OrionOwl 
                size={80}
                animate={true}
                mood="happy"
                showBubble={true}
                bubbleText={t('welcome_message')}
                variant="mascot"
              />
            </motion.div>
          </MascotSection>

          <ContentSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'secondary.main',
                  fontFamily: '"Space Grotesk", sans-serif',
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                Unlock the Music in Your Words
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Our AI-powered analysis tool reveals the hidden secrets in your favorite lyrics and poems, turning art into science.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/observatory')}
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
          </ContentSection>
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