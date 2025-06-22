import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  owlMessage?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, owlMessage }) => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(26, 27, 46, 0.9) 0%, rgba(10, 11, 20, 0.95) 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, pt: 8 }}>
        {owlMessage && (
          <Box sx={{ 
            mb: 3, 
            mx: 'auto',
            maxWidth: 'lg',
            px: 4,
            p: 2, 
            bgcolor: 'rgba(26, 27, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: 1,
            color: 'text.primary',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            {owlMessage}
          </Box>
        )}
        {children}
      </Box>
      <Footer />
    </Box>
  );
}; 