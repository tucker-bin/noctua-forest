import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h2" color="error" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Oops! The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" color="secondary" onClick={() => navigate('/')}>Go Home</Button>
    </Box>
  );
};

export default NotFoundPage; 