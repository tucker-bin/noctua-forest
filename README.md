# Noctua Forest 🦉

A sophisticated AI-powered text analysis application that reveals hidden rhyme patterns and phonetic architectures in poetry, lyrics, and creative writing.

## 🌟 Features

- **Advanced Rhyme Analysis**: Uses AI to detect complex phonetic patterns beyond simple end rhymes
- **Token-Based Usage System**: Fair usage model with subscription plans and token top-ups
- **User Authentication**: Secure Firebase authentication with email/password
- **Beautiful UI**: Modern React interface with Material-UI components
- **Real-time Analysis**: Fast processing with caching for repeated analyses
- **Admin Dashboard**: Monitor usage, manage users, and view analytics

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Material-UI** for component styling
- **Firebase** for authentication and user management
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Anthropic Claude API** for AI-powered analysis
- **Firebase Admin SDK** for user management
- **Winston** for logging
- **Rate limiting** and caching for performance

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication enabled
- Anthropic API key
- (Optional) Stripe account for payment processing

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd my-rhyme-app-main
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd node-backend
   npm install

   # Install frontend dependencies
   cd ../noctua-forest
   npm install
   ```

3. **Set up environment variables**

   Create `node-backend/.env`:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key
   FRONTEND_URL=http://localhost:5173
   PORT=3001
   # Optional: Firebase Admin SDK path
   # FIREBASE_ADMIN_CREDENTIALS=path/to/firebase-adminsdk.json
   ```

   Create `noctua-forest/.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## 🚀 Running Locally

Simply run:
```bash
run-local.bat
```

This will:
- Start the backend server on http://localhost:3001
- Start the frontend dev server on http://localhost:5173

## 🏗️ Deploying to Production

### Option 1: Deploy via GitHub CI/CD (Recommended)
```bash
deploy-production.bat
```

This will:
- Commit your changes
- Push to GitHub 
- Trigger automated CI/CD pipeline
- Deploy frontend to Firebase Hosting
- Deploy backend to Cloud Run

### Option 2: Manual Deployment
1. **Build the frontend**
   ```bash
   cd noctua-forest
   npm run build
   ```

2. **Deploy to Firebase Hosting**
   ```bash
   firebase deploy --only hosting
   ```

3. **Deploy backend to Google Cloud Run**
   ```bash
   gcloud run deploy noctua-forest-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars=NODE_ENV=production \
     --project=your-project-id
   ```

## 📁 Project Structure

```
noctua-forest/
├── node-backend/          # Node.js/Express backend
├── noctua-forest/        # React frontend
├── docker-compose.yml    # Docker configuration
├── cloudbuild.yaml      # Cloud Build configuration
└── README.md            # This file
```

## 🔑 Key Features Explained

### Token System
- Users start with 100 free tokens
- Different text lengths consume different token amounts:
  - Short (< 500 chars): 5 tokens
  - Medium (500-2000 chars): 10 tokens
  - Long (> 2000 chars): 20 tokens

### Analysis Types
- **Phonetic Architecture**: Comprehensive analysis of sound patterns
- **Traditional Rhyme Schemes**: ABAB, AABB, etc.
- **Advanced Pattern Detection**: Internal rhymes, assonance, consonance

## 🧹 Cleanup Tasks

Before deploying to production:

1. Remove old Python backend files:
   ```bash
   rm -rf src/ templates/ static/ venv/ app.py requirements.txt Dockerfile
   ```

2. Remove duplicate/unnecessary files:
   ```bash
   rm -rf public/  # Remove root-level public directory
   ```

3. Consolidate deployment scripts into a single script

## 🔒 Security Considerations

- Never commit `.env` files or API keys
- Use environment variables for all sensitive data
- Enable CORS only for your frontend domain in production
- Implement proper rate limiting
- Use Firebase Security Rules for data access

## 🐛 Known Issues

- Console.log statements need to be removed for production
- Hardcoded paths in some configuration files
- Multiple redundant setup scripts

## 📚 Additional Documentation

- [Local Testing Guide](LOCAL_TESTING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Production Deployment](PRODUCTION_DEPLOYMENT_README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Powered by Claude AI for advanced text analysis
- Firebase for authentication and hosting
- Material-UI for the beautiful interface 

## 🌍 Internationalization (i18n) & Accessibility

- Supports 15+ languages, including English, Spanish, French, Portuguese, Chinese, Vietnamese, Turkish, Korean, Japanese, Indonesian, Italian, German, Filipino, Malay, and more.
- **Automatic Language Detection:** App detects and uses the user's browser language by default.
- **Language Switcher:** Users can change language at any time via the footer.
- **Right-to-Left (RTL) Support:** Layout automatically flips for RTL languages (e.g., Arabic, Hebrew).
- **Locale-Aware Formatting:** Dates and numbers are formatted according to the user's language and region.
- **Tooltips & Feedback:** Key actions and controls include tooltips and gentle feedback prompts, all fully translatable.

### 📝 Translation Workflow
- **Every new UI string must have a translation key.**
- **All translation keys must be added to every supported language file.**
- Use the `useTranslation` hook and `t('key')` in all components.
- For backend messages, use i18n in Express and add keys to backend locale files.

See [`src/components/README_i18n.md`](src/components/README_i18n.md) for more details. 