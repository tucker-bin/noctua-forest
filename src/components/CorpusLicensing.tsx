import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Science as ResearchIcon,
  Business as BusinessIcon,
  School as EducationIcon,
  Api as ApiIcon,
  Dataset as DataIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

interface CorpusLicense {
  id: string;
  name: string;
  price: number;
  type: 'research' | 'commercial' | 'education' | 'api';
  features: string[];
  description: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const CORPUS_LICENSES: CorpusLicense[] = [
  {
    id: 'research_basic',
    name: 'Academic Research',
    price: 99,
    type: 'research',
    description: 'Access to linguistic pattern database for academic research',
    icon: <ResearchIcon />,
    features: [
      'Full Observatory pattern database',
      '500K+ analyzed texts',
      'Cross-linguistic pattern data',
      'Research attribution required',
      'Non-commercial use only'
    ]
  },
  {
    id: 'api_professional',
    name: 'API Professional',
    price: 299,
    type: 'api',
    description: 'Real-time linguistic analysis API for applications',
    icon: <ApiIcon />,
    popular: true,
    features: [
      '10,000 API calls/month',
      'Real-time pattern analysis',
      'Multi-language support',
      'Cultural context analysis',
      'Custom model training',
      '99.9% uptime SLA'
    ]
  },
  {
    id: 'education_institutional',
    name: 'Educational License',
    price: 199,
    type: 'education',
    description: 'Classroom and curriculum integration license',
    icon: <EducationIcon />,
    features: [
      'Unlimited student access',
      'Curriculum integration tools',
      'Teacher dashboard',
      'Assignment analytics',
      'Bulk analysis features'
    ]
  },
  {
    id: 'commercial_enterprise',
    name: 'Enterprise Data',
    price: 999,
    type: 'commercial',
    description: 'Commercial licensing for content analysis and AI training',
    icon: <BusinessIcon />,
    features: [
      'Complete linguistic corpus',
      'Custom analysis models',
      'Bulk data exports',
      'Commercial use rights',
      'Priority support',
      'Custom integrations'
    ]
  }
];

export const CorpusLicensing: React.FC = () => {
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);

  const handleLicensePurchase = (license: CorpusLicense) => {
    setSelectedLicense(license.id);
    // Integrate with existing payment system
    console.log('Purchasing corpus license:', license);
  };

  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 700 }}>
        Linguistic Corpus Licensing
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Monetize your research with our comprehensive linguistic pattern database
      </Typography>

      <Grid container spacing={4}>
        {CORPUS_LICENSES.map((license) => (
          <Grid item xs={12} md={6} lg={3} key={license.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                border: license.popular ? '2px solid' : '1px solid',
                borderColor: license.popular ? 'primary.main' : 'grey.300',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {license.popular && (
                <Chip 
                  label="Most Popular" 
                  color="primary" 
                  size="small"
                  sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {license.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    {license.name}
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    ${license.price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {license.description}
                  </Typography>
                </Box>

                <List dense sx={{ flexGrow: 1 }}>
                  {license.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <DataIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant={license.popular ? "contained" : "outlined"}
                  size="large"
                  onClick={() => handleLicensePurchase(license)}
                  sx={{ mt: 2, fontWeight: 600 }}
                >
                  License Access
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Corpus Statistics */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
          Observatory Corpus Statistics
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                2.4M+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Analyzed Texts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                847K+
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Unique Patterns
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                23
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Languages
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main" fontWeight={700}>
                99.2%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Accuracy Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 