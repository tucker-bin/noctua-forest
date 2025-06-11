import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Token as TokenIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokenValues, setTokenValues] = useState<{ [uid: string]: number }>({});
  const [updatingTokens, setUpdatingTokens] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch('/api/admin/check', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          
          if (data.isAdmin) {
            // Fetch initial data
            fetchUsers(idToken);
            fetchFeedback(idToken);
          }
        }
      } catch (err) {
        console.error('Failed to check admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const fetchFeedback = async (token: string) => {
    try {
      const response = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (err) {
      setError('Failed to fetch feedback');
    }
  };

  const handleRefresh = async () => {
    if (!currentUser) return;
    const token = await currentUser.getIdToken();
    setError(null);
    fetchUsers(token);
    fetchFeedback(token);
  };

  const handleUpdateTokens = async (uid: string) => {
    if (!currentUser || !tokenValues[uid]) return;
    
    setUpdatingTokens(uid);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({
          uid,
          tokenBalance: tokenValues[uid],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tokens');
      }

      // Refresh users
      const token = await currentUser.getIdToken();
      await fetchUsers(token);
      
      // Clear the input
      setTokenValues({ ...tokenValues, [uid]: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tokens');
    } finally {
      setUpdatingTokens(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Alert severity="error">
        You do not have permission to access this dashboard.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`Users (${users.length})`} />
            <Tab label={`Feedback (${feedback.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>UID</TableCell>
                  <TableCell>Token Balance</TableCell>
                  <TableCell>Newsletter</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email || 'Anonymous'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {user.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.tokenBalance || 0}</TableCell>
                    <TableCell>
                      {user.newsletterSubscription?.subscribed ? (
                        <Chip label="Subscribed" color="success" size="small" />
                      ) : (
                        <Chip label="Not subscribed" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          size="small"
                          placeholder="Tokens"
                          value={tokenValues[user.id] || ''}
                          onChange={(e) => setTokenValues({
                            ...tokenValues,
                            [user.id]: parseInt(e.target.value) || 0,
                          })}
                          sx={{ width: 100 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<TokenIcon />}
                          onClick={() => handleUpdateTokens(user.id)}
                          disabled={!tokenValues[user.id] || updatingTokens === user.id}
                        >
                          {updatingTokens === user.id ? <CircularProgress size={20} /> : 'Set'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Chip
                        label={item.type}
                        size="small"
                        color={
                          item.type === 'bug' ? 'error' :
                          item.type === 'feature' ? 'info' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{item.email || 'Anonymous'}</TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {item.comment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminDashboard; 