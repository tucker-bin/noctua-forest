# Quick Fix for API 500 Error

The 500 error you're seeing is happening because the backend server needs to be configured and restarted. Here's how to fix it:

## 1. Create Backend Environment Variables

Create a file `node-backend/.env` with the following content:

```env
# Anthropic API Key (optional - will use mock data if not provided)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Port 
PORT=3001
```

## 2. Restart Both Servers

Stop any running servers (Ctrl+C) and restart them:

### Terminal 1 - Backend Server:
```bash
cd node-backend
npm start
```

### Terminal 2 - Frontend Server:
```bash
cd my-rhyme-app
npm run dev
```

## What Changed?

1. **Fixed Proxy Configuration**: Updated Vite config to proxy API requests to port 3001 (where the backend runs) instead of 8080.

2. **Added Mock Analysis**: The backend now provides mock rhyme analysis when no Anthropic API key is configured, so you can test the app without an API key.

3. **Enhanced Error Handling**: Better error messages for different scenarios.

## Testing the Fix

1. After restarting both servers, go to http://localhost:5173
2. Navigate to the Analysis page
3. Enter some text with rhyming words (e.g., "The cat in the hat sat on the mat")
4. Click Analyze
5. You should see rhyme patterns highlighted (using mock data if no API key)

## Optional: Get Real Analysis

To use real AI-powered analysis:
1. Sign up for an Anthropic API key at https://console.anthropic.com/
2. Add it to your `node-backend/.env` file
3. Restart the backend server

The app will now use Claude AI for sophisticated rhyme pattern detection! 