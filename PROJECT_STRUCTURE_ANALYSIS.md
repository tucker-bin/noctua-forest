# Project Structure Analysis - Noctua Rhyme App

## Current Project Structure

```
my-rhyme-app-main/
├── my-rhyme-app/           # React Frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── node-backend/           # Node.js Backend (Express)
│   ├── index.js
│   ├── package.json
│   └── logs/
├── app.py                  # OLD Python Flask backend (DEPRECATED)
├── requirements.txt        # OLD Python dependencies (DEPRECATED)
├── Dockerfile             # OLD Python Docker config (DEPRECATED)
├── templates/             # OLD Flask templates (DEPRECATED)
├── static/                # OLD Flask static files (DEPRECATED)
├── src/                   # OLD Flask source (DEPRECATED)
├── public/                # OLD React build output (DEPRECATED)
├── grafana/               # Monitoring config (may be deprecated)
└── Various config files
```

## Environment Variables Configuration

### Required .env Files

1. **Root Level .env** (for Python backend - DEPRECATED)
   - Not needed anymore since we're using Node.js backend

2. **node-backend/.env** (REQUIRED)
   ```env
   # Anthropic API Key
   ANTHROPIC_API_KEY=your_actual_api_key_here
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   
   # Port
   PORT=3001
   
   # Firebase Admin SDK (optional)
   FIREBASE_ADMIN_CREDENTIALS=path/to/firebase-adminsdk.json
   ```

3. **my-rhyme-app/.env.local** (REQUIRED for Firebase)
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   
   # API URL (optional, defaults to /api which proxies to backend)
   VITE_API_URL=/api
   ```

## Deprecated Files to Remove

### Python Backend Files (No longer used)
- `app.py` - Old Flask backend
- `requirements.txt` - Python dependencies
- `Dockerfile` - Python container config
- `src/` directory - Flask source code
- `templates/` directory - Flask HTML templates
- `static/` directory - Flask static files
- `prometheus.yml` - Old monitoring config
- `docker-compose.monitoring.yml` - Old Docker compose

### Old Build Artifacts
- `public/` directory (if it contains old React build)
- `venv/` directory - Python virtual environment
- Any `*.pyc` files
- `__pycache__/` directories

### Redundant Configuration
- Root level deployment configs if using subdirectory configs
- Old CI/CD files if not using Google Cloud Build

## Recommended Cleanup Commands

```bash
# Remove Python backend files
rm -f app.py requirements.txt Dockerfile prometheus.yml docker-compose.monitoring.yml
rm -rf src/ templates/ static/ venv/ __pycache__/

# Clean old build artifacts
rm -rf public/

# Keep only necessary deployment files
# Keep: cloudbuild-node.yaml (for Node.js deployment)
# Remove: cloudbuild.yaml, cloudbuild-minimal.yaml (if not needed)
```

## Environment Variable Sources

The app reads environment variables from multiple sources:

1. **Backend (Node.js)**:
   - `process.env.ANTHROPIC_API_KEY` - For AI analysis
   - `process.env.FRONTEND_URL` - For CORS
   - `process.env.PORT` - Server port
   - `process.env.FIREBASE_ADMIN_CREDENTIALS` - Firebase admin

2. **Frontend (React/Vite)**:
   - `import.meta.env.VITE_FIREBASE_*` - Firebase config
   - `import.meta.env.VITE_API_URL` - Backend API URL

## Setting Up Environment Variables

1. **Create node-backend/.env**:
   ```bash
   cd node-backend
   echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
   echo "FRONTEND_URL=http://localhost:5173" >> .env
   echo "PORT=3001" >> .env
   ```

2. **Create my-rhyme-app/.env.local**:
   ```bash
   cd my-rhyme-app
   # Copy Firebase config from Firebase Console
   echo "VITE_FIREBASE_API_KEY=..." > .env.local
   # Add other Firebase vars...
   ```

## Verification Steps

1. **Check if old Python backend is running**:
   ```bash
   # Should return nothing or error
   curl http://localhost:8080/health
   ```

2. **Verify Node.js backend**:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"healthy"}
   ```

3. **Test frontend proxy**:
   ```bash
   curl http://localhost:5173/api/health
   # Should proxy to backend and return: {"status":"healthy"}
   ```

## Final Project Structure (After Cleanup)

```
my-rhyme-app-main/
├── my-rhyme-app/           # React Frontend
│   ├── src/
│   ├── public/
│   ├── .env.local         # Frontend environment vars
│   ├── package.json
│   └── vite.config.ts
├── node-backend/           # Node.js Backend
│   ├── index.js
│   ├── .env              # Backend environment vars
│   ├── package.json
│   └── logs/
├── .gitignore
├── README.md
├── DEPLOYMENT.md
└── cloudbuild-node.yaml   # Deployment config
```

## Next Steps

1. Create the required .env files with your actual API keys
2. Remove deprecated Python backend files
3. Restart both servers:
   ```bash
   # Terminal 1
   cd node-backend && npm start
   
   # Terminal 2
   cd my-rhyme-app && npm run dev
   ```
4. Access the app at http://localhost:5173 