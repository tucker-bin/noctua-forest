@echo off
echo ========================================
echo CREATING ENVIRONMENT FILES
echo ========================================
echo.

REM Create node-backend/.env
echo Creating node-backend/.env...
(
echo # Backend Environment Variables
echo ANTHROPIC_API_KEY=your_anthropic_api_key_here
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
) > node-backend\.env

REM Create my-rhyme-app/.env.local
echo Creating my-rhyme-app/.env.local...
(
echo # Frontend Environment Variables - Firebase Config
echo # IMPORTANT: Replace these with your actual Firebase values from parent .env
echo VITE_FIREBASE_API_KEY=your_firebase_api_key_here
echo VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=your_project_id
echo VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
echo VITE_FIREBASE_APP_ID=your_app_id
echo.
echo # API URL (for local development)
echo VITE_API_URL=http://localhost:3001
) > my-rhyme-app\.env.local

echo.
echo ========================================
echo ENVIRONMENT FILES CREATED!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Open node-backend\.env and add your Anthropic API key
echo 2. Open my-rhyme-app\.env.local and add your Firebase config
echo.
echo Your Firebase config should look something like:
echo VITE_FIREBASE_API_KEY=AIzaSy...
echo VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=your-project
echo VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
echo VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
echo.
echo If you paste your parent .env contents, I can help fill these in automatically!
echo.
pause 