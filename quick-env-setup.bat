@echo off
echo Creating environment files...

REM Create node-backend/.env
echo # Backend Environment Variables > node-backend\.env
echo ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY_HERE >> node-backend\.env
echo PORT=3001 >> node-backend\.env
echo FRONTEND_URL=http://localhost:5173 >> node-backend\.env

REM Create my-rhyme-app/.env.local
echo # Frontend Environment Variables - Firebase Config > my-rhyme-app\.env.local
echo VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE >> my-rhyme-app\.env.local
echo VITE_FIREBASE_AUTH_DOMAIN=my-rhyme-app.firebaseapp.com >> my-rhyme-app\.env.local
echo VITE_FIREBASE_PROJECT_ID=my-rhyme-app >> my-rhyme-app\.env.local
echo VITE_FIREBASE_STORAGE_BUCKET=my-rhyme-app.appspot.com >> my-rhyme-app\.env.local
echo VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID_HERE >> my-rhyme-app\.env.local
echo VITE_FIREBASE_APP_ID=YOUR_APP_ID_HERE >> my-rhyme-app\.env.local
echo VITE_API_URL=http://localhost:3001 >> my-rhyme-app\.env.local

REM Copy firebase.json
copy /Y firebase.json my-rhyme-app\firebase.json >nul

echo.
echo DONE! Created:
echo - node-backend\.env
echo - my-rhyme-app\.env.local
echo - my-rhyme-app\firebase.json
echo.
echo NOW YOU NEED TO:
echo 1. Open node-backend\.env and replace YOUR_ANTHROPIC_KEY_HERE
echo 2. Open my-rhyme-app\.env.local and replace:
echo    - YOUR_FIREBASE_API_KEY_HERE
echo    - YOUR_SENDER_ID_HERE
echo    - YOUR_APP_ID_HERE
echo.
echo With your actual values from your parent .env file
echo.
pause 