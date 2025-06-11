@echo off
echo ========================================
echo ENVIRONMENT VARIABLES NEEDED
echo ========================================
echo.
echo From your parent .env file, we need:
echo.
echo FOR BACKEND (node-backend\.env):
echo --------------------------------
echo ANTHROPIC_API_KEY=sk-ant-...
echo.
echo FOR FRONTEND (my-rhyme-app\.env.local):
echo --------------------------------------
echo VITE_FIREBASE_API_KEY=AIzaSy...
echo VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=my-rhyme-app
echo VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
echo VITE_FIREBASE_APP_ID=1:123456789:web:...
echo.
echo Based on your .firebaserc, your project is: my-rhyme-app
echo.
echo Please paste your parent .env contents so I can help
echo create these files with your actual values!
echo.
pause 