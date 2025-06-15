import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Modal,
    Box,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Checkbox,
    FormControlLabel,
    Link,
    IconButton,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NoctuaMascot from './NoctuaMascot';

interface OnboardingModalProps {
    onClose: () => void;
}

const steps = ['Welcome', 'Legal Agreements', 'Get Started'];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [acceptedDataProcessing, setAcceptedDataProcessing] = useState(false);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSignUp = () => {
        // TODO: Pass consent state to the signup page/logic
        onClose();
        navigate('/signup');
    };
    
    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '80%', md: 600 },
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <Modal open onClose={onClose} aria-labelledby="onboarding-modal-title">
            <Box sx={modalStyle}>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <NoctuaMascot sx={{ fontSize: 50, mr: 2, color: 'primary.main' }} />
                    <Typography id="onboarding-modal-title" variant="h4" component="h2">
                        Welcome to Noctua Forest
                    </Typography>
                </Box>
                
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Your journey into the musicality of language begins here.
                            </Typography>
                            <Typography paragraph>
                                Noctua Forest is an AI-powered tool to help you discover phonetic patterns, analyze text, and explore the hidden rhythms of words.
                            </Typography>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2}}>
                                What you'll discover in the Forest:
                            </Typography>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li><Typography>Advanced phonetic pattern detection</Typography></li>
                                <li><Typography>Real-time analysis of your text</Typography></li>
                                <li><Typography>Shareable "Observations" of your findings</Typography></li>
                                <li><Typography>A community of fellow language Artists and Observers</Typography></li>
                            </ul>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box>
                             <Typography variant="h6" gutterBottom>
                                Before you begin your exploration, a few formalities.
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                                <FormControlLabel
                                    control={<Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />}
                                    label={
                                        <Typography>
                                            I have read and agree to the{' '}
                                            <Link href="/terms" target="_blank" rel="noopener noreferrer">
                                                Terms of Service
                                            </Link>
                                            .
                                        </Typography>
                                    }
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                                <FormControlLabel
                                    control={<Checkbox checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} />}
                                    label={
                                        <Typography>
                                            I have read and agree to the{' '}
                                            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                                                Privacy Policy
                                            </Link>
                                            .
                                        </Typography>
                                    }
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                                <FormControlLabel
                                    control={<Checkbox checked={acceptedDataProcessing} onChange={(e) => setAcceptedDataProcessing(e.target.checked)} />}
                                    label={
                                        <Typography>
                                            I consent to the processing of my data as described in the{' '}
                                            <Link href="/privacy#data-processing" target="_blank" rel="noopener noreferrer">
                                                Data Processing Agreement
                                            </Link>
                                            .
                                        </Typography>
                                    }
                                />
                            </Paper>
                             <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                                We respect your privacy and are committed to protecting your personal data. You can review our policies anytime.
                            </Typography>
                        </Box>
                    )}

                    {activeStep === 2 && (
                         <Box>
                            <Typography variant="h6" gutterBottom>
                                You're all set!
                            </Typography>
                            <Typography paragraph>
                                Create an account or log in to start making Observations, track your usage, and join the Forest community.
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                 <Button onClick={handleSignUp} variant="contained" fullWidth>
                                    Create a New Account
                                 </Button>
                                 <Button onClick={handleLogin} variant="outlined" fullWidth>
                                    I already have an account (Log In)
                                 </Button>
                            </Paper>
                        </Box>
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt: 'auto' }}>
                    <Button
                        color="inherit"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Back
                    </Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    {activeStep < steps.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(activeStep === 1 && (!acceptedTerms || !acceptedPrivacy || !acceptedDataProcessing))}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={onClose}>
                            Finish
                        </Button>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default OnboardingModal;
