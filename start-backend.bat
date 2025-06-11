@echo off
echo ========================================
echo STARTING BACKEND SERVER
echo ========================================
echo.

cd node-backend

REM Check if .env exists
if not exist .env (
    echo ERROR: node-backend\.env file not found!
    echo.
    echo Please create node-backend\.env with:
    echo - ANTHROPIC_API_KEY=your_key_here
    echo - PORT=3001
    echo - FRONTEND_URL=http://localhost:5173
    echo.
    pause
    exit /b 1
)

echo Starting Node.js backend on port 3001...
echo.
npm start

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Backend failed to start
    echo Check the error messages above
    pause
) 