import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';

interface OnboardingModalProps {
    open: boolean;
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="onboarding-modal-title"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
            }}>
                <Typography id="onboarding-modal-title" variant="h6" component="h2" gutterBottom>
                    Welcome to My Rhyme App!
                </Typography>
                <Typography variant="body1" paragraph>
                    This app helps you analyze rhymes and patterns in your text. Here's what you can do:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                    <li>Enter text to analyze its rhyme patterns</li>
                    <li>View detailed analysis of rhyming words</li>
                    <li>Track your usage and manage your tokens</li>
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} variant="contained" color="primary">
                        Get Started
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default OnboardingModal; 