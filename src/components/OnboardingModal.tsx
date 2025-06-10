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
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { RhymeOwl } from './RhymeOwl';

interface OnboardingStep {
  title: string;
  message: string;
  owlMessage: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to the Rhyme Observatory",
    message: "As a Poetic Astronomer, you'll discover the hidden patterns in lyrics and poetry, guided by the wisdom of the Rhyme Owl.",
    owlMessage: "Greetings, fellow astronomer! I'll be your guide through the cosmic patterns of rhyme and rhythm.",
  },
  {
    title: "Your Cosmic Toolkit",
    message: "Use your tokens to analyze texts and uncover their hidden patterns. Each analysis reveals new insights into the cosmic dance of words.",
    owlMessage: "Tokens are your telescope to the stars of rhyme. Use them wisely to explore the patterns in your favorite lyrics.",
  },
  {
    title: "Choose Your Path",
    message: "Start with the free tier to explore basic patterns, or upgrade to unlock advanced features and deeper insights.",
    owlMessage: "Every astronomer starts their journey somewhere. Choose the path that best suits your exploration needs.",
  },
  {
    title: "Begin Your Journey",
    message: "Ready to explore the cosmic patterns of rhyme? Let's start analyzing your first text!",
    owlMessage: "The stars of rhyme await your discovery. Shall we begin our exploration?",
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(26, 37, 71, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'secondary.main',
            zIndex: 1,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'rotate(90deg)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4,
            minHeight: 400,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CosmicDust />

          {/* Enhanced cosmic background effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 50% 50%, rgba(43, 58, 103, 0.2) 0%, transparent 70%),
                radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none',
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                      color: 'secondary.main',
                      fontFamily: '"Space Grotesk", sans-serif',
                      mb: 2,
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
                    }}
                  >
                    {currentStepData.title}
                  </Typography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      maxWidth: 600,
                      mx: 'auto',
                      lineHeight: 1.6,
                    }}
                  >
                    {currentStepData.message}
                  </Typography>
                </motion.div>
              </Box>

              <Box sx={{ mb: 4 }}>
                <motion.div
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <RhymeOwl message={currentStepData.owlMessage} />
                </motion.div>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: 400,
                  mt: 'auto',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    sx={{
                      color: 'secondary.main',
                      visibility: currentStep === 0 ? 'hidden' : 'visible',
                      '&:hover': {
                        transform: 'translateX(-2px)',
                      },
                      transition: 'transform 0.2s',
                    }}
                  >
                    Back
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleNext}
                    sx={{
                      minWidth: 120,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    {currentStep === ONBOARDING_STEPS.length - 1 ? 'Begin' : 'Next'}
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal; 