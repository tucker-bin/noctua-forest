@echo off
echo ========================================
echo FINAL ENVIRONMENT SETUP STEPS
echo ========================================
echo.
echo STEP 1: Rename template files to actual env files
echo -------------------------------------------------
echo.
echo In node-backend folder:
echo   - Rename "env.template" to ".env"
echo.
echo In my-rhyme-app folder:
echo   - Rename "env.local.template" to ".env.local"
echo.
echo STEP 2: Replace placeholder values
echo ----------------------------------
echo.
echo In node-backend\.env replace:
echo   YOUR_ANTHROPIC_KEY_HERE with your actual Anthropic API key
echo.
echo In my-rhyme-app\.env.local replace:
echo   YOUR_FIREBASE_API_KEY_HERE with your Firebase API key
echo   YOUR_SENDER_ID_HERE with your Firebase sender ID
echo   YOUR_APP_ID_HERE with your Firebase app ID
echo.
echo STEP 3: Test your setup
echo -----------------------
echo.
echo Terminal 1:
echo   cd node-backend
echo   npm start
echo.
echo Terminal 2:
echo   cd my-rhyme-app
echo   npm run dev
echo.
echo Your app should be running at http://localhost:5173
echo.
pause 