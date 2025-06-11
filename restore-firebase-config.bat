@echo off
echo ========================================
echo RESTORING FIREBASE CONFIGURATION
echo ========================================
echo.

REM Copy firebase.json to my-rhyme-app directory
echo Copying firebase.json to my-rhyme-app...
copy /Y firebase.json my-rhyme-app\firebase.json >nul
if %errorlevel% equ 0 (
    echo SUCCESS: firebase.json copied to my-rhyme-app
) else (
    echo ERROR: Failed to copy firebase.json
)

echo.
echo ========================================
echo CREATING ENVIRONMENT FILES
echo ========================================
echo.
echo Since I can't read your parent .env file directly,
echo please manually create these files:
echo.
echo 1. node-backend\.env
echo ---------------------
echo ANTHROPIC_API_KEY=your_anthropic_api_key
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
echo.
echo 2. my-rhyme-app\.env.local  
echo -------------------------
echo # Copy these from your parent .env file:
echo VITE_FIREBASE_API_KEY=your_value_here
echo VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=my-rhyme-app
echo VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_value_here
echo VITE_FIREBASE_APP_ID=your_value_here
echo VITE_API_URL=http://localhost:3001
echo.
echo ========================================
echo IMPORTANT: 
echo ========================================
echo Please paste the contents of your parent .env file
echo so I can help you fill in the actual values!
echo.
echo Your Firebase project is: my-rhyme-app
echo Your measurementId is: G-YQL481Y1Z7
echo.
pause 