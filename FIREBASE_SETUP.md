# Firebase Hosting Setup Guide

## Cost Comparison

### Firebase Hosting (Recommended)
- **Free Tier**: 10 GB transfer/month, 1 GB storage
- **Paid**: $0.15 per GB transfer after free tier
- **Your site cost**: $0-2/month (likely free forever)

### Cloud Run (Previous)
- **Minimum**: $15-30/month for always-on service
- **Complex**: Docker containers, server management
- **Overkill**: For a static website

## Quick Setup (5 minutes)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Project (if needed)
```bash
firebase init hosting
```
- Select "Use an existing project" 
- Choose your Firebase project
- Public directory: `.` (current directory)
- Configure as single-page app: `No`
- Set up automatic builds: `No`

### 4. Deploy Your Site
```bash
scripts\deploy-firebase.bat
```

## Files Created

### firebase.json
- Hosting configuration
- Cache headers for performance
- Redirects all routes to index.html
- Ignores development files

### .firebaserc
- Project configuration
- Links to your Firebase project

### scripts/deploy-firebase.bat
- Automated deployment script
- Checks Firebase CLI installation
- Handles authentication
- Deploys with success/error handling

## Deployment Workflow

### Option 1: Firebase Only
```bash
# Deploy directly to Firebase
scripts\deploy-firebase.bat
```

### Option 2: Git + Firebase
```bash
# Push to GitHub first
scripts\publish.bat

# Then deploy to Firebase
scripts\deploy-firebase.bat
```

## Benefits of Firebase Hosting

### Cost
- Nearly free for small sites
- No server costs
- No Docker complexity

### Performance
- Global CDN included
- Automatic SSL certificates
- Fast edge locations worldwide

### Simplicity
- Single command deployment
- No server management
- Automatic scaling

### Features
- Custom domains
- Preview channels
- Rollback capabilities
- Analytics integration

## Your Site URL
After deployment, your site will be available at:
- **Default**: https://noctua-forest-ppc.web.app
- **Custom domain**: Configure in Firebase Console

## Next Steps
1. Run `scripts\deploy-firebase.bat` to deploy
2. Configure custom domain (if desired) in Firebase Console
3. Set up Google Analytics (optional)
4. Monitor usage in Firebase Console

The migration from Cloud Run to Firebase Hosting will save you $15-25/month while providing better performance for your static Amazon PPC agency site!
