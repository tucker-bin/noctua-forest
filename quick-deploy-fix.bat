@echo off
echo ========================================
echo QUICK DEPLOYMENT FIX
echo ========================================
echo.

REM Step 1: Create missing environment files
echo [1/4] Creating environment files...
echo ----------------------------------------

if not exist "node-backend\.env" (
    echo Creating node-backend\.env...
    (
        echo # Backend Configuration
        echo ANTHROPIC_API_KEY=your_anthropic_api_key
        echo FRONTEND_URL=http://localhost:5173
        echo PORT=3001
    ) > node-backend\.env
    echo Created node-backend\.env - PLEASE ADD YOUR ACTUAL API KEY!
) else (
    echo Backend .env already exists
)

if not exist "my-rhyme-app\.env.local" (
    echo Creating my-rhyme-app\.env.local...
    (
        echo # Firebase Configuration - REPLACE WITH YOUR VALUES
        echo VITE_FIREBASE_API_KEY=your_firebase_api_key
        echo VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
        echo VITE_FIREBASE_PROJECT_ID=your-project-id
        echo VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
        echo VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
        echo VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
    ) > my-rhyme-app\.env.local
    echo Created my-rhyme-app\.env.local - PLEASE ADD YOUR FIREBASE CONFIG!
) else (
    echo Frontend .env.local already exists
)

echo.
echo [2/4] Cleaning old build artifacts...
echo ----------------------------------------
if exist "my-rhyme-app\dist" (
    echo Removing dist folder...
    rmdir /s /q "my-rhyme-app\dist" 2>nul
)
if exist "my-rhyme-app\.vite" (
    echo Removing .vite cache...
    rmdir /s /q "my-rhyme-app\.vite" 2>nul
)
echo Clean complete!

echo.
echo [3/4] Quick lint fix (auto-fixable issues)...
echo ----------------------------------------
cd my-rhyme-app
echo Running ESLint auto-fix...
call npx eslint . --fix --quiet 2>nul
cd ..

echo.
echo [4/4] Testing build without clean script...
echo ----------------------------------------
cd my-rhyme-app
echo Building frontend directly...
call npx vite build
if errorlevel 1 (
    echo Build failed! Check for TypeScript errors.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo FIXES APPLIED!
echo ========================================
echo.
echo Next steps:
echo 1. Edit the .env files with your actual values
echo 2. Fix remaining lint errors manually (optional)
echo 3. Run deployment again: deploy-node.bat "Your message"
echo.
pause 