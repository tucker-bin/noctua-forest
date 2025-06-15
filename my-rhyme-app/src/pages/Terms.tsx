import React from 'react';
import { Box, Typography, Container, Divider } from '@mui/material';
import { Layout } from '../components/Layout';

const Terms: React.FC = () => {
  return (
    <Layout owlMessage="Please review our terms of service to understand your rights and responsibilities when using Noctua Forest.">
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              Terms of Service
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
            <Divider sx={{ maxWidth: '200px', mx: 'auto', mb: 4 }} />
          </Box>

          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
              By using Noctua Forest, you agree to these Terms of Service. Please read them carefully.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Acceptance of Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Use License
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Permission is granted to temporarily use Noctua Forest for personal, non-commercial transitory viewing only.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              User Accounts
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding your account.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Payment Terms
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Token purchases are final and non-refundable. Prices are subject to change with notice.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Contact Information
            </Typography>
            <Typography variant="body1">
              If you have any questions about these Terms of Service, please contact us at legal@noctuaforest.com.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default Terms; 