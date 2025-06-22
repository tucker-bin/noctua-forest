import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  icon?: React.ReactElement;
  children: React.ReactNode;
  sx?: any;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  icon, 
  children, 
  sx = {} 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 27, 46, 0.95) 0%, rgba(26, 27, 46, 0.85) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: 2,
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(255, 215, 0, 0.3)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          },
          ...sx
        }}
      >
        <CardHeader
          avatar={icon}
          title={
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              {title}
            </Typography>
          }
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            pb: 2
          }}
        />
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}; 