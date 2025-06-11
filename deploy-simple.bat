@echo off
echo ========================================
echo SIMPLIFIED DEPLOYMENT (No Lint Check)
echo ========================================
echo.

set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update application"

REM Quick environment check
if not exist "node-backend\.env" (
    echo ERROR: Missing node-backend\.env
    echo Run: quick-deploy-fix.bat first
    pause
    exit /b 1
)

echo [1/3] Building frontend (no lint)...
cd my-rhyme-app
call npx vite build --mode production
if errorlevel 1 (
    echo ERROR: Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Frontend built successfully!

echo.
echo [2/3] Git operations...
git add .
git commit -m "%COMMIT_MSG%" 2>nul
if errorlevel 1 (
    echo No changes to commit or commit failed
)

echo.
echo [3/3] Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ERROR: Push failed!
    echo Try: git pull origin main --rebase
    echo Then: git push origin main
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Check Cloud Build: https://console.cloud.google.com/cloud-build/builds
echo.
pause 