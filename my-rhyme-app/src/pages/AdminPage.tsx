import React from 'react';
import { Container } from '@mui/material';
import { Layout } from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage: React.FC = () => {
  return (
    <Layout owlMessage="Admin Dashboard - Manage users and view system feedback.">
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <AdminDashboard />
      </Container>
    </Layout>
  );
};

export default AdminPage; 