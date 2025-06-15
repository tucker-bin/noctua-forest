import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Chip, Divider } from '@mui/material';
import { Layout } from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { Psychology, Language, Analytics, Security } from '@mui/icons-material';

const About: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Psychology color="primary" sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Analysis',
      description: 'Advanced phonetic pattern detection using state-of-the-art AI technology to uncover hidden linguistic structures.'
    },
    {
      icon: <Language color="primary" sx={{ fontSize: 40 }} />,
      title: 'Multi-Language Support',
      description: 'Support for 15+ languages with RTL text support and locale-aware formatting for global accessibility.'
    },
    {
      icon: <Analytics color="primary" sx={{ fontSize: 40 }} />,
      title: 'Detailed Analytics',
      description: 'Comprehensive analysis results with interactive visualizations and exportable data for research and education.'
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Privacy First',
      description: 'Your data is secure and private. We never share your analyses or personal information with third parties.'
    }
  ];

  const technologies = [
    'React', 'TypeScript', 'Node.js', 'Firebase', 'Anthropic AI', 'Material-UI', 'Stripe', 'Express.js'
  ];

  return (
    <Layout owlMessage="Learn more about Noctua Forest and our mission to make language analysis accessible to everyone.">
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              About Noctua Forest
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
              Empowering creators, educators, and language enthusiasts with AI-powered phonetic analysis tools
            </Typography>
            <Divider sx={{ maxWidth: '200px', mx: 'auto', mb: 4 }} />
          </Box>

          {/* Mission Section */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Our Mission
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
              Noctua Forest democratizes advanced linguistic analysis by making sophisticated phonetic pattern detection 
              accessible to poets, songwriters, educators, researchers, and language enthusiasts worldwide.
            </Typography>
          </Box>

          {/* Features Grid */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              Key Features
            </Typography>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Technology Stack */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              Built With Modern Technology
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
              {technologies.map((tech, index) => (
                <Chip key={index} label={tech} variant="outlined" color="primary" />
              ))}
            </Box>
            <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Our platform is built using cutting-edge web technologies to ensure reliability, scalability, and performance.
            </Typography>
          </Box>

          {/* Vision Section */}
          <Box sx={{ textAlign: 'center', bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h4" gutterBottom>
              Our Vision
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, maxWidth: '800px', mx: 'auto' }}>
              We envision a world where the beauty and complexity of language patterns are accessible to all creators. 
              Whether you're crafting the next great poem, analyzing historical texts, or teaching students about phonetics, 
              Noctua Forest provides the tools you need to unlock the hidden musicality in words.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default About; 