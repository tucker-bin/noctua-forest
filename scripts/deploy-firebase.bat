@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo NOCTUA FOREST PPC AGENCY - FIREBASE DEPLOYMENT
echo ============================================
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if not %errorlevel%==0 (
    echo ❌ ERROR: Firebase CLI not installed
    echo.
    echo To install Firebase CLI:
    echo   npm install -g firebase-tools
    echo.
    echo Then run: firebase login
    pause
    exit /b 1
)

echo ✅ Firebase CLI: OK
echo.

REM Check if logged in
firebase projects:list >nul 2>&1
if not %errorlevel%==0 (
    echo ⚠️  Not logged into Firebase
    echo Running: firebase login
    firebase login
    if not %errorlevel%==0 (
        echo ❌ Firebase login failed
        pause
        exit /b 1
    )
)

echo ✅ Firebase Authentication: OK
echo.

REM Show current project
echo 📋 Current Firebase project:
firebase use --current
echo.

REM Optional: Build step (if needed)
if exist "package.json" (
    echo 🔨 Building assets...
    npm run build >nul 2>&1 || echo "No build script found (OK for static site)"
)

REM Deploy to Firebase Hosting
echo 🚀 Deploying to Firebase Hosting...
echo.
firebase deploy --only hosting

if %errorlevel%==0 (
    echo.
    echo ============================================
    echo ✅ DEPLOYMENT SUCCESSFUL
    echo ============================================
    echo.
    echo 🎉 Your Amazon PPC Agency site is now live!
    echo.
    echo 🔗 Site URL: https://noctua-forest-ppc.web.app
    echo 📊 Console: https://console.firebase.google.com
    echo.
    echo The old book platform has been replaced with
    echo your new Amazon PPC agency site!
    echo.
) else (
    echo.
    echo ============================================
    echo ❌ DEPLOYMENT FAILED
    echo ============================================
    echo.
    echo Common issues:
    echo 1. Make sure you're logged in: firebase login
    echo 2. Check project settings: firebase use --current
    echo 3. Verify firebase.json configuration
    echo.
)

pause
endlocal
