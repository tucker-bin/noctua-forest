import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const OwlContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100px',
  height: '100px',
  margin: '0 auto',
}));

const SpeechBubble = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  bottom: '110px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(26, 37, 71, 0.9)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(1.5, 2),
  borderRadius: '16px',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
  width: '280px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '10px solid rgba(26, 37, 71, 0.9)',
  },
}));

interface RhymeOwlProps {
  message?: string;
  isAnalyzing?: boolean;
}

export const RhymeOwl: React.FC<RhymeOwlProps> = ({ message, isAnalyzing = false }) => {
  const owlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAnalyzing && owlRef.current) {
      // Add telescope animation when analyzing
      owlRef.current.style.transform = 'rotate(-15deg)';
      setTimeout(() => {
        if (owlRef.current) {
          owlRef.current.style.transform = 'rotate(0deg)';
        }
      }, 1000);
    }
  }, [isAnalyzing]);

  return (
    <OwlContainer>
      <AnimatePresence>
        {message && (
          <SpeechBubble
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'secondary.main',
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {message}
            </Typography>
          </SpeechBubble>
        )}
      </AnimatePresence>
      
      <motion.div
        ref={owlRef}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <Box
          component="img"
          src="/owl-astronomer.svg"
          alt="Rhyme Owl"
          sx={{
            width: '100%',
            height: 'auto',
            filter: isAnalyzing ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </motion.div>
    </OwlContainer>
  );
}; 