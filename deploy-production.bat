@echo off
REM Simple script to deploy to production via GitHub CI/CD

echo ==========================================
echo Deploy to Production via GitHub CI/CD
echo ==========================================
echo.

REM Get commit message
set /p commit_msg="Enter commit message: "
if "%commit_msg%"=="" set commit_msg=Update production

REM Check git status
echo Checking git status...
git status --short

echo.
set /p confirm="Deploy these changes to production? (y/n): "
if /i not "%confirm%"=="y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Adding all changes...
git add -A

echo Committing changes...
git commit -m "%commit_msg%"

echo.
echo Pushing to GitHub (this will trigger CI/CD)...
git push origin main --force

echo.
echo ✅ Pushed to GitHub!
echo.
echo The CI/CD pipeline will now:
echo 1. Build the frontend
echo 2. Deploy to Firebase Hosting
echo 3. Deploy backend to Cloud Run
echo.
echo Check your GitHub Actions or Cloud Build for progress.
echo.
pause 