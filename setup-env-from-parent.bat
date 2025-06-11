@echo off
echo ========================================
echo ENVIRONMENT SETUP FROM PARENT .ENV
echo ========================================
echo.
echo This will help you split your parent .env file into:
echo - node-backend\.env (for backend variables)
echo - my-rhyme-app\.env.local (for frontend variables)
echo.
echo ========================================
echo PARENT .ENV CONTENTS:
echo ========================================
echo.
echo Please paste the contents of your parent .env file here.
echo We'll help you identify which variables go where.
echo.
echo BACKEND variables (node-backend\.env):
echo - ANTHROPIC_API_KEY
echo - PORT
echo - FRONTEND_URL
echo - FIREBASE_ADMIN_CREDENTIALS (optional)
echo.
echo FRONTEND variables (my-rhyme-app\.env.local):
echo - VITE_FIREBASE_API_KEY
echo - VITE_FIREBASE_AUTH_DOMAIN
echo - VITE_FIREBASE_PROJECT_ID
echo - VITE_FIREBASE_STORAGE_BUCKET
echo - VITE_FIREBASE_MESSAGING_SENDER_ID
echo - VITE_FIREBASE_APP_ID
echo - VITE_API_URL (optional)
echo.
echo ========================================
echo.
echo Since I can't read your parent .env file directly,
echo please share its contents so I can help you create
echo the proper environment files.
echo.
pause 