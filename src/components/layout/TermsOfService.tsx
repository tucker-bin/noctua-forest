import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Paper, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, Info, Security, Email, Update, Gavel, School, AutoAwesome } from '@mui/icons-material';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Gavel />,
      title: 'terms.acceptance.title',
      content: 'terms.acceptance.content'
    },
    {
      icon: <School />,
      title: 'terms.service.title',
      content: 'terms.service.content',
      list: [
        'terms.service.observatory',
        'terms.service.lessons',
        'terms.service.community',
        'terms.service.storage'
      ]
    },
    {
      icon: <AutoAwesome />,
      title: 'terms.ai.title',
      content: 'terms.ai.content',
      list: [
        'terms.ai.analysis',
        'terms.ai.ownership',
        'terms.ai.accuracy',
        'terms.ai.improvement'
      ]
    },
    {
      icon: <Security />,
      title: 'terms.conduct.title',
      content: 'terms.conduct.content',
      list: [
        'terms.conduct.respect',
        'terms.conduct.legal',
        'terms.conduct.authentic',
        'terms.conduct.security'
      ]
    },
    {
      icon: <Info />,
      title: 'terms.intellectual.title',
      content: 'terms.intellectual.content'
    },
    {
      icon: <Update />,
      title: 'terms.changes.title',
      content: 'terms.changes.content'
    },
    {
      icon: <Email />,
      title: 'terms.contact.title',
      content: 'terms.contact.content'
    }
  ];

  return (

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            {t('terms.title')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            {t('terms.last_updated', { date: new Date().toLocaleDateString() })}
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="body1" paragraph>
            {t('terms.introduction')}
          </Typography>

          {sections.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2 }}>
                  {section.icon}
                </Box>
                <Typography variant="h5" component="h2">
                  {t(section.title)}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {t(section.content)}
              </Typography>

              {section.list && (
                <List>
                  {section.list.map((item, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <CheckCircle color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={t(item)} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ))}

          <Divider sx={{ my: 4 }} />

          <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('terms.agreement.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('terms.agreement.content')}
            </Typography>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('terms.questions')} <a href="mailto:legal@noctuaforest.com">{t('terms.email')}</a>
            </Typography>
          </Box>
        </Paper>
      </Container>

  );
};

export default TermsOfService; 
