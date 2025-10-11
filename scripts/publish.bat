@echo off
setlocal
cd /d "%~dp0.."

echo ============================================
echo NOCTUA FOREST PPC AGENCY - DEPLOYMENT
echo ============================================
echo.

REM Simple message handling
set msg=%*
if "%msg%"=="" set msg=Update Amazon PPC Agency site

echo Deploying: %msg%
echo.

REM Check if we're in a git repository
git status >nul 2>&1
if not %errorlevel%==0 (
    echo ERROR: Not in a git repository
    echo.
    echo To fix:
    echo   git init
    echo   git remote add origin https://github.com/tucker-bin/noctua-forest.git
    echo.
    pause
    exit /b 1
)

echo Git repository: OK
echo.

REM Check remote
git remote get-url origin >nul 2>&1
if not %errorlevel%==0 (
    echo ERROR: No remote origin configured
    echo.
    echo To fix:
    echo   git remote add origin https://github.com/tucker-bin/noctua-forest.git
    echo.
    pause
    exit /b 1
)

echo Remote origin: OK
echo.

REM Create CNAME file to ensure custom domain setting is not erased
echo www.noctuaforest.com > CNAME

REM Stage all changes
echo Staging changes...
git add -A
if not %errorlevel%==0 (
    echo ERROR: Failed to stage changes
    pause
    exit /b 1
)

echo Staging: OK
echo.

REM Commit changes
echo Creating commit...
git commit -m "%msg%"
set COMMIT_RESULT=%errorlevel%

if %COMMIT_RESULT%==0 (
    echo Commit: OK
) else (
    echo No changes to commit (this is fine)
)
echo.

REM Push with force
echo Pushing to GitHub with force...
echo This will overwrite any remote changes.
echo.

git push -u origin main --force
set PUSH_RESULT=%errorlevel%

echo.
if %PUSH_RESULT%==0 (
    echo ============================================
    echo SUCCESS: DEPLOYED TO GITHUB!
    echo ============================================
    echo.
    echo Your Amazon PPC Agency has been deployed!
    echo.
    echo Live site: https://www.noctuaforest.com
    echo Repository: https://github.com/tucker-bin/noctua-forest
    echo.
    echo Your site will be live in 2-3 minutes!
    echo.
) else (
    echo ============================================
    echo ERROR: DEPLOYMENT FAILED
    echo ============================================
    echo.
    echo Push to GitHub failed.
    echo.
    echo Common fixes:
    echo 1. Check internet connection
    echo 2. Verify GitHub authentication: git config --list
    echo 3. Check remote URL: git remote -v
    echo.
    echo Manual commands to try:
    echo   git remote -v
    echo   git push -u origin main --force
    echo.
)

echo Press any key to close...
pause >nul
endlocal