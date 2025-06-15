import React from 'react';
import { Box, Typography, Link, IconButton } from '@mui/material';
import { GitHub, Twitter, Language } from '@mui/icons-material';
import LanguageSwitcher from './LanguageSwitcher';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" role="contentinfo" sx={{
      mt: 8,
      py: 4,
      px: 2,
      background: 'linear-gradient(90deg, #232946 0%, #394867 100%)',
      color: '#fff',
      boxShadow: '0 -2px 16px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>© {year} Noctua Forest</Typography>
        <Link href="/about" color="inherit" underline="hover" aria-label="About">About</Link>
        <Link href="/contact" color="inherit" underline="hover" aria-label="Contact">Contact</Link>
        <Link href="/privacy" color="inherit" underline="hover" aria-label="Privacy">Privacy</Link>
        <Link href="/terms" color="inherit" underline="hover" aria-label="Terms">Terms</Link>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton href="https://github.com/tucker-bin/my-ryhme-app" color="inherit" aria-label="GitHub" target="_blank" rel="noopener">
          <GitHub />
        </IconButton>
        <IconButton href="#" color="inherit" aria-label="Twitter" target="_blank" rel="noopener">
          <Twitter />
        </IconButton>
        <LanguageSwitcher />
        <Language sx={{ ml: 1 }} />
      </Box>
    </Box>
  );
};

export default Footer;
