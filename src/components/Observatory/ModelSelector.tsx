import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Info,
  Speed,
  AccountBalance,
  Psychology,
  AutoAwesome,
  TrendingUp,
  MonetizationOn
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { modelService, AIModel, CostEstimate } from '../../services/modelService';
import { log } from '../../utils/logger';

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange: (modelId: string) => void;
  text: string;
  language: string;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  text,
  language,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        
        log.info('Loading available models');
        
        const data = await modelService.getAvailableModels();
        setModels(data.models || []);
        
        if (data.defaultModel && !selectedModel) {
          onModelChange?.(data.defaultModel);
        }
        
        log.info('Models loaded successfully', { 
          modelCount: data.models?.length || 0,
          defaultModel: data.defaultModel 
        });
        
      } catch (err) {
        log.error('Failed to load available models', {
          error: err instanceof Error ? err.message : String(err)
        }, err instanceof Error ? err : undefined);
        
        setError('Failed to load available models');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [selectedModel, onModelChange]);

  useEffect(() => {
    const getCostEstimate = async () => {
      if (!selectedModel || !text) return;
      
      try {
        log.info('Getting cost estimate', { 
          modelId: selectedModel, 
          textLength: text.length 
        });
        
        const estimate = await modelService.getCostEstimate(text, selectedModel);
        setCostEstimate(estimate);
        
        log.info('Cost estimate received', { 
          modelId: selectedModel,
          estimatedCost: estimate.estimatedCost 
        });
        
      } catch (err) {
        log.warn('Failed to get cost estimate', {
          modelId: selectedModel,
          textLength: text.length,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    };

    getCostEstimate();
  }, [selectedModel, text]);

  const getModelIcon = (tier: string) => {
    switch (tier) {
      case 'basic': return <Speed />;
      case 'standard': return <Psychology />;
      case 'premium': return <AutoAwesome />;
      default: return <Psychology />;
    }
  };

  const getModelColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'success';
      case 'standard': return 'primary';
      case 'premium': return 'secondary';
      default: return 'primary';
    }
  };

  const currentModel = models.find(m => m.id === selectedModel);

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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>AI Model</InputLabel>
          <Select
            value={selectedModel || ''}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={disabled}
            sx={{ borderRadius: 2 }}
          >
            {models.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getModelIcon(model.tier)}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {model.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${model.costPerToken * 1000}/1K tokens
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="View model details">
          <IconButton 
            size="small" 
            onClick={() => setShowDetails(true)}
            disabled={!currentModel}
          >
            <Info />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Current Model Info */}
      {currentModel && (
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'rgba(26, 27, 46, 0.4)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Chip
              icon={getModelIcon(currentModel.tier)}
              label={currentModel.tier.toUpperCase()}
              color={getModelColor(currentModel.tier) as any}
              size="small"
            />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {currentModel.description}
            </Typography>
          </Box>

          {costEstimate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <MonetizationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Estimated cost: <strong>${costEstimate.estimatedCost.toFixed(4)}</strong>
                {' '}({costEstimate.estimatedTokens} tokens)
              </Typography>
            </Box>
          )}

          {/* Strengths */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {currentModel.strengths.slice(0, 3).map((strength) => (
              <Chip
                key={strength}
                label={strength}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Model Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology />
            AI Model Comparison
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {models.map((model, index) => (
              <React.Fragment key={model.id}>
                <ListItem
                  sx={{
                    bgcolor: model.id === selectedModel 
                      ? 'rgba(255, 215, 0, 0.1)' 
                      : 'transparent',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemIcon>
                    {getModelIcon(model.tier)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">{model.name}</Typography>
                        <Chip
                          label={model.tier}
                          color={getModelColor(model.tier) as any}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          ${(model.costPerToken * 1000).toFixed(2)}/1K tokens
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {model.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {model.strengths.map((strength) => (
                            <Chip
                              key={strength}
                              label={strength}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  {model.id !== selectedModel && (
                    <Button
                      size="small"
                      onClick={() => {
                        onModelChange(model.id);
                        setShowDetails(false);
                      }}
                    >
                      Select
                    </Button>
                  )}
                </ListItem>
                {index < models.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 