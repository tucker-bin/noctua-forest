# Local Testing Guide for Noctua Rhyme Observatory

## 🚀 Quick Start

### 1. Set Up Environment Files

First, create the required environment files:

#### Backend: `node-backend/.env`
```
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### Frontend: `my-rhyme-app/.env.local`
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-rhyme-app
VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

### 2. Start the Backend Server

Open a terminal and run:
```bash
cd node-backend
npm start
```

Or use the helper script:
```bash
start-backend.bat
```

The backend will run on http://localhost:3001

### 3. Start the Frontend

Open another terminal and run:
```bash
cd my-rhyme-app
npm run dev
```

The frontend will run on http://localhost:5173

## 🧪 Testing the Analysis Features

### Demo Mode Analysis Page

Navigate to: http://localhost:5173/analyze

This page has **DEMO_MODE** enabled, which means:
- No authentication required
- No token restrictions
- Direct API calls to the backend

### Testing Without Anthropic API Key

If you don't have an Anthropic API key configured, the backend will use a simple mock analysis that:
- Groups words by their endings (last 2 letters)
- Creates pattern descriptions
- Returns demo data for testing the UI

### Sample Test Texts

Click the example chips on the Analysis page:
1. **Classic Rhyme** - Simple AABB rhyme scheme
2. **Hip Hop Bars** - Complex internal rhymes
3. **Poetic Verse** - Traditional poetry patterns

### What to Expect

When you analyze text, you'll see:
- Pattern groups with descriptions
- Words highlighted as chips
- Orion the Owl reacting to your analysis
- Full visualization in the RhymeAnalysisTool component

## 🔧 Troubleshooting

### Backend Not Starting?

1. Check if `.env` file exists in `node-backend/`
2. Make sure port 3001 is not in use
3. Run `npm install` in node-backend directory

### No Analysis Results?

1. Check browser console for errors
2. Verify backend is running (visit http://localhost:3001)
3. Check Network tab for API calls to `/api/analyze`

### CORS Issues?

The backend is configured to accept requests from localhost:5173. If you're using a different port, update the CORS settings in `node-backend/index.js`.

## 📝 API Testing

Test the API directly with curl:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/analyze" -Method POST -ContentType "application/json" -Body '{"text":"roses are red violets are blue"}'

# Or with curl
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d "{\"text\":\"roses are red violets are blue\"}"
```

## 🎨 Features to Test

1. **Pattern Analysis**
   - Enter text with obvious rhymes
   - Check if patterns are detected
   - Verify highlight colors match pattern types

2. **UI Components**
   - Orion's mood changes (happy → thinking → excited)
   - Loading states
   - Error handling
   - Result visualization

3. **Control Deck** (on home page after onboarding)
   - Toggle pattern visibility
   - Master on/off switch
   - Collapse/expand functionality

4. **Gamification** (on home page)
   - Rhyme score increases
   - Level progression
   - Achievement unlocks

## 🚦 Next Steps

Once local testing is complete:
1. Configure real Anthropic API key for advanced analysis
2. Set up Firebase authentication for user accounts
3. Deploy to production environment 

## 🚀 Quick Start

### 1. Set Up Environment Files

First, create the required environment files:

#### Backend: `node-backend/.env`
```
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### Frontend: `my-rhyme-app/.env.local`
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-rhyme-app
VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

### 2. Start the Backend Server

Open a terminal and run:
```bash
cd node-backend
npm start
```

Or use the helper script:
```bash
start-backend.bat
```

The backend will run on http://localhost:3001

### 3. Start the Frontend

Open another terminal and run:
```bash
cd my-rhyme-app
npm run dev
```

The frontend will run on http://localhost:5173

## 🧪 Testing the Analysis Features

### Demo Mode Analysis Page

Navigate to: http://localhost:5173/analyze

This page has **DEMO_MODE** enabled, which means:
- No authentication required
- No token restrictions
- Direct API calls to the backend

### Testing Without Anthropic API Key

If you don't have an Anthropic API key configured, the backend will use a simple mock analysis that:
- Groups words by their endings (last 2 letters)
- Creates pattern descriptions
- Returns demo data for testing the UI

### Sample Test Texts

Click the example chips on the Analysis page:
1. **Classic Rhyme** - Simple AABB rhyme scheme
2. **Hip Hop Bars** - Complex internal rhymes
3. **Poetic Verse** - Traditional poetry patterns

### What to Expect

When you analyze text, you'll see:
- Pattern groups with descriptions
- Words highlighted as chips
- Orion the Owl reacting to your analysis
- Full visualization in the RhymeAnalysisTool component

## 🔧 Troubleshooting

### Backend Not Starting?

1. Check if `.env` file exists in `node-backend/`
2. Make sure port 3001 is not in use
3. Run `npm install` in node-backend directory

### No Analysis Results?

1. Check browser console for errors
2. Verify backend is running (visit http://localhost:3001)
3. Check Network tab for API calls to `/api/analyze`

### CORS Issues?

The backend is configured to accept requests from localhost:5173. If you're using a different port, update the CORS settings in `node-backend/index.js`.

## 📝 API Testing

Test the API directly with curl:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/analyze" -Method POST -ContentType "application/json" -Body '{"text":"roses are red violets are blue"}'

# Or with curl
curl -X POST http://localhost:3001/api/analyze -H "Content-Type: application/json" -d "{\"text\":\"roses are red violets are blue\"}"
```

## 🎨 Features to Test

1. **Pattern Analysis**
   - Enter text with obvious rhymes
   - Check if patterns are detected
   - Verify highlight colors match pattern types

2. **UI Components**
   - Orion's mood changes (happy → thinking → excited)
   - Loading states
   - Error handling
   - Result visualization

3. **Control Deck** (on home page after onboarding)
   - Toggle pattern visibility
   - Master on/off switch
   - Collapse/expand functionality

4. **Gamification** (on home page)
   - Rhyme score increases
   - Level progression
   - Achievement unlocks

## 🚦 Next Steps

Once local testing is complete:
1. Configure real Anthropic API key for advanced analysis
2. Set up Firebase authentication for user accounts
3. Deploy to production environment 