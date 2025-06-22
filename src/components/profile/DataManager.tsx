import React from 'react';
import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import { Cached, GetApp } from '@mui/icons-material';
import { useCache } from '../../hooks/useCache';
import { useAuth } from '../../contexts/AuthContext';
// A mock service, to be implemented later
// import { exportUserData } from '../../services/userService';

const DataManager: React.FC = () => {
  const { clearCache, cachedObservations } = useCache();
  const { currentUser } = useAuth();

  const handleClearCache = () => {
    clearCache();
    // Optionally, show a success message
  };

  const handleExportData = async () => {
    if (!currentUser) return;
    // This is where the call to a real export service would go
    // const data = await exportUserData(currentUser.uid);
    // const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'noctua_forest_data.json';
    // a.click();
    // URL.revokeObjectURL(url);
    alert("Export functionality is not yet implemented.");
  };

  const cacheSize = Object.keys(cachedObservations).length;

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mt: 3, background: 'rgba(26, 31, 46, 0.95)' }}>
      <Typography variant="h6" gutterBottom>
        Data & Cache Management
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body1">
          You have {cacheSize} observation(s) stored in your local cache.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Cached />}
          onClick={handleClearCache}
          disabled={cacheSize === 0}
        >
          Clear Observation Cache
        </Button>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Export all your observations and user data.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={handleExportData}
        >
          Export My Data
        </Button>
      </Box>
    </Paper>
  );
};

export default DataManager; 