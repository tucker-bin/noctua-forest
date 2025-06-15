import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Link, Divider } from '@mui/material';
import { Layout } from '../components/Layout';
import { Email, GitHub, Twitter, Help, BugReport, Feedback } from '@mui/icons-material';

const Contact: React.FC = () => {
  const contactOptions = [
    {
      icon: <Email color="primary" sx={{ fontSize: 40 }} />,
      title: 'General Support',
      description: 'For general questions, technical support, or account issues',
      contact: 'support@noctuaforest.com',
      href: 'mailto:support@noctuaforest.com'
    },
    {
      icon: <BugReport color="primary" sx={{ fontSize: 40 }} />,
      title: 'Bug Reports',
      description: 'Found a bug? Help us improve by reporting issues',
      contact: 'bugs@noctuaforest.com',
      href: 'mailto:bugs@noctuaforest.com'
    },
    {
      icon: <Feedback color="primary" sx={{ fontSize: 40 }} />,
      title: 'Feature Requests',
      description: 'Have an idea for a new feature? We\'d love to hear it!',
      contact: 'feedback@noctuaforest.com',
      href: 'mailto:feedback@noctuaforest.com'
    },
    {
      icon: <Help color="primary" sx={{ fontSize: 40 }} />,
      title: 'Business Inquiries',
      description: 'Partnerships, licensing, or enterprise solutions',
      contact: 'business@noctuaforest.com',
      href: 'mailto:business@noctuaforest.com'
    }
  ];

  return (
    <Layout owlMessage="Need help or have questions? We're here to assist you with any inquiries about Noctua Forest.">
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              Contact Us
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
              We're here to help! Reach out to us through any of the channels below.
            </Typography>
            <Divider sx={{ maxWidth: '200px', mx: 'auto', mb: 4 }} />
          </Box>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            {contactOptions.map((option, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  transition: 'transform 0.2s, box-shadow 0.2s', 
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  } 
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {option.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {option.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {option.description}
                    </Typography>
                    <Link 
                      href={option.href} 
                      color="primary" 
                      sx={{ 
                        fontWeight: 500,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {option.contact}
                    </Link>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ 
            textAlign: 'center', 
            bgcolor: 'background.paper', 
            p: 4, 
            borderRadius: 2, 
            boxShadow: 1 
          }}>
            <Typography variant="h5" gutterBottom>
              Response Time
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We typically respond to all inquiries within 24-48 hours during business days. 
              For urgent technical issues, please include "URGENT" in your subject line.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default Contact; 