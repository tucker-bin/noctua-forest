# Deployment Guide for Rhyme Analysis App

This guide will help you deploy your Node.js backend and React frontend to Google Cloud.

## Prerequisites

1. Google Cloud Project with billing enabled
2. GitHub repository
3. Google Cloud CLI installed locally

## Setup Steps

### 1. Initialize Git Repository

First, initialize your local repository if you haven't already:

```bash
git init
git add .
git commit -m "Initial commit of Node.js backend and React frontend"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Don't initialize with README, .gitignore, or license (we already have these)
3. Add the remote to your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Enable Google Cloud Services

Run these commands to enable necessary services:

```bash
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 4. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create my-rhyme-app-images \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker images for Rhyme App"
```

### 5. Store API Key in Secret Manager

```bash
# Create the secret
echo -n "YOUR_ANTHROPIC_API_KEY" | gcloud secrets create apikey --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding apikey \
    --member="serviceAccount:my-rhyme-app-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 6. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create my-rhyme-app-service \
    --display-name="My Rhyme App Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:my-rhyme-app-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.invoker"
```

### 7. Set up Cloud Build Trigger

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Configure:
   - Name: `deploy-rhyme-app`
   - Event: Push to branch
   - Branch: `^main$`
   - Configuration: Cloud Build configuration file
   - Location: `/cloudbuild-node.yaml`
4. Add substitution variables (click "Advanced"):
   - `_VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `_VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `_VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `_VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `_VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `_VITE_FIREBASE_APP_ID`: Your Firebase app ID

### 8. Update Frontend Configuration

After your first deployment, Cloud Run will provide a URL for your backend. Update your frontend:

1. Get the backend URL:
```bash
gcloud run services describe my-rhyme-app-backend --region=us-central1 --format='value(status.url)'
```

2. For local development, create `my-rhyme-app/.env.local`:
```
VITE_API_URL=http://localhost:3000/api
```

### 9. Deploy Using the Script

Now you can deploy using the provided script:

```bash
# Make the script executable (first time only)
chmod +x deploy-node.bat

# Run deployment
./deploy-node.bat "Your commit message"
```

Or manually:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## Monitoring

- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds
- **Cloud Run**: https://console.cloud.google.com/run
- **Firebase Hosting**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/hosting

## Troubleshooting

### Build Fails

1. Check Cloud Build logs for specific errors
2. Ensure all environment variables are set in the trigger
3. Verify service account permissions

### Backend Not Accessible

1. Ensure Cloud Run service is set to allow unauthenticated access
2. Check that the backend URL is correctly set in the frontend
3. Verify CORS settings in the backend

### Frontend Issues

1. Check browser console for errors
2. Verify Firebase configuration is correct
3. Ensure the API URL is properly set

## Local Development

For local development, run both services:

```bash
# Terminal 1 - Backend
cd node-backend
npm install
npm start

# Terminal 2 - Frontend
cd my-rhyme-app
npm install
npm run dev
```

The frontend will use the local backend API automatically with the `.env.local` configuration. 