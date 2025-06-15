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
  Person as PersonIcon,
  Feedback as FeedbackIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import type { TokenConfig, RegionalPricing } from '../contexts/UsageContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { formatDate } from '../utils/localeFormat';
import { useTranslation } from 'react-i18next';

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

interface AdminDashboardProps {
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  tokenBalance: number;
  isAdmin?: boolean;
  newsletterSubscription?: { subscribed: boolean } | boolean;
}

interface FeedbackItem {
  id: string;
  message: string;
  timestamp: string;
  userId?: string;
  type?: string;
  email?: string;
  comment?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokenValues, setTokenValues] = useState<{ [uid: string]: number }>({});
  const [updatingTokens, setUpdatingTokens] = useState<string | null>(null);
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    batchSize: 3000,
    baseCost: 1,
    batchCost: 0.5,
    bulkDiscount: 0.1,
    regionalPricing: {
      'US': { tokenMultiplier: 1, currency: 'USD', exchangeRate: 1 },
      'GB': { tokenMultiplier: 1, currency: 'GBP', exchangeRate: 0.79 },
      'EU': { tokenMultiplier: 0.9, currency: 'EUR', exchangeRate: 0.92 },
      'IN': { tokenMultiplier: 0.5, currency: 'INR', exchangeRate: 83.12 },
    },
    cooldownSeconds: 20
  });
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [newRegion, setNewRegion] = useState({ code: '', multiplier: 1, currency: 'USD', exchangeRate: 1 });

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

  useEffect(() => {
    const fetchTokenConfig = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'admin', 'tokenConfig'));
        if (configDoc.exists()) {
          setTokenConfig(configDoc.data() as TokenConfig);
        }
      } catch (err) {
        console.error('Failed to fetch token config:', err);
      }
    };
    fetchTokenConfig();
  }, []);

  const handleConfigUpdate = async () => {
    // TODO: Fix Firebase type issue
    // await updateDoc(doc(db, 'admin', 'tokenConfig'), tokenConfig);
    console.log('Would update token config:', tokenConfig);
    setIsEditingConfig(false);
  };

  const handleAddRegion = () => {
    if (!newRegion.code) return;
    setTokenConfig(prev => ({
      ...prev,
      regionalPricing: {
        ...prev.regionalPricing,
        [newRegion.code]: {
          tokenMultiplier: newRegion.multiplier,
          currency: newRegion.currency,
          exchangeRate: newRegion.exchangeRate
        }
      }
    }));
    setNewRegion({ code: '', multiplier: 1, currency: 'USD', exchangeRate: 1 });
  };

  const handleRemoveRegion = (code: string) => {
    setTokenConfig(prev => {
      const newPricing = { ...prev.regionalPricing };
      delete newPricing[code];
      return { ...prev, regionalPricing: newPricing };
    });
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
                      {user.newsletterSubscription ? (
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

      <div className="space-y-6">
        {/* Token Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Token Configuration</h3>
            <button
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isEditingConfig ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditingConfig ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Size</label>
                  <input
                    type="number"
                    value={tokenConfig.batchSize}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Cost</label>
                  <input
                    type="number"
                    value={tokenConfig.baseCost}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, baseCost: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Cost</label>
                  <input
                    type="number"
                    value={tokenConfig.batchCost}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, batchCost: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bulk Discount (%)</label>
                  <input
                    type="number"
                    value={tokenConfig.bulkDiscount * 100}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, bulkDiscount: parseFloat(e.target.value) / 100 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cooldown Duration (seconds)</label>
                  <input
                    type="number"
                    value={tokenConfig.cooldownSeconds || 20}
                    onChange={(e) => setTokenConfig(prev => ({ ...prev, cooldownSeconds: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Regional Pricing</h4>
                <div className="space-y-2">
                  {Object.entries(tokenConfig.regionalPricing).map(([code, pricing]) => (
                    <div key={code} className="flex items-center gap-2">
                      <span className="font-medium">{code}:</span>
                      <input
                        type="number"
                        value={pricing.tokenMultiplier}
                        onChange={(e) => setTokenConfig(prev => ({
                          ...prev,
                          regionalPricing: {
                            ...prev.regionalPricing,
                            [code]: { ...pricing, tokenMultiplier: parseFloat(e.target.value) }
                          }
                        }))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={pricing.currency}
                        onChange={(e) => setTokenConfig(prev => ({
                          ...prev,
                          regionalPricing: {
                            ...prev.regionalPricing,
                            [code]: { ...pricing, currency: e.target.value }
                          }
                        }))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleRemoveRegion(code)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Country Code"
                    value={newRegion.code}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Multiplier"
                    value={newRegion.multiplier}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, multiplier: parseFloat(e.target.value) }))}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Currency"
                    value={newRegion.currency}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Exchange Rate"
                    value={newRegion.exchangeRate}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) }))}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddRegion}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Region
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleConfigUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Batch Size</p>
                <p className="font-medium">{tokenConfig.batchSize} characters</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Cost</p>
                <p className="font-medium">{tokenConfig.baseCost} tokens</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Batch Cost</p>
                <p className="font-medium">{tokenConfig.batchCost} tokens</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bulk Discount</p>
                <p className="font-medium">{tokenConfig.bulkDiscount * 100}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-2">Regional Pricing</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(tokenConfig.regionalPricing).map(([code, pricing]) => (
                    <div key={code} className="flex items-center gap-2">
                      <span className="font-medium">{code}:</span>
                      <span>{pricing.tokenMultiplier}x ({pricing.currency})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default AdminDashboard; 