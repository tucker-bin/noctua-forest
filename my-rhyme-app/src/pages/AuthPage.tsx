import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthFormComponent from '../components/AuthFormComponent';
import { useAuth } from '../contexts/AuthContext';
import { Box } from '@mui/material';

const AuthPage: React.FC = () => {
    const { login, signup } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine if it's the login or signup page from the URL
    const [isLogin, setIsLogin] = useState(location.pathname.startsWith('/login'));

    const handleSubmit = async (email: string, password: string) => {
        setError(null);
        setMessage('');
        try {
            if (isLogin) {
                await login(email, password);
                setMessage('Login successful! Redirecting...');
            } else {
                await signup(email, password);
                setMessage('Signup successful! Please check your email to verify your account.');
            }
            navigate('/observatory');
        } catch (err: unknown) {
            // handle error, optionally check if err is an Error
            setError(err instanceof Error ? err.message : 'An error occurred.');
        }
    };

    return (
        <Box>
            <AuthFormComponent
                isLogin={isLogin}
                setIsLogin={(val) => {
                    setIsLogin(val);
                    // navigate(val ? '/login' : '/signup');
                }}
                error={error}
                message={message}
                onSubmit={handleSubmit}
            />
        </Box>
    );
};

export default AuthPage; 