@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

set LOG=%CD%\scripts\publish.log
echo ==== NOCTUA FOREST PPC AGENCY PUBLISH %DATE% %TIME% ==== > "%LOG%"
echo Deploying Amazon PPC Agency transformation... >> "%LOG%"

REM Ensure this working directory is marked safe to avoid 'dubious ownership'
git config --global --add safe.directory "%CD%" >> "%LOG%" 2>&1

git rev-parse --is-inside-work-tree >> "%LOG%" 2>&1 || (
  echo Not a git repository. Initialize and add a remote first. >> "%LOG%"
  echo Example: git init ^&^& git remote add origin ^<your_repo_url^> >> "%LOG%"
  echo ERROR: Not a git repository. See scripts\publish.log for details.
  pause
  exit /b 1
)

for /f %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURR_BRANCH=%%b
if "%CURR_BRANCH%"=="" set CURR_BRANCH=main
if /i "%CURR_BRANCH%"=="HEAD" set CURR_BRANCH=main

git remote get-url origin >> "%LOG%" 2>&1 || (
  echo No remote named "origin". Configure it with: >> "%LOG%"
  echo   git remote add origin ^<your_repo_url^> >> "%LOG%"
  echo ERROR: Missing origin remote. See scripts\publish.log for details.
  pause
  exit /b 1
)

REM Check for force push options
REM Always use force to ensure deployment overwrites old data
set FORCE=--force
set FORCE_MSG=with FULL FORCE ^(overwrites remote^)

REM Allow custom message, but default to simple update
set msg=%*
if "%msg%"=="" set msg=Update site

echo ============================================ >> "%LOG%"
echo TRANSFORMATION DEPLOYMENT >> "%LOG%"
echo Branch: %CURR_BRANCH% >> "%LOG%"
echo Force mode: %FORCE_MSG% >> "%LOG%"
echo Message: %msg% >> "%LOG%"
echo ============================================ >> "%LOG%"

REM Show what's being deployed
echo Staging all changes for deployment... >> "%LOG%"
git status --porcelain >> "%LOG%" 2>&1

REM Add all changes including deletions
git add -A >> "%LOG%" 2>&1
if not %errorlevel%==0 (
  echo ERROR: Failed to stage changes. >> "%LOG%"
  echo Failed to stage changes. See scripts\publish.log for details.
  pause
  exit /b 1
)

REM Create commit with transformation details
git commit -m "%msg%" >> "%LOG%" 2>&1
set COMMIT_RESULT=%errorlevel%

if %COMMIT_RESULT%==0 (
  echo Commit created successfully. >> "%LOG%"
) else (
  echo No changes to commit or commit failed. >> "%LOG%"
  git status >> "%LOG%" 2>&1
)

REM Push with appropriate force level
echo ============================================ >> "%LOG%"
echo PUSHING TO GITHUB %FORCE_MSG% >> "%LOG%"
echo This will overwrite the old book platform data >> "%LOG%"
echo ============================================ >> "%LOG%"

git push -u origin %CURR_BRANCH% %FORCE% >> "%LOG%" 2>&1
set PUSH_RESULT=%errorlevel%

if %PUSH_RESULT%==0 (
  echo ============================================ >> "%LOG%"
  echo ✅ GITHUB PUSH SUCCESSFUL >> "%LOG%"
  echo Now deploying to Firebase... >> "%LOG%"
  echo ============================================ >> "%LOG%"
  
  echo.
  echo ✅ SUCCESS: Pushed to GitHub!
  echo.
  echo 🚀 Now deploying to Firebase Hosting...
  echo.
  
  REM Check if Firebase CLI is available
  echo Checking Firebase CLI... >> "%LOG%"
  firebase --version >> "%LOG%" 2>&1
  set FB_CLI_CHECK=%errorlevel%
  
  if !FB_CLI_CHECK!==0 (
    echo Firebase CLI found, proceeding with deployment... >> "%LOG%"
    echo.
    echo 🔥 Deploying to Firebase Hosting...
    echo.
    
    REM Deploy to Firebase with full output
    firebase deploy --only hosting --non-interactive
    set FIREBASE_RESULT=%errorlevel%
    
    REM Log the result
    echo Firebase deploy exit code: !FIREBASE_RESULT! >> "%LOG%"
    
    if !FIREBASE_RESULT!==0 (
      echo ============================================ >> "%LOG%"
      echo ✅ FIREBASE DEPLOYMENT SUCCESSFUL >> "%LOG%"
      echo Amazon PPC Agency is now LIVE! >> "%LOG%"
      echo ============================================ >> "%LOG%"
      
      echo.
      echo 🎉 COMPLETE SUCCESS!
      echo.
      echo ✅ GitHub: Updated
      echo ✅ Firebase: Deployed
      echo 🌐 Your Amazon PPC Agency is now live!
      echo.
      echo 🔗 Site URL: https://noctua-forest-ppc.web.app
      echo 📊 Manage: https://console.firebase.google.com
      echo.
      echo Press any key to close...
      pause >nul
    ) else (
      echo ============================================ >> "%LOG%"
      echo ❌ FIREBASE DEPLOYMENT FAILED >> "%LOG%"
      echo Exit code: !FIREBASE_RESULT! >> "%LOG%"
      echo ============================================ >> "%LOG%"
      
      echo.
      echo ❌ GitHub updated but Firebase deploy failed
      echo.
      echo Error details above. Common issues:
      echo.
      echo 1. Firebase CLI not installed:
      echo    npm install -g firebase-tools
      echo.
      echo 2. Not logged in:
      echo    firebase login
      echo.
      echo 3. Project not initialized:
      echo    firebase init hosting
      echo.
      echo 4. Wrong project selected:
      echo    firebase use [your-project-id]
      echo.
      echo Manual deploy command:
      echo   firebase deploy --only hosting
      echo.
      echo Press any key to continue...
      pause >nul
    )
  ) else (
    echo ============================================ >> "%LOG%"
    echo ❌ FIREBASE CLI NOT FOUND >> "%LOG%"
    echo ============================================ >> "%LOG%"
    
    echo.
    echo ❌ Firebase CLI not installed or not in PATH
    echo.
    echo To install Firebase CLI:
    echo   npm install -g firebase-tools
    echo.
    echo Then login:
    echo   firebase login
    echo.
    echo Then try again:
    echo   scripts\publish.bat
    echo.
    echo Press any key to continue...
    pause >nul
  )
) else (
  echo ============================================ >> "%LOG%"
  echo ❌ GITHUB PUSH FAILED >> "%LOG%"
  echo ============================================ >> "%LOG%"
  
  echo.
  echo ❌ PUSH FAILED - See details below:
  echo.
  powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 30"
  echo.
  echo The script uses --force to overwrite remote changes.
  echo Check the log above for specific error details.
  echo.
  echo Common GitHub issues:
  echo 1. No remote origin configured
  echo 2. Authentication problems
  echo 3. Repository doesn't exist
  echo.
  echo Press any key to continue...
  pause >nul
  exit /b 1
)

REM Show recent log entries
echo.
echo Recent deployment log:
powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 15"
echo.
echo Press any key to close...
pause >nul
endlocal
