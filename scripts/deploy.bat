@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo NOCTUA FOREST PPC AGENCY - COMPLETE DEPLOYMENT
echo ============================================
echo.

echo 🎯 This script will:
echo    1. Push your changes to GitHub
echo    2. Deploy to Firebase Hosting
echo    3. Show you the live site
echo.

set /p "PROCEED=Continue with deployment? (Y/n): "
if /i "%PROCEED%"=="n" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo ============================================
echo STEP 1: PUSHING TO GITHUB
echo ============================================
echo.

call scripts\publish.bat

if not %errorlevel%==0 (
    echo ❌ GitHub push failed. Stopping deployment.
    pause
    exit /b 1
)

echo.
echo ============================================
echo STEP 2: DEPLOYING TO FIREBASE
echo ============================================
echo.

call scripts\deploy-firebase.bat

if %errorlevel%==0 (
    echo.
    echo ============================================
    echo 🎉 DEPLOYMENT COMPLETE!
    echo ============================================
    echo.
    echo ✅ GitHub: Updated
    echo ✅ Firebase: Deployed
    echo 💰 Hosting: $0-2/month (vs $15-30 with Cloud Run)
    echo.
    echo 🔗 Your Amazon PPC Agency is now live!
    echo.
    echo 📊 Manage your site:
    echo    Firebase Console: https://console.firebase.google.com
    echo    GitHub Repository: https://github.com/[your-username]/[your-repo]
    echo.
) else (
    echo ❌ Firebase deployment failed. Check the error messages above.
)

pause
endlocal
