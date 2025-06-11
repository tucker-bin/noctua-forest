@echo off
setlocal enabledelayedexpansion

REM Keep window open on error
if "%1"=="--keep-open" (
    shift
    set KEEP_OPEN=1
) else (
    set KEEP_OPEN=0
)

REM Set up logging
set "LOG_FILE=%~dp0deployment_log.txt"
echo ======================================== > "%LOG_FILE%"
echo Deployment started at %date% %time% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

REM Check for commit message argument
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update Node.js backend and React frontend"

echo ========================================
echo Deployment Script for Node.js Backend
echo ========================================
echo.
echo Deployment started at %date% %time%
echo Commit message: "%COMMIT_MSG%"
echo.

REM Set project paths
set "PROJECT_ROOT=%cd%"
set "FRONTEND_DIR=%PROJECT_ROOT%\my-rhyme-app"
set "BACKEND_DIR=%PROJECT_ROOT%\node-backend"

echo Project paths:
echo   Root: %PROJECT_ROOT%
echo   Frontend: %FRONTEND_DIR%
echo   Backend: %BACKEND_DIR%
echo.
echo Project paths: >> "%LOG_FILE%"
echo   Root: %PROJECT_ROOT% >> "%LOG_FILE%"
echo   Frontend: %FRONTEND_DIR% >> "%LOG_FILE%"
echo   Backend: %BACKEND_DIR% >> "%LOG_FILE%"

REM Check if directories exist
if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found at %FRONTEND_DIR%
    echo ERROR: Frontend directory not found >> "%LOG_FILE%"
    goto :error_exit
)

if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    echo ERROR: Backend directory not found >> "%LOG_FILE%"
    goto :error_exit
)

REM Check for .env files
echo.
echo Checking environment files...
if not exist "%BACKEND_DIR%\.env" (
    echo WARNING: No .env file found in backend!
    echo WARNING: Create %BACKEND_DIR%\.env with your API keys
    echo WARNING: No backend .env file >> "%LOG_FILE%"
    pause
)

if not exist "%FRONTEND_DIR%\.env.local" (
    echo WARNING: No .env.local file found in frontend!
    echo WARNING: Create %FRONTEND_DIR%\.env.local with Firebase config
    echo WARNING: No frontend .env.local file >> "%LOG_FILE%"
    pause
)

REM Frontend checks
echo.
echo [1/5] Running frontend checks...
echo ----------------------------------------
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to change to frontend directory
    echo ERROR: Failed to change to frontend directory >> "%LOG_FILE%"
    goto :error_exit
)

echo Current directory: %cd%
echo Installing frontend dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    echo ERROR: npm install failed in frontend >> "%LOG_FILE%"
    echo.
    echo Common fixes:
    echo - Check your internet connection
    echo - Delete node_modules and package-lock.json, then try again
    echo - Run: npm cache clean --force
    goto :error_exit
)

echo.
echo Running lint...
call npm run lint 2>&1
if errorlevel 1 (
    echo WARNING: Linting issues found. Consider fixing them.
    echo WARNING: Linting issues >> "%LOG_FILE%"
    echo Press any key to continue anyway...
    pause >nul
)

echo.
echo Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    echo ERROR: Frontend build failed >> "%LOG_FILE%"
    echo.
    echo Check for:
    echo - TypeScript errors
    echo - Missing imports
    echo - Environment variables in .env.local
    goto :error_exit
)
echo Frontend build successful!

REM Backend checks
echo.
echo [2/5] Running backend checks...
echo ----------------------------------------
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to change to backend directory
    echo ERROR: Failed to change to backend directory >> "%LOG_FILE%"
    goto :error_exit
)

echo Current directory: %cd%
echo Installing backend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    echo ERROR: npm install failed in backend >> "%LOG_FILE%"
    goto :error_exit
)
echo Backend dependencies installed!

REM Test backend startup (optional)
echo.
echo Testing backend startup...
echo Starting backend test... >> "%LOG_FILE%"
start /B cmd /c "node index.js" > backend_test.log 2>&1
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1
if exist backend_test.log (
    echo Backend test output:
    type backend_test.log
    type backend_test.log >> "%LOG_FILE%"
    del backend_test.log
)

REM Git operations
echo.
echo [3/5] Preparing Git commit...
echo ----------------------------------------
cd /d "%PROJECT_ROOT%"
if errorlevel 1 (
    echo ERROR: Failed to return to project root
    goto :error_exit
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ERROR: Not a git repository!
    echo.
    echo To initialize:
    echo   git init
    echo   git remote add origin YOUR_GITHUB_REPO_URL
    echo   git branch -M main
    echo.
    goto :error_exit
)

REM Check git remote
echo Checking git remote...
git remote -v
git remote -v >> "%LOG_FILE%"
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ERROR: No git remote configured!
    echo.
    echo Add your GitHub repository:
    echo   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    goto :error_exit
)

REM Check for uncommitted changes
git status --porcelain > git_status.tmp
set /p GIT_STATUS=<git_status.tmp
del git_status.tmp
if "%GIT_STATUS%"=="" (
    echo No changes to commit.
    echo No changes to commit >> "%LOG_FILE%"
    goto :deployment_info
)

echo.
echo Git status:
git status --short
git status --short >> "%LOG_FILE%"

echo.
echo Adding all changes...
git add . 2>&1
if errorlevel 1 (
    echo ERROR: Git add failed!
    echo ERROR: Git add failed >> "%LOG_FILE%"
    goto :error_exit
)

echo Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%" 2>&1
if errorlevel 1 (
    echo ERROR: Git commit failed!
    echo ERROR: Git commit failed >> "%LOG_FILE%"
    echo.
    echo This might mean no changes to commit.
    goto :push_anyway
)

:push_anyway
echo.
echo [4/5] Pushing to GitHub...
echo ----------------------------------------
echo Pushing to origin/main...
git push origin main 2>&1
if errorlevel 1 (
    echo ERROR: Git push failed!
    echo ERROR: Git push failed >> "%LOG_FILE%"
    echo.
    echo Common fixes:
    echo 1. If this is your first push:
    echo      git push -u origin main
    echo.
    echo 2. If the remote has changes:
    echo      git pull origin main --rebase
    echo      git push origin main
    echo.
    echo 3. Check your GitHub credentials:
    echo      git config user.name
    echo      git config user.email
    goto :error_exit
)

echo Push successful!
echo Push successful >> "%LOG_FILE%"

:deployment_info
echo.
echo [5/5] Deployment Status
echo ========================================
echo.
echo Git push completed successfully!
echo.
echo IMPORTANT: Cloud Build Trigger
echo ----------------------------------------
echo The push should trigger Cloud Build automatically IF:
echo.
echo 1. You have a Cloud Build trigger configured for your repo
echo 2. The trigger is watching the 'main' branch
echo 3. The trigger uses '/cloudbuild-node.yaml'
echo.
echo To check Cloud Build status:
echo   https://console.cloud.google.com/cloud-build/builds
echo.
echo To set up Cloud Build trigger:
echo   https://console.cloud.google.com/cloud-build/triggers
echo.
echo Once deployed, your services will be at:
echo   Frontend: https://your-project-id.web.app
echo   Backend: https://my-rhyme-app-backend-xxxxx.run.app
echo.
echo ========================================
echo Deployment log saved to: %LOG_FILE%
echo ========================================
echo.
echo Deployment completed at %date% %time% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

REM Open log file
set /p "OPEN_LOG=Would you like to view the deployment log? (y/n): "
if /i "%OPEN_LOG%"=="y" (
    notepad "%LOG_FILE%"
)

REM Open Cloud Build console
set /p "OPEN_BUILD=Would you like to open Cloud Build console? (y/n): "
if /i "%OPEN_BUILD%"=="y" (
    start https://console.cloud.google.com/cloud-build/builds
)

echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error_exit
echo.
echo ========================================
echo DEPLOYMENT FAILED!
echo ========================================
echo Check the log file: %LOG_FILE%
echo.
echo Error occurred at %date% %time% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo.
echo Press any key to exit...
pause >nul
exit /b 1 