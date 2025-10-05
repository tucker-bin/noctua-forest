# Scripts Reference

## Available Scripts

### Development
- **serve.bat** - Start local development server
  ```bash
  scripts\serve.bat
  ```

### Deployment
- **deploy.bat** - Complete deployment (Git + Firebase)
  ```bash
  scripts\deploy.bat
  ```

- **publish.bat** - Push to GitHub only
  ```bash
  scripts\publish.bat
  ```

- **deploy-firebase.bat** - Deploy to Firebase Hosting only
  ```bash
  scripts\deploy-firebase.bat
  ```

### Cleanup
- **cleanup-cloud-run.bat** - Remove expensive Cloud Run services
  ```bash
  scripts\cleanup-cloud-run.bat
  ```

## Recommended Workflow

### First Time Setup
1. Run cleanup: `scripts\cleanup-cloud-run.bat`
2. Complete deployment: `scripts\deploy.bat`

### Regular Updates
1. Make changes to your site
2. Test locally: `scripts\serve.bat`
3. Deploy: `scripts\deploy.bat`

### Emergency Cleanup
If you see unexpected Google Cloud charges:
1. Run: `scripts\cleanup-cloud-run.bat`
2. Check: https://console.cloud.google.com/billing

## Cost Savings
- **Before**: $15-30/month (Cloud Run + Docker)
- **After**: $0-2/month (Firebase Hosting)
- **Savings**: 95%+ cost reduction
