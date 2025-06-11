@echo off
echo ========================================
echo INTERACTIVE ENVIRONMENT SETUP
echo ========================================
echo.
echo This will help you set up your environment files.
echo Please have your parent .env file open to copy values.
echo.

REM Backend setup
echo Setting up BACKEND environment (node-backend\.env)...
echo ==========================================
set /p ANTHROPIC_KEY="Enter your ANTHROPIC_API_KEY (starts with sk-ant-): "

(
echo # Backend Environment Variables
echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY%
echo PORT=3001
echo FRONTEND_URL=http://localhost:5173
) > node-backend\.env

echo Backend .env created!
echo.

REM Frontend setup
echo Setting up FRONTEND environment (my-rhyme-app\.env.local)...
echo ==========================================
echo Please enter your Firebase configuration values:
echo.
set /p FB_API_KEY="VITE_FIREBASE_API_KEY (starts with AIzaSy): "
set /p FB_SENDER_ID="VITE_FIREBASE_MESSAGING_SENDER_ID (numeric): "
set /p FB_APP_ID="VITE_FIREBASE_APP_ID (format 1:xxx:web:xxx): "

(
echo # Frontend Environment Variables - Firebase Config
echo VITE_FIREBASE_API_KEY=%FB_API_KEY%
echo VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=my-rhyme-app
echo VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com
echo VITE_FIREBASE_MESSAGING_SENDER_ID=%FB_SENDER_ID%
echo VITE_FIREBASE_APP_ID=%FB_APP_ID%
echo.
echo # API URL for local development
echo VITE_API_URL=http://localhost:3001
) > my-rhyme-app\.env.local

echo Frontend .env.local created!
echo.

REM Copy firebase.json
echo Copying firebase.json to my-rhyme-app...
copy /Y firebase.json my-rhyme-app\firebase.json >nul
if %errorlevel% equ 0 (
    echo SUCCESS: firebase.json restored
)

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Created:
echo - node-backend\.env
echo - my-rhyme-app\.env.local
echo - my-rhyme-app\firebase.json (restored)
echo.
echo You can now run:
echo - cd node-backend ^&^& npm start
 