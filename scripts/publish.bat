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
set FORCE=--force-with-lease
set FORCE_MSG=with lease protection
if /i "%1"=="--force" (
  set FORCE=--force
  set FORCE_MSG=with FULL FORCE ^(overwrites remote^)
  shift
) else if /i "%1"=="--no-force" (
  set FORCE=
  set FORCE_MSG=without force
  shift
)

set msg=%*
if "%msg%"=="" set msg=🚀 MAJOR: Transform to Amazon PPC Agency for Educators - Complete platform migration

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
  echo ✅ DEPLOYMENT SUCCESSFUL >> "%LOG%"
  echo Amazon PPC Agency site is now live! >> "%LOG%"
  echo ============================================ >> "%LOG%"
  
  echo.
echo ✅ SUCCESS: Amazon PPC Agency pushed to GitHub!
echo.
echo 🎯 Git Push Complete:
echo    • Old book platform data overwritten
echo    • New PPC agency code is in repository
echo    • Educational market specialization active
echo.
echo 🚀 Next Steps:
echo    • Deploy to Firebase: scripts\deploy-firebase.bat
echo    • Or wait for CI/CD if configured
echo.
) else (
  echo ============================================ >> "%LOG%"
  echo ❌ DEPLOYMENT FAILED >> "%LOG%"
  echo ============================================ >> "%LOG%"
  
  echo.
  echo ❌ PUSH FAILED - See details below:
  echo.
  powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 30"
  echo.
  echo 💡 If you need to force overwrite the remote:
  echo    Run: scripts\publish.bat --force "Force deploy PPC agency"
  echo.
  pause
  exit /b 1
)

REM Show recent log entries
echo Recent deployment log:
powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 15"
pause
endlocal
