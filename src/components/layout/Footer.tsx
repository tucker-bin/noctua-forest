import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  useTheme,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Link as RouterLink } from 'react-router-dom';

const footerSections = [
  {
    title: 'footer.explore',
    links: [
      { label: 'footer.observatory', path: '/observatory' },
      { label: 'footer.scriptorium', path: '/scriptorium' },
      { label: 'footer.learning_paths', path: '/lessons' },
      { label: 'footer.achievements', path: '/achievements' },
    ],
  },
  {
    title: 'footer.resources',
    links: [
      { label: 'footer.daily_challenge', path: '/forest?area=games&tab=challenges' },
      { label: 'footer.flowFinder', path: '/forest?area=games' },
      { label: 'footer.community', path: '/forest?area=community' },
      { label: 'footer.profile', path: '/profile' },
    ],
  },
  {
    title: 'footer.legal',
    links: [
      { label: 'footer.privacy', path: '/privacy' },
      { label: 'footer.terms', path: '/terms' },
      { label: 'footer.accounts', path: '/accounts' },
      { label: 'footer.support', path: '/support' },
    ],
  },
];

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'transparent',
        backgroundImage: `linear-gradient(${theme.palette.forest.card}CC, ${theme.palette.forest.card}AA)`,
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${theme.palette.forest.border}30`,
        mt: 'auto',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 4 }}>
          {footerSections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: theme.palette.forest.primary,
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 600,
                }}
              >
                {t(section.title)}
              </Typography>
              {section.links.map((link) => (
                <Link
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    display: 'block',
                    color: 'text.secondary',
                    mb: 1,
                    textDecoration: 'none',
                    '&:hover': {
                      color: theme.palette.forest.secondary,
                    },
                  }}
                >
                  {t(link.label)}
                </Link>
              ))}
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 4, borderColor: `${theme.palette.forest.border}30` }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.forest.primary}, ${theme.palette.forest.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            © {new Date().getFullYear()} Noctua Forest. {t('footer.rights')}
          </Typography>

          <Box>
            <IconButton
              href="https://github.com/noctua-forest"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: theme.palette.forest.accent },
              }}
            >
              <GitHubIcon />
            </IconButton>
            <IconButton
              href="https://twitter.com/noctuaforest"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: theme.palette.forest.accent },
              }}
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              href="https://linkedin.com/company/noctua-forest"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: theme.palette.forest.accent },
              }}
            >
              <LinkedInIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}; 