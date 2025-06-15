import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationHandlerProps {
    children: React.ReactNode;
}

const NavigationHandler: React.FC<NavigationHandlerProps> = ({ children }) => {
    const navigate = useNavigate();

    const handleNavigation = (page: string) => {
        switch (page) {
            case 'analysis':
                navigate('/');
                break;
            case 'account':
                navigate('/account');
                break;
            case 'subscriptionPlans':
                navigate('/subscription-plans');
                break;
            case 'topUpTokens':
                navigate('/top-up-tokens');
                break;
            default:
                navigate('/');
        }
    };

    return (
        <>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // TODO: Fix type issue with cloneElement
                    // return React.cloneElement(child, { onNavigate: handleNavigation });
                    return child;
                }
                return child;
            })}
        </>
    );
};

export default NavigationHandler; 