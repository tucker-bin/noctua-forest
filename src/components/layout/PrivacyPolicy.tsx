import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Link,
  Divider
} from '@mui/material';
import { ExpandMore, Security, Cookie, Analytics, PersonalVideo, Email } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            <Security sx={{ mr: 2, verticalAlign: 'middle' }} />
            {t('privacy_policy.title', 'Privacy Policy')}
          </Typography>
          
          <Box display="flex" gap={1} mb={2}>
            <Chip label={t('privacy_policy.last_updated', 'Updated: January 2024')} color="default" />
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            {t('privacy_policy.effective_date', 'Effective Date: January 1, 2024')}
          </Typography>
        </Box>

        {/* Introduction */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            {t('privacy_policy.intro', 
              'At Noctua Forest, we are committed to protecting your privacy and ensuring transparency about how we collect, use, and protect your personal information. This policy explains your rights under GDPR and other privacy regulations.'
            )}
          </Typography>
        </Alert>

        {/* Data Controller Information */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.controller.title', '1. Data Controller')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.controller.description', 
                'Noctua Forest is the data controller for your personal information. You can contact us regarding privacy matters at:'
              )}
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                Email: privacy@noctuaforest.com<br/>
                Address: [Your Business Address]<br/>
                Data Protection Officer: dpo@noctuaforest.com
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Information We Collect */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.collection.title', '2. Information We Collect')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle1" gutterBottom>
              <PersonalVideo sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('privacy_policy.collection.personal_info', 'Personal Information')}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.email', '• Email address (for account creation and communication)')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.profile', '• Profile information (name, language preferences)')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.progress', '• Learning progress and achievements')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.observations', '• Pattern observations and text analyses')} />
              </ListItem>
            </List>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('privacy_policy.collection.usage_info', 'Usage Information')}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.device', '• Device information and browser type')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.usage_patterns', '• App usage patterns and feature interactions')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.performance', '• Performance metrics and error logs')} />
              </ListItem>
            </List>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              <Cookie sx={{ mr: 1, verticalAlign: 'middle' }} />
              {t('privacy_policy.collection.cookies', 'Cookies and Tracking')}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.necessary_cookies', '• Necessary cookies for authentication and security')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.analytics_cookies', '• Analytics cookies (with your consent)')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.collection.preference_cookies', '• Preference cookies for personalization')} />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Legal Basis for Processing */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.legal_basis.title', '3. Legal Basis for Processing')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.legal_basis.description', 
                'Under GDPR, we process your personal data based on the following legal grounds:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.legal_basis.contract', 'Contract Performance')}
                  secondary={t('privacy_policy.legal_basis.contract_desc', 'To provide our services and fulfill our obligations to you')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.legal_basis.consent', 'Consent')}
                  secondary={t('privacy_policy.legal_basis.consent_desc', 'For analytics, marketing, and non-essential features (you can withdraw consent anytime)')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.legal_basis.legitimate_interest', 'Legitimate Interest')}
                  secondary={t('privacy_policy.legal_basis.legitimate_interest_desc', 'To improve our services, prevent fraud, and ensure security')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.legal_basis.legal_obligation', 'Legal Obligation')}
                  secondary={t('privacy_policy.legal_basis.legal_obligation_desc', 'To comply with applicable laws and regulations')}
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Your Rights Under GDPR */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.rights.title', '4. Your Rights Under GDPR')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.rights.description', 
                'You have the following rights regarding your personal data:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.access', 'Right of Access')}
                  secondary={t('privacy_policy.rights.access_desc', 'Request a copy of your personal data')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.rectification', 'Right to Rectification')}
                  secondary={t('privacy_policy.rights.rectification_desc', 'Correct inaccurate or incomplete data')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.erasure', 'Right to Erasure')}
                  secondary={t('privacy_policy.rights.erasure_desc', 'Request deletion of your personal data')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.portability', 'Right to Data Portability')}
                  secondary={t('privacy_policy.rights.portability_desc', 'Receive your data in a structured, machine-readable format')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.restrict', 'Right to Restrict Processing')}
                  secondary={t('privacy_policy.rights.restrict_desc', 'Limit how we process your data')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.object', 'Right to Object')}
                  secondary={t('privacy_policy.rights.object_desc', 'Object to processing based on legitimate interests')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.rights.withdraw_consent', 'Right to Withdraw Consent')}
                  secondary={t('privacy_policy.rights.withdraw_consent_desc', 'Withdraw consent for processing at any time')}
                />
              </ListItem>
            </List>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {t('privacy_policy.rights.exercise', 
                  'To exercise these rights, visit your Privacy Center in the app or contact us at privacy@noctuaforest.com'
                )}
              </Typography>
            </Alert>
          </AccordionDetails>
        </Accordion>

        {/* Data Sharing and Transfers */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.sharing.title', '5. Data Sharing and International Transfers')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.sharing.description', 
                'We do not sell your personal data. We may share data with:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.sharing.service_providers', 'Service Providers')}
                  secondary={t('privacy_policy.sharing.service_providers_desc', 'Third-party services that help us operate (Firebase, Google Cloud, analytics providers)')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.sharing.legal', 'Legal Requirements')}
                  secondary={t('privacy_policy.sharing.legal_desc', 'When required by law or to protect our rights')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.sharing.business_transfer', 'Business Transfers')}
                  secondary={t('privacy_policy.sharing.business_transfer_desc', 'In case of merger, acquisition, or sale of assets')}
                />
              </ListItem>
            </List>
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              {t('privacy_policy.sharing.international_title', 'International Transfers')}
            </Typography>
            <Typography variant="body2">
              {t('privacy_policy.sharing.international_desc', 
                'Your data may be transferred to and processed in countries outside the EEA. We ensure appropriate safeguards are in place, including Standard Contractual Clauses and adequacy decisions.'
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Data Retention */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.retention.title', '6. Data Retention')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.retention.description', 
                'We retain your personal data for as long as necessary to provide our services and comply with legal obligations:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.retention.account_data', 'Account Data')}
                  secondary={t('privacy_policy.retention.account_data_desc', 'Until you delete your account or request deletion')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.retention.usage_data', 'Usage Data')}
                  secondary={t('privacy_policy.retention.usage_data_desc', 'Up to 2 years for analytics and improvement purposes')}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={t('privacy_policy.retention.legal_data', 'Legal Compliance Data')}
                  secondary={t('privacy_policy.retention.legal_data_desc', 'As required by applicable laws (typically 6-7 years)')}
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Security Measures */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.security.title', '7. Security Measures')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.security.description', 
                'We implement appropriate technical and organizational measures to protect your personal data:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary={t('privacy_policy.security.encryption', '• End-to-end encryption for data transmission')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.security.access_controls', '• Strict access controls and authentication')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.security.monitoring', '• Regular security monitoring and audits')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.security.backups', '• Secure data backups and disaster recovery')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.security.staff_training', '• Staff training on data protection')} />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Contact Information */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.contact.title', '8. Contact Information')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.contact.description', 
                'For any privacy-related questions or to exercise your rights:'
              )}
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" paragraph>
                <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                <strong>Email:</strong> privacy@noctuaforest.com
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Data Protection Officer:</strong> dpo@noctuaforest.com
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Response Time:</strong> We will respond to your request within 30 days
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              {t('privacy_policy.contact.supervisory_authority', 'Supervisory Authority')}
            </Typography>
            <Typography variant="body2">
              {t('privacy_policy.contact.supervisory_authority_desc', 
                'You have the right to lodge a complaint with your local data protection authority if you believe we have not handled your personal data in accordance with applicable law.'
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Changes to Policy */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              {t('privacy_policy.changes.title', '9. Changes to This Policy')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              {t('privacy_policy.changes.description', 
                'We may update this privacy policy from time to time. We will notify you of any material changes by:'
              )}
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary={t('privacy_policy.changes.email', '• Email notification to registered users')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.changes.app_notice', '• In-app notification')} />
              </ListItem>
              <ListItem>
                <ListItemText primary={t('privacy_policy.changes.website', '• Prominent notice on our website')} />
              </ListItem>
            </List>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {t('privacy_policy.changes.continued_use', 
                'Your continued use of our services after any changes indicates your acceptance of the updated policy.'
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary">
            {t('privacy_policy.footer', 
              'This privacy policy was last updated on January 1, 2024. For the most current version, please visit our website.'
            )}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy; 
