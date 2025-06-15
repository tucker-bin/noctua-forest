import React from 'react';
import { Box, Typography, Container, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Layout } from '../components/Layout';

const Privacy: React.FC = () => {
  return (
    <Layout owlMessage="Your privacy is important to us. Learn how we protect and handle your data.">
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              Privacy Policy
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
            <Divider sx={{ maxWidth: '200px', mx: 'auto', mb: 4 }} />
          </Box>

          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
              At Noctua Forest, we are committed to protecting your privacy and ensuring the security of your personal information.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Information We Collect
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Account Information: Email address, password (encrypted), and profile preferences" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Usage Data: Text submitted for analysis, analysis results, and usage statistics" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Technical Data: IP address, browser type, device information, and access logs" />
              </ListItem>
            </List>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              How We Use Your Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Provide phonetic analysis services and generate results" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Manage your account and authenticate your identity" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Process payments and manage your token balance" />
              </ListItem>
            </List>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Data Security
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              We implement appropriate technical and organizational measures to protect your personal information.
            </Typography>

            <Typography variant="h4" component="h3" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
              Contact Us
            </Typography>
            <Typography variant="body1">
              If you have any questions about this Privacy Policy, please contact us at privacy@noctuaforest.com.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
};

export default Privacy; 