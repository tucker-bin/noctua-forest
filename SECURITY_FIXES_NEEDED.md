# CRITICAL SECURITY FIXES NEEDED

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Remove Hardcoded Credentials from .git/cloudbuild.yaml

**CRITICAL**: Your Firebase API keys are exposed in `.git/cloudbuild.yaml`

```bash
# Remove the file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .git/cloudbuild.yaml" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
```

### 2. Rotate Firebase API Keys

Since your keys are exposed:
1. Go to Firebase Console
2. Generate new API keys
3. Update your environment variables
4. Disable the old keys

### 3. Fix Cloud Build Configuration

Move cloudbuild.yaml to project root and use substitution variables:
```yaml
substitutions:
  _FIREBASE_API_KEY: '${FIREBASE_API_KEY}'  # From Cloud Build trigger
  _FIREBASE_AUTH_DOMAIN: '${FIREBASE_AUTH_DOMAIN}'
  # ... etc
```

### 4. Clean Sensitive Files

```bash
# Remove sensitive files
rm -f PASTE_YOUR_ENV_HERE.txt
rm -f my-rhyme-app/old.env
rm -f src/App.js  # Old file with dummy keys

# Remove old Python backend
rm -rf src/ templates/ static/ venv/
rm -f app.py requirements.txt Dockerfile
```

### 5. Remove Console.log Statements

Search and remove all console.log statements that might leak info:
- `node-backend/index.js`: Lines 171, 174, 177, 191, 843, 856
- `my-rhyme-app/src/contexts/AuthContext.tsx`: Lines 70, 79, 91, 100
- Various component files

### 6. Set Up Proper Secret Management

For Google Cloud Build:
1. Use Secret Manager for sensitive values
2. Reference secrets in cloudbuild.yaml:
```yaml
availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/firebase-api-key/versions/latest
    env: 'FIREBASE_API_KEY'
```

### 7. Update .gitignore

Ensure these are in .gitignore:
```
.git/cloudbuild.yaml
PASTE_YOUR_ENV_HERE.txt
old.env
secrets/
credentials/
*.json  # For service account files
```

## Prevention Checklist

- [ ] Never hardcode API keys or secrets
- [ ] Always use environment variables
- [ ] Review all files before committing
- [ ] Use git-secrets or similar tools
- [ ] Enable GitHub secret scanning
- [ ] Regular security audits

## Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/learn-more#best-practices)
- [Google Cloud Build Secrets](https://cloud.google.com/build/docs/securing-builds/use-secrets)
- [Git Filter Branch](https://git-scm.com/docs/git-filter-branch) 