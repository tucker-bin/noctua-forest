import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

// Lazy load components
const Analysis = React.lazy(() => import('./pages/Analysis'));
const AuthFormComponent = React.lazy(() => import('./components/AuthFormComponent'));
const AccountsPage = React.lazy(() => import('./pages/AccountsPage'));
const SubscriptionPlansPage = React.lazy(() => import('./pages/SubscriptionPlansPage'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));

const AppRoutes: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState("");

  const handleAuth = async (email: string, password: string) => {
    setAuthError(null);
    setAuthMessage("");
    try {
      if (isLogin) {
        await authCtx?.login(email, password);
      } else {
        await authCtx?.signup(email, password);
        setAuthMessage("Sign up successful!");
        setIsLogin(true);
      }
      navigate('/');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Analysis />} />
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <AuthFormComponent
                isLogin={isLogin}
                setIsLogin={setIsLogin}
                error={authError}
                message={authMessage}
                onSubmit={handleAuth}
              />
            )
          }
        />
        <Route
          path="/account"
          element={currentUser ? <AccountsPage navigateToSubscriptionPlans={() => navigate('/subscription')} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription"
          element={currentUser ? <SubscriptionPlansPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={currentUser && authCtx?.isAdmin ? <Admin /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes; 