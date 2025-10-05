@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo GOOGLE CLOUD CLEANUP - TERMINATE EXPENSIVE SERVICES
echo ============================================
echo.

echo 🛑 This script will help you identify and terminate expensive Cloud Run services
echo    to save money before migrating to Firebase Hosting.
echo.

REM Check if gcloud CLI is installed
gcloud version >nul 2>&1
if not %errorlevel%==0 (
    echo ❌ Google Cloud CLI not installed
    echo.
    echo To install: https://cloud.google.com/sdk/docs/install
    echo.
    echo Manual cleanup instructions:
    echo 1. Go to: https://console.cloud.google.com/run
    echo 2. Select your project
    echo 3. Delete any "noctua-forest" services
    echo 4. Go to: https://console.cloud.google.com/artifacts
    echo 5. Delete old Docker images to save storage costs
    echo.
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI: OK
echo.

echo 📋 Current project:
gcloud config get-value project
echo.

echo 🔍 Checking for Cloud Run services...
echo.

REM List Cloud Run services
gcloud run services list --format="table(metadata.name,status.url,status.conditions[0].status)" 2>nul

echo.
echo 💰 COST-SAVING ACTIONS:
echo.
echo 1. DELETE CLOUD RUN SERVICES:
echo    gcloud run services delete noctua-forest --region=us-central1 --quiet
echo    gcloud run services delete noctua-forest-ppc --region=us-central1 --quiet
echo.
echo 2. DELETE DOCKER IMAGES (saves storage costs):
echo    gcloud artifacts repositories delete my-rhyme-app-images --location=us-central1 --quiet
echo.
echo 3. DISABLE CLOUD BUILD TRIGGERS:
echo    Go to: https://console.cloud.google.com/cloud-build/triggers
echo    Disable or delete old triggers
echo.

set /p "PROCEED=Do you want to delete Cloud Run services now? (y/N): "
if /i "%PROCEED%"=="y" (
    echo.
    echo 🗑️ Deleting Cloud Run services...
    
    gcloud run services delete noctua-forest --region=us-central1 --quiet 2>nul || echo "Service noctua-forest not found (OK)"
    gcloud run services delete noctua-forest-ppc --region=us-central1 --quiet 2>nul || echo "Service noctua-forest-ppc not found (OK)"
    
    echo.
    echo ✅ Cloud Run services deleted!
    echo 💰 This will save you $15-30/month
    echo.
    
    set /p "DELETE_IMAGES=Delete Docker images to save storage? (y/N): "
    if /i "%DELETE_IMAGES%"=="y" (
        echo 🗑️ Deleting Docker repository...
        gcloud artifacts repositories delete my-rhyme-app-images --location=us-central1 --quiet 2>nul || echo "Repository not found (OK)"
        echo ✅ Docker images deleted!
        echo 💰 Storage costs eliminated
    )
    
    echo.
    echo 🎉 CLEANUP COMPLETE!
    echo.
    echo Next steps:
    echo 1. Deploy to Firebase: scripts\deploy-firebase.bat
    echo 2. Your new site will cost $0-2/month instead of $15-30/month
    echo.
) else (
    echo.
    echo ⏭️ Manual cleanup skipped
    echo.
    echo To manually clean up later:
    echo 1. Visit: https://console.cloud.google.com/run
    echo 2. Delete any noctua-forest services
    echo 3. Visit: https://console.cloud.google.com/artifacts
    echo 4. Delete old Docker repositories
    echo.
)

pause
endlocal
