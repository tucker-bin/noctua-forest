import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { updateProfile, updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useUsage } from '../contexts/UsageContext';
import type { FormEvent } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Stack,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Feedback as FeedbackIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

interface AccountsPageProps {
  navigateToSubscriptionPlans: () => void;
}

const AccountsPage: React.FC<AccountsPageProps> = ({ navigateToSubscriptionPlans }) => {
  const authCtx = useContext(AuthContext);
  const { usageInfo } = useUsage();
  const currentUser = authCtx?.currentUser;

  const [displayName, setDisplayName] = useState<string>(currentUser?.displayName || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');

  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [requiresReAuth, setRequiresReAuth] = useState<boolean>(false);
  const [actionToRetry, setActionToRetry] = useState<(() => Promise<void>) | null>(null);

  const [feedbackType, setFeedbackType] = useState<string>('general');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const [isSubscribedToNewsletter, setIsSubscribedToNewsletter] = useState<boolean>(false);
  const [newsletterMessage, setNewsletterMessage] = useState<string>('');
  
  const [currentUserPlan, setCurrentUserPlan] = useState<string>("Free User"); 

  const [isAdmin, setIsAdmin] = useState(false);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState<{[uid: string]: number}>({});

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        setIsAdmin(!!userDoc.exists() && !!userDoc.data()?.admin);
        // Set plan based on user data if available
        if (userDoc.exists() && userDoc.data()?.subscriptionTier) {
          setCurrentUserPlan(userDoc.data()?.subscriptionTier);
        }
      } else {
        setIsAdmin(false);
        setCurrentUserPlan('Free User');
      }
    });
    return unsubscribe;
  }, []);

  // Fetch all users and feedback for admin
  useEffect(() => {
    if (isAdmin) {
      getDocs(collection(db, 'users')).then(snapshot => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      getDocs(collection(db, 'feedback')).then(snapshot => {
        setFeedbackList(snapshot.docs.map(doc => doc.data()));
      });
    }
  }, [isAdmin]);

  const clearMessages = () => {
    setMessage(''); setError(''); setFeedbackMessage(''); setNewsletterMessage('');
  };

  const handleUpdateDisplayName = async (e: FormEvent) => {
    e.preventDefault(); clearMessages();
    if (!currentUser) return setError("No user logged in.");
    if (!displayName.trim()) return setError("Display name cannot be empty.");
    setIsLoading(true);
    try {
      await updateProfile(currentUser, { displayName });
      setMessage("Display name updated successfully!");
    } catch (err: any) { setError(err.message || "Failed to update display name."); }
    finally { setIsLoading(false); }
  };

  const attemptPasswordChange = async () => {
    clearMessages();
    if (!currentUser) return setError("No user logged in.");
    if (!newPassword) return setError("New password cannot be empty.");
    if (newPassword.length < 6) return setError("Password should be at least 6 characters.");
    setIsLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      setMessage("Password changed successfully!"); setNewPassword(''); setCurrentPassword(''); setRequiresReAuth(false);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError("Re-authentication needed for password change."); setRequiresReAuth(true); setActionToRetry(() => attemptPasswordChange);
      } else { setError(err.message || "Failed to change password."); }
    } finally { setIsLoading(false); }
  };
  const handleChangePassword = (e: FormEvent) => { e.preventDefault(); attemptPasswordChange(); };

  const attemptDeleteAccount = async () => {
    clearMessages();
    if (!currentUser) return setError("No user logged in.");
    if (!window.confirm("Are you sure? This is permanent.")) return;
    setIsLoading(true);
    try {
      await deleteUser(currentUser); setMessage("Account deleted successfully.");
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError("Re-authentication needed for account deletion."); setRequiresReAuth(true); setActionToRetry(() => attemptDeleteAccount);
      } else { setError(err.message || "Failed to delete account."); }
    } finally { setIsLoading(false); }
  };
  const handleDeleteAccount = () => attemptDeleteAccount();

  const handleReauthenticate = async (e: FormEvent) => {
    e.preventDefault(); clearMessages();
    if (!currentUser || !currentUser.email) return setError("User/email not found.");
    if (!currentPassword) return setError("Please enter current password.");
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      setMessage("Re-authentication successful. Please try your action again.");
      setRequiresReAuth(false); setCurrentPassword('');
      if (actionToRetry) { await actionToRetry(); setActionToRetry(null); }
    } catch (err: any) { setError(err.message || "Re-authentication failed."); }
    finally { setIsLoading(false); }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault(); clearMessages();
    if (!feedbackComment.trim()) return setFeedbackMessage("Feedback comment cannot be empty.");
    setIsLoading(true);
    try {
      if (currentUser) {
        await setDoc(doc(db, `feedback/${currentUser.uid}_${Date.now()}`), {
            userId: currentUser.uid, email: currentUser.email, type: feedbackType,
            comment: feedbackComment, submittedAt: serverTimestamp()
        });
      }
      setFeedbackMessage("Thank you for your feedback!"); setFeedbackComment(''); setFeedbackType('general');
    } catch (err:any) { setFeedbackMessage("Failed to submit feedback: " + err.message); }
    finally { setIsLoading(false); }
  };

  const handleNewsletterToggle = async () => {
    clearMessages(); if (!currentUser) return setNewsletterMessage("Please log in.");
    setIsLoading(true); const newStatus = !isSubscribedToNewsletter;
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { newsletterSubscription: { subscribed: newStatus, lastUpdated: serverTimestamp() } }, { merge: true });
      setIsSubscribedToNewsletter(newStatus);
      setNewsletterMessage(newStatus ? "Subscribed!" : "Unsubscribed.");
    } catch (err: any) { setNewsletterMessage("Failed to update preference: " + err.message); }
    finally { setIsLoading(false); }
  };

  // Admin: Give Free Tokens
  const handleGiveFreeTokens = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        tokenBalance: (usageInfo?.tokenBalance || 0) + 100,
        lastTokenUpdate: serverTimestamp(),
      });
      setMessage('100 free tokens added!');
    } catch (err: any) {
      setError('Failed to add tokens: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTokens = async (uid: string) => {
    setResetLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { tokenBalance: resetValue[uid] || 0, lastTokenUpdate: serverTimestamp() });
      setMessage('Token balance reset!');
      // Refresh users
      const snapshot = await getDocs(collection(db, 'users'));
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError('Failed to reset tokens: ' + (err.message || 'Unknown error'));
    } finally {
      setResetLoading(null);
    }
  };

  if (!currentUser) return <div className="container mt-5"><p className="text-danger">You must be logged in.</p></div>;
  if (currentUser.isAnonymous) return <div className="container mt-5"><div className="alert alert-warning">Account management is not available for anonymous users.</div></div>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon /> Account Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Email:</strong> {currentUser.email}
            </Typography>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Current Subscription</Typography>
              <Typography variant="h5" color="primary" sx={{ mb: 1 }}>{currentUserPlan}</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={navigateToSubscriptionPlans}
                startIcon={<SecurityIcon />}
              >
                View Plans & Upgrade
              </Button>
            </Box>
          </CardContent>
        </Card>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {requiresReAuth && (
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Re-authentication Required
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your current password to continue.
              </Typography>
              <form onSubmit={handleReauthenticate}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Re-authenticate'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon /> Security Settings
            </Typography>
            <Stack spacing={3}>
              <form onSubmit={handleUpdateDisplayName}>
                <Typography variant="h6" gutterBottom>Update Display Name</Typography>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || !displayName.trim()}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Name'}
                </Button>
              </form>

              <Divider />

              <form onSubmit={handleChangePassword}>
                <Typography variant="h6" gutterBottom>Change Password</Typography>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || !newPassword.trim()}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Set New Password'}
                </Button>
              </form>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon /> Analysis History
            </Typography>
            <Alert severity="info">
              Your past analysis results will appear here soon. (Feature in development)
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FeedbackIcon /> Submit Feedback
            </Typography>
            {feedbackMessage && (
              <Alert severity={feedbackMessage.startsWith("Failed") ? "error" : "success"} sx={{ mb: 2 }}>
                {feedbackMessage}
              </Alert>
            )}
            <form onSubmit={handleFeedbackSubmit}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Feedback Type</InputLabel>
                <Select
                  value={feedbackType}
                  label="Feedback Type"
                  onChange={(e) => setFeedbackType(e.target.value)}
                >
                  <MenuItem value="general">General Comment</MenuItem>
                  <MenuItem value="bug">Bug Report</MenuItem>
                  <MenuItem value="feature">Feature Suggestion</MenuItem>
                  <MenuItem value="accuracy">Analysis Accuracy</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !feedbackComment.trim()}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon /> Newsletter
            </Typography>
            {newsletterMessage && (
              <Alert severity={newsletterMessage.startsWith("Failed") ? "error" : "success"} sx={{ mb: 2 }}>
                {newsletterMessage}
              </Alert>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSubscribedToNewsletter}
                  onChange={handleNewsletterToggle}
                  disabled={isLoading}
                />
              }
              label="Subscribe to newsletter"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeleteIcon /> Advanced Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Be careful with actions in this section.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              disabled={isLoading}
              startIcon={<DeleteIcon />}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Delete My Account'}
            </Button>
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              This action is irreversible.
            </Typography>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminIcon /> Admin Tools
              </Typography>
              <Button
                variant="contained"
                color="success"
                onClick={handleGiveFreeTokens}
                disabled={isLoading}
                sx={{ mb: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Give Free Tokens (+100)'}
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default AccountsPage;
