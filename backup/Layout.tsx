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

const HeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  flexWrap: 'wrap', // Allow wrapping on smaller screens
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
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
    zIndex: -1,
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
      <HeaderWrapper>
        <RhymeOwl message={owlMessage} isAnalyzing={isAnalyzing} />
      </HeaderWrapper>
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </StyledContainer>
  );
}; 