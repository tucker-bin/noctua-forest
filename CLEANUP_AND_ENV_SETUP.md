# Environment Setup & Project Cleanup Guide

## 🔍 Finding the Parent .env File

If you have a `.env` file in the parent directory (above `my-rhyme-app-main`), you need to:

1. **Check its contents** and copy relevant variables to the appropriate locations:
   ```bash
   # From the my-rhyme-app-main directory
   type ..\.env
   ```

2. **Split the variables** into two files:
   - Backend variables → `node-backend/.env`
   - Frontend variables → `my-rhyme-app/.env.local`

## 📁 Current File Structure Issues

### Deprecated Files (Old Python Backend)
These files are from the old Flask backend and should be removed:

```
✗ app.py                    # Old Flask backend
✗ requirements.txt          # Python dependencies
✗ Dockerfile               # Python Docker config
✗ prometheus.yml           # Old monitoring
✗ docker-compose.monitoring.yml
✗ src/                     # Old Flask source (if exists)
✗ templates/               # Flask templates (if exists)
✗ static/                  # Flask static files (if exists)
✗ venv/                    # Python virtual environment
✗ grafana/                 # Monitoring dashboards
```

### Active Files (Keep These)
```
✓ my-rhyme-app/            # React frontend
✓ node-backend/            # Node.js backend
✓ .gitignore
✓ README.md
✓ DEPLOYMENT.md
✓ cloudbuild-node.yaml     # For Google Cloud deployment
```

## 🛠️ Cleanup Script

Run these commands to clean up deprecated files:

```bash
# Remove Python backend files
del app.py
del requirements.txt
del Dockerfile
del prometheus.yml
del docker-compose.monitoring.yml

# Remove Python directories
rmdir /s /q src
rmdir /s /q templates
rmdir /s /q static
rmdir /s /q venv
rmdir /s /q grafana
rmdir /s /q __pycache__

# Remove old deployment files (if not using Google Cloud)
del cloudbuild.yaml
del cloudbuild-minimal.yaml
```

## 🔐 Environment Variables Setup

### Step 1: Create Backend Environment File
Create `node-backend/.env`:

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Your actual Anthropic key

# Server Configuration
FRONTEND_URL=http://localhost:5173
PORT=3001

# Optional: Firebase Admin
# FIREBASE_ADMIN_CREDENTIALS=../secrets/firebase-adminsdk.json
```

### Step 2: Create Frontend Environment File
Create `my-rhyme-app/.env.local`:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# API Configuration (optional)
# VITE_API_URL=/api
```

### Step 3: Copy from Parent .env (if exists)
If you have a parent `.env` file, extract values:

```bash
# Example of what might be in parent .env:
# ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
# FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
# etc...

# Copy ANTHROPIC_API_KEY to node-backend/.env
# Copy FIREBASE_* variables to my-rhyme-app/.env.local (prefix with VITE_)
```

## 🚀 Quick Start After Cleanup

1. **Verify environment files exist**:
   ```bash
   dir node-backend\.env
   dir my-rhyme-app\.env.local
   ```

2. **Install dependencies** (if needed):
   ```bash
   cd node-backend && npm install
   cd ../my-rhyme-app && npm install
   ```

3. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd node-backend
   npm start

   # Terminal 2 - Frontend
   cd my-rhyme-app
   npm run dev
   ```

4. **Test the application**:
   - Open http://localhost:5173
   - Check console for any missing environment variable errors
   - Try the analysis feature

## ⚠️ Common Issues

### Missing API Key Error
If you see "Anthropic API key not configured":
1. Check `node-backend/.env` has `ANTHROPIC_API_KEY=your_actual_key`
2. Restart the backend server

### Firebase Auth Error
If authentication fails:
1. Verify all `VITE_FIREBASE_*` variables in `my-rhyme-app/.env.local`
2. Check Firebase Console for correct values
3. Restart the frontend server

### Port Conflicts
If port 3001 is in use:
1. Change `PORT=3002` in `node-backend/.env`
2. Update `my-rhyme-app/vite.config.ts` proxy target to match

## 📊 Final Verification

After cleanup and setup, your structure should be:

```
my-rhyme-app-main/
├── my-rhyme-app/
│   ├── .env.local (created)
│   └── [frontend files]
├── node-backend/
│   ├── .env (created)
│   └── [backend files]
└── [only essential root files]
```

No Python files should remain! 