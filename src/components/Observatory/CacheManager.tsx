import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  lastUpdated: number;
  averageSize: number;
  hitRate: number;
}

interface CacheManagerProps {
  stats: CacheStats;
  onClearCache: () => void;
  onRefreshStats: () => void;
  onPreloadCommonTexts: () => void;
  isPreloading: boolean;
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  stats,
  onClearCache,
  onRefreshStats,
  onPreloadCommonTexts,
  isPreloading,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = React.useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <StorageIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">
          {t('cache.management', 'Cache Management')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={t('cache.refresh', 'Refresh Cache Stats')}>
          <IconButton onClick={onRefreshStats} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('cache.details', 'View Cache Details')}>
          <IconButton onClick={() => setShowDetails(true)} size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('cache.status', 'Cache Status')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={stats.hitRate}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {stats.hitRate.toFixed(1)}%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('cache.entries', 'Entries')}
          </Typography>
          <Typography variant="body1">
            {stats.totalEntries}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('cache.size', 'Size')}
          </Typography>
          <Typography variant="body1">
            {formatSize(stats.totalSize)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('cache.avg_size', 'Avg Size')}
          </Typography>
          <Typography variant="body1">
            {formatSize(stats.averageSize)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={onPreloadCommonTexts}
          disabled={isPreloading}
          startIcon={<RefreshIcon />}
          fullWidth
        >
          {isPreloading
            ? t('cache.preloading', 'Preloading...')
            : t('cache.preload', 'Preload Common Texts')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={onClearCache}
          startIcon={<DeleteIcon />}
          fullWidth
        >
          {t('cache.clear', 'Clear Cache')}
        </Button>
      </Box>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('cache.details_title', 'Cache Details')}
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText
                primary={t('cache.last_updated', 'Last Updated')}
                secondary={formatDate(stats.lastUpdated)}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary={t('cache.hits', 'Cache Hits')}
                secondary={stats.hitCount}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary={t('cache.misses', 'Cache Misses')}
                secondary={stats.missCount}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary={t('cache.hit_rate', 'Hit Rate')}
                secondary={`${stats.hitRate.toFixed(1)}%`}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 