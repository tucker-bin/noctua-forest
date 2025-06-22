import React, { useState, useEffect } from 'react';
import { log } from '../../utils/logger';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Chip,
  LinearProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  Speed,
  AutoAwesome,
  AccountBalance,
  TrendingUp,
  MonetizationOn,
  Security,
  Insights
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { modelService, AIModel, UserPreferences, UserUsage } from '../../services/modelService';

export const ModelPreferences: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsData, preferencesData, usageData] = await Promise.all([
        modelService.getAvailableModels(),
        modelService.getUserPreferences().catch(() => ({ preferences: {} })),
        modelService.getUserUsage().catch(() => null)
      ]);
      
      setModels(modelsData.models);
      setPreferences(preferencesData.preferences);
      setUsage(usageData);
    } catch (error) {
      log.error('Error loading model data:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      setMessage({ type: 'error', text: 'Failed to load model preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await modelService.updateUserPreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      log.error('Error saving preferences:', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getModelIcon = (tier: string) => {
    switch (tier) {
      case 'basic': return <Speed />;
      case 'standard': return <Psychology />;
      case 'premium': return <AutoAwesome />;
      default: return <Psychology />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading AI models...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Rest of the component content */}
    </Box>
  );
}; 