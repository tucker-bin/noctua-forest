import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const AnalysisContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'rgba(26, 37, 71, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(3),
}));

const RhymeGroup = styled(motion.div)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'rgba(43, 58, 103, 0.5)',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid rgba(255, 215, 0, 0.1)',
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

interface RhymeAnalysisProps {
  analysis: {
    rhymeGroups: Array<{
      pattern: string;
      lines: string[];
    }>;
    summary: string;
  };
}

export const RhymeAnalysis: React.FC<RhymeAnalysisProps> = ({ analysis }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnalysisContainer elevation={3}>
        <Typography
          variant="h5"
          sx={{
            color: 'secondary.main',
            fontFamily: '"Space Grotesk", sans-serif',
            marginBottom: 2,
          }}
        >
          Rhyme Patterns Discovered
        </Typography>

        {analysis.rhymeGroups.map((group, index) => (
          <RhymeGroup
            key={index}
            variants={itemVariants}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: 'secondary.main',
                fontFamily: '"Space Grotesk", sans-serif',
                marginBottom: 1,
              }}
            >
              Pattern: {group.pattern}
            </Typography>
            {group.lines.map((line, lineIndex) => (
              <Typography
                key={lineIndex}
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  marginLeft: 2,
                  marginBottom: 0.5,
                }}
              >
                {line}
              </Typography>
            ))}
          </RhymeGroup>
        ))}

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          sx={{ marginTop: 3 }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              fontFamily: '"Inter", sans-serif',
              fontStyle: 'italic',
            }}
          >
            {analysis.summary}
          </Typography>
        </Box>
      </AnalysisContainer>
    </motion.div>
  );
}; 