import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Collapse,
  useTheme,
  Tooltip,
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAuth } from '../../contexts/AuthContext';
import { useExperience } from '../../contexts/ExperienceContext';

interface CachedGame {
  id: string;
  mode: string;
  difficulty: number;
  data: any;
  cachedAt: number;
  lastPlayed?: number;
}

interface OfflineData {
  games: CachedGame[];
  userProgress: any;
  settings: any;
  lastSync: number;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { level } = useExperience();

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  const [offlineData, setOfflineData] = useState<OfflineData>({
    games: [],
    userProgress: {},
    settings: {},
    lastSync: 0
  });

  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
      syncPendingData();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  // Load cached data on component mount
  useEffect(() => {
    loadOfflineData();
    calculateCacheSize();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && pendingSync > 0) {
      const timer = setTimeout(() => {
        syncPendingData();
      }, 2000); // Wait 2 seconds after reconnection

      return () => clearTimeout(timer);
    }
  }, [networkStatus.isOnline, pendingSync]);

  const loadOfflineData = useCallback(() => {
    try {
      const cached = localStorage.getItem('rhymetime-offline-data');
      if (cached) {
        const parsed = JSON.parse(cached);
        setOfflineData(parsed);
        
        // Count pending sync items
        const pending = parsed.userProgress?.pendingSync?.length || 0;
        setPendingSync(pending);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  const calculateCacheSize = useCallback(() => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (key.startsWith('rhymetime-')) {
          totalSize += localStorage[key].length;
        }
      }
      setCacheSize(Math.round(totalSize / 1024)); // KB
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }
  }, []);

  const downloadGamesForOffline = useCallback(async () => {
    if (!networkStatus.isOnline) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      // Download different game modes and difficulties
      const gameModes = ['rhyme_hunter', 'alliteration_alert', 'consonance_challenge'];
      const difficulties = [1, 2, 3];
      const totalGames = gameModes.length * difficulties.length * 3; // 3 games per combination
      let downloadedCount = 0;

      const cachedGames: CachedGame[] = [];

      for (const mode of gameModes) {
        for (const difficulty of difficulties) {
          for (let i = 0; i < 3; i++) {
            try {
              const response = await fetch(`/api/games/generate?mode=${mode}&difficulty=${difficulty}&offline=true`);
              if (response.ok) {
                const gameData = await response.json();
                
                cachedGames.push({
                  id: `offline-${mode}-${difficulty}-${i}`,
                  mode,
                  difficulty,
                  data: gameData,
                  cachedAt: Date.now()
                });
              }
            } catch (error) {
              console.error(`Error downloading ${mode} game:`, error);
            }

            downloadedCount++;
            setDownloadProgress((downloadedCount / totalGames) * 100);
            
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Save to offline storage
      const newOfflineData = {
        ...offlineData,
        games: cachedGames,
        lastSync: Date.now()
      };

      localStorage.setItem('rhymetime-offline-data', JSON.stringify(newOfflineData));
      setOfflineData(newOfflineData);
      calculateCacheSize();

      console.log(`Downloaded ${cachedGames.length} games for offline play`);
    } catch (error) {
      console.error('Error downloading offline games:', error);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [networkStatus.isOnline, offlineData, calculateCacheSize]);

  const syncPendingData = useCallback(async () => {
    if (!networkStatus.isOnline || !currentUser) return;

    setSyncing(true);

    try {
      // Get pending sync data
      const pendingData = offlineData.userProgress?.pendingSync || [];
      
      if (pendingData.length > 0) {
        // Sync game completions
        for (const item of pendingData) {
          await fetch('/api/user/sync-progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await currentUser.getIdToken()}`
            },
            body: JSON.stringify(item)
          });
        }

        // Clear pending sync data
        const updatedData = {
          ...offlineData,
          userProgress: {
            ...offlineData.userProgress,
            pendingSync: []
          },
          lastSync: Date.now()
        };

        localStorage.setItem('rhymetime-offline-data', JSON.stringify(updatedData));
        setOfflineData(updatedData);
        setPendingSync(0);

        console.log('Synced offline progress successfully');
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setSyncing(false);
    }
  }, [networkStatus.isOnline, currentUser, offlineData]);

  const clearOfflineData = useCallback(() => {
    localStorage.removeItem('rhymetime-offline-data');
    setOfflineData({
      games: [],
      userProgress: {},
      settings: {},
      lastSync: 0
    });
    setPendingSync(0);
    calculateCacheSize();
  }, [calculateCacheSize]);

  const getConnectionQuality = () => {
    if (!networkStatus.isOnline) return { label: 'Offline', color: 'error', icon: <WifiOffIcon /> };
    
    const { effectiveType, downlink } = networkStatus;
    
    if (effectiveType === '4g' || downlink > 10) {
      return { label: 'Excellent', color: 'success', icon: <WifiIcon /> };
    } else if (effectiveType === '3g' || downlink > 1.5) {
      return { label: 'Good', color: 'warning', icon: <WifiIcon /> };
    } else {
      return { label: 'Slow', color: 'error', icon: <WifiIcon /> };
    }
  };

  const connectionQuality = getConnectionQuality();
  const hasOfflineGames = offlineData.games.length > 0;
  const lastSyncFormatted = offlineData.lastSync ? 
    new Date(offlineData.lastSync).toLocaleDateString() : 'Never';

  // Only show if offline or slow connection
  if (networkStatus.isOnline && connectionQuality.label !== 'Slow') {
    return null;
  }

  return (
    <Box>
      {/* Subtle Connection Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Chip
          icon={connectionQuality.icon}
          label={networkStatus.isOnline ? 'Slow Connection' : 'Offline'}
          size="small"
          color={networkStatus.isOnline ? 'warning' : 'error'}
          sx={{
            fontSize: '0.75rem',
            bgcolor: `${theme.palette[connectionQuality.color as 'success' | 'warning' | 'error'].main}15`,
            border: `1px solid ${theme.palette[connectionQuality.color as 'success' | 'warning' | 'error'].main}30`
          }}
        />
      </motion.div>

      {/* Full offline panel available at /settings if needed */}

      {/* CSS for spinning animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default OfflineIndicator; 