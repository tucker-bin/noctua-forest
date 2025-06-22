import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const defaultFAQs: FAQItem[] = [
  {
    question: 'faq.what_is_noctua.question',
    answer: 'faq.what_is_noctua.answer',
    category: 'general'
  },
  {
    question: 'faq.how_to_observe.question',
    answer: 'faq.how_to_observe.answer',
    category: 'usage'
  },
  {
    question: 'faq.pattern_types.question',
    answer: 'faq.pattern_types.answer',
    category: 'patterns'
  },
  {
    question: 'faq.batch_processing.question',
    answer: 'faq.batch_processing.answer',
    category: 'advanced'
  },
  {
    question: 'faq.save_observations.question',
    answer: 'faq.save_observations.answer',
    category: 'usage'
  }
];

export const FAQSection: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const filteredFAQs = defaultFAQs.filter(faq => {
    const searchLower = searchQuery.toLowerCase();
    return (
      t(faq.question).toLowerCase().includes(searchLower) ||
      t(faq.answer).toLowerCase().includes(searchLower) ||
      t(`faq.categories.${faq.category}`).toLowerCase().includes(searchLower)
    );
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h2" align="center" gutterBottom>
        {t('faq.title')}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('faq.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      {filteredFAQs.length === 0 ? (
        <Typography align="center" color="text.secondary">
          {t('faq.no_results')}
        </Typography>
      ) : (
        filteredFAQs.map((faq, index) => (
          <Accordion
            key={index}
            expanded={expandedPanel === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{
              mb: 1,
              '&:before': { display: 'none' },
              boxShadow: 1,
              borderRadius: '4px !important',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                borderRadius: 1,
                '&.Mui-expanded': {
                  minHeight: 48,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            >
              <Typography>
                {t(faq.question)}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 2 }}
                >
                  {t(`faq.categories.${faq.category}`)}
                </Typography>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {t(faq.answer)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('faq.more_questions')}
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          {t('faq.contact_support')}
        </Typography>
      </Box>
    </Container>
  );
}; 