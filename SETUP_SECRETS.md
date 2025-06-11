# Setting Up Secrets for Secure Deployment

This guide will help you set up Google Secret Manager for secure deployment.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and configured
- Firebase project created
- Anthropic API key

## Step 1: Enable Secret Manager API

```bash
gcloud services enable secretmanager.googleapis.com
```

## Step 2: Create Secrets in Secret Manager

Run these commands, replacing the placeholders with your actual values:

```bash
# Firebase secrets
echo -n "YOUR_FIREBASE_API_KEY" | gcloud secrets create firebase-api-key --data-file=-
echo -n "YOUR_FIREBASE_AUTH_DOMAIN" | gcloud secrets create firebase-auth-domain --data-file=-
echo -n "YOUR_FIREBASE_STORAGE_BUCKET" | gcloud secrets create firebase-storage-bucket --data-file=-
echo -n "YOUR_FIREBASE_MESSAGING_SENDER_ID" | gcloud secrets create firebase-messaging-sender-id --data-file=-
echo -n "YOUR_FIREBASE_APP_ID" | gcloud secrets create firebase-app-id --data-file=-

# Anthropic API key
echo -n "YOUR_ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-
```

## Step 3: Grant Cloud Build Access to Secrets

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding firebase-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-auth-domain \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-storage-bucket \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-messaging-sender-id \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-app-id \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Set Up Cloud Build Trigger

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Configure:
   - Name: `deploy-noctua-rhyme-app`
   - Event: Push to branch
   - Branch: `^main$`
   - Configuration: Cloud Build configuration file
   - Location: `/cloudbuild-secure.yaml`

## Step 5: Deploy Using Cloud Build

```bash
# Trigger the build
gcloud builds submit --config=cloudbuild-secure.yaml
```

## Local Development

For local development, continue using `.env` files but NEVER commit them:

1. Create `node-backend/.env`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   FRONTEND_URL=http://localhost:5173
   PORT=3001
   ```

2. Create `my-rhyme-app/.env.local`:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Security Checklist

- [ ] All secrets stored in Secret Manager
- [ ] No hardcoded secrets in code
- [ ] `.env` files added to `.gitignore`
- [ ] Old cloudbuild.yaml with hardcoded values deleted
- [ ] Firebase API keys rotated if exposed
- [ ] Git history cleaned if secrets were committed

## Troubleshooting

### Error: Secret not found
Make sure the secret names match exactly what's in `cloudbuild-secure.yaml`

### Error: Permission denied
Ensure Cloud Build service account has access to secrets (Step 3)

### Error: API not enabled
Enable required APIs:
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable firebase.googleapis.com
``` 