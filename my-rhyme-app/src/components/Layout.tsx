import React from 'react';
import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { RhymeOwl } from './RhymeOwl';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(43, 58, 103, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
}));

interface LayoutProps {
  children: React.ReactNode;
  owlMessage?: string;
  isAnalyzing?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, owlMessage, isAnalyzing }) => {
  return (
    <StyledContainer maxWidth="lg">
      <ContentWrapper>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <RhymeOwl message={owlMessage} isAnalyzing={isAnalyzing} />
        </Box>
        {children}
      </ContentWrapper>
    </StyledContainer>
  );
}; 