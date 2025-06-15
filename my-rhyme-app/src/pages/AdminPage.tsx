import React from 'react';
import { Container, Typography } from '@mui/material';
import { Layout } from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage: React.FC = () => {
  return (
    <Layout owlMessage="Admin Dashboard - Manage users and view system feedback.">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <AdminDashboard onClose={() => {}} />
      </Container>
    </Layout>
  );
};

export default AdminPage; 