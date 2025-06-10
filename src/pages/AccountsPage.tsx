import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, Button } from '@mui/material';

const AccountsPage: React.FC<AccountsPageProps> = ({ navigateToSubscriptionPlans }) => {
    const [message, setMessage] = useState('');

    const handleResetOnboarding = () => {
        localStorage.removeItem('hasSeenOnboarding');
        setMessage("Onboarding has been reset. It will show again on your next visit.");
    };

    return (
        <Container maxWidth="md">
            {/* ... existing JSX ... */}
            
            {/* Add this section after other account settings */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Developer Options
                    </Typography>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleResetOnboarding}
                        sx={{ mt: 1 }}
                    >
                        Reset Onboarding
                    </Button>
                </CardContent>
            </Card>
            
            {/* ... rest of existing JSX ... */}
        </Container>
    );
};

export default AccountsPage; 