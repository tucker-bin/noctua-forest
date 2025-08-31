const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Basic health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    status: 'running',
    env: process.env.NODE_ENV,
    node_version: process.version,
    platform: process.platform,
    port: PORT,
    cwd: process.cwd(),
    files: require('fs').readdirSync('.')
  });
});

// Enable trust proxy
app.enable('trust proxy');

// Root endpoint
app.get('/', (req, res) => {
  res.send('Noctua Forest is running');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== Minimal server starting ===`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Port:', PORT);
  console.log('CWD:', process.cwd());
  console.log('Files:', require('fs').readdirSync('.'));
  console.log(`=== Server running on port ${PORT} ===`);
});
