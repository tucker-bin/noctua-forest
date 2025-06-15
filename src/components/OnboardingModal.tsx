import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { RhymeOwl } from './RhymeOwl';
import { useTranslation } from 'react-i18next';

const ONBOARDING_STEPS = [
  {
    titleKey: 'welcome_title',
    messageKey: 'welcome_message',
    owlMessageKey: 'welcome_owl_message',
  },
  {
    titleKey: 'toolkit_title',
    messageKey: 'toolkit_message',
    owlMessageKey: 'toolkit_owl_message',
  },
  {
    titleKey: 'path_title',
    messageKey: 'path_message',
    owlMessageKey: 'path_owl_message',
  },
  {
    titleKey: 'journey_title',
    messageKey: 'journey_message',
    owlMessageKey: 'journey_owl_message',
  },
];

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const FloatingStar: React.FC<{ delay: number; size: number; x: number; y: number }> = ({ delay, size, x, y }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
      y: [0, -10, 0],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)',
      borderRadius: '50%',
      pointerEvents: 'none',
    }}
  />
);

const CosmicDust: React.FC = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    {[...Array(8)].map((_, i) => (
      <FloatingStar
        key={i}
        delay={i * 0.3}
        size={Math.random() * 4 + 2}
        x={Math.random() * 100}
        y={Math.random() * 100}
      />
    ))}
  </Box>
);

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    dataProcessing: false,
  });
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === ONBOARDING_STEPS.length - 1) {
      // Show consent step
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - check consents and close
      if (consents.terms && consents.privacy && consents.dataProcessing) {
        onClose();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConsentChange = (type: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const allConsentsGiven = consents.terms && consents.privacy && consents.dataProcessing;
  const isConsentStep = currentStep === ONBOARDING_STEPS.length;
  const currentStepData = currentStep < ONBOARDING_STEPS.length ? ONBOARDING_STEPS[currentStep] : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2b3a67 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }
      }}
    >
      <CosmicDust />
      
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 3 }}>
          {/* Stepper */}
          <Stepper 
            activeStep={currentStep} 
            alternativeLabel 
            sx={{ mb: 4 }}
          >
            {[...ONBOARDING_STEPS, { titleKey: 'consent_title' }].map((step, index) => (
              <Step key={index}>
                <StepLabel 
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      color: 'white',
                    },
                    '& .MuiStepLabel-label.Mui-completed': {
                      color: 'rgba(255, 215, 0, 0.8)',
                    },
                  }}
                >
                  {t(step.titleKey)}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {!isConsentStep ? (
                <Box sx={{ textAlign: 'center', minHeight: 300 }}>
                  {/* Noctua Mascot */}
                  <Box sx={{ mb: 3 }}>
                    <RhymeOwl size={120} />
                  </Box>

                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 700,
                      color: 'secondary.main',
                      fontFamily: '"Space Grotesk", sans-serif',
                    }}
                  >
                    {t(currentStepData!.titleKey)}
                  </Typography>

                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 3,
                      color: 'rgba(255, 255, 255, 0.9)',
                      maxWidth: 600,
                      mx: 'auto',
                    }}
                  >
                    {t(currentStepData!.messageKey)}
                  </Typography>

                  {/* Owl's message bubble */}
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      maxWidth: 500,
                      mx: 'auto',
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '10px solid rgba(255, 215, 0, 0.3)',
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontStyle: 'italic',
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      "{t(currentStepData!.owlMessageKey)}"
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                <Box sx={{ minHeight: 300 }}>
                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 700,
                      color: 'secondary.main',
                      fontFamily: '"Space Grotesk", sans-serif',
                      textAlign: 'center',
                      mb: 4,
                    }}
                  >
                    {t('consent_title', 'Before We Begin')}
                  </Typography>

                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 3,
                      color: 'rgba(255, 255, 255, 0.9)',
                      textAlign: 'center',
                    }}
                  >
                    {t('consent_message', 'Please review and accept our policies to continue')}
                  </Typography>

                  <FormGroup sx={{ maxWidth: 500, mx: 'auto' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={consents.terms}
                          onChange={() => handleConsentChange('terms')}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      }
                      label={t('consent_terms', 'I accept the Terms of Service')}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={consents.privacy}
                          onChange={() => handleConsentChange('privacy')}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      }
                      label={t('consent_privacy', 'I accept the Privacy Policy')}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={consents.dataProcessing}
                          onChange={() => handleConsentChange('dataProcessing')}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        />
                      }
                      label={t('consent_data', 'I consent to data processing for service improvement')}
                    />
                  </FormGroup>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {t('back', 'Back')}
            </Button>
            
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isConsentStep && !allConsentsGiven}
              sx={{
                backgroundColor: 'secondary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'secondary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 215, 0, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {isConsentStep 
                ? t('finish', 'Start Your Journey') 
                : currentStep === ONBOARDING_STEPS.length - 1 
                  ? t('continue', 'Continue')
                  : t('next', 'Next')
              }
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 