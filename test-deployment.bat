@echo off
echo ========================================
echo Deployment Diagnostic Tool
echo ========================================
echo.
echo This will test each step of deployment individually.
echo.

REM Test 1: Directory Structure
echo [TEST 1] Checking directory structure...
echo ----------------------------------------
if exist "my-rhyme-app" (
    echo ✓ Frontend directory found
) else (
    echo ✗ Frontend directory NOT FOUND!
)

if exist "node-backend" (
    echo ✓ Backend directory found
) else (
    echo ✗ Backend directory NOT FOUND!
)

if exist "cloudbuild-node.yaml" (
    echo ✓ Cloud Build config found
) else (
    echo ✗ Cloud Build config NOT FOUND!
)
echo.

REM Test 2: Environment Files
echo [TEST 2] Checking environment files...
echo ----------------------------------------
if exist "node-backend\.env" (
    echo ✓ Backend .env found
    echo   Contents preview:
    type "node-backend\.env" | findstr "ANTHROPIC_API_KEY PORT FRONTEND_URL" 2>nul
) else (
    echo ✗ Backend .env NOT FOUND!
    echo   Create node-backend\.env with:
    echo     ANTHROPIC_API_KEY=your_key_here
    echo     FRONTEND_URL=http://localhost:5173
    echo     PORT=3001
)
echo.

if exist "my-rhyme-app\.env.local" (
    echo ✓ Frontend .env.local found
    echo   Contents preview:
    type "my-rhyme-app\.env.local" | findstr "VITE_FIREBASE" 2>nul
) else (
    echo ✗ Frontend .env.local NOT FOUND!
    echo   Create my-rhyme-app\.env.local with Firebase config
)
echo.

REM Test 3: Git Repository
echo [TEST 3] Checking Git configuration...
echo ----------------------------------------
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ✗ Not a Git repository!
    echo   Run: git init
) else (
    echo ✓ Git repository found
    
    REM Check remote
    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        echo ✗ No remote configured!
        echo   Run: git remote add origin YOUR_GITHUB_URL
    ) else (
        echo ✓ Remote configured:
        git remote get-url origin
    )
    
    REM Check branch
    for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
    echo ✓ Current branch: %CURRENT_BRANCH%
)
echo.

REM Test 4: Node.js and npm
echo [TEST 4] Checking Node.js installation...
echo ----------------------------------------
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js not found!
    echo   Install from: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js version: %%i
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm not found!
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm version: %%i
)
echo.

REM Test 5: Package.json files
echo [TEST 5] Checking package.json files...
echo ----------------------------------------
if exist "my-rhyme-app\package.json" (
    echo ✓ Frontend package.json found
) else (
    echo ✗ Frontend package.json NOT FOUND!
)

if exist "node-backend\package.json" (
    echo ✓ Backend package.json found
) else (
    echo ✗ Backend package.json NOT FOUND!
)
echo.

REM Test 6: Build test
echo [TEST 6] Quick build test...
echo ----------------------------------------
set /p "RUN_BUILD=Do you want to test the build process? (y/n): "
if /i "%RUN_BUILD%"=="y" (
    echo.
    echo Testing frontend build...
    cd my-rhyme-app
    call npm run build >nul 2>&1
    if errorlevel 1 (
        echo ✗ Frontend build FAILED!
        echo   Run manually: cd my-rhyme-app && npm run build
    ) else (
        echo ✓ Frontend build successful!
    )
    cd ..
)
echo.

REM Summary
echo ========================================
echo DIAGNOSTIC SUMMARY
echo ========================================
echo.
echo If any tests failed above, fix those issues before running deploy-node.bat
echo.
echo Common issues:
echo 1. Missing .env files - Create them using setup-env.bat
echo 2. No Git remote - Set up GitHub repository
echo 3. Build errors - Check for TypeScript/import errors
echo.
echo To run deployment with full debugging:
echo   deploy-node.bat "Your commit message"
echo.
echo The deployment log will be saved to: deployment_log.txt
echo.
pause 