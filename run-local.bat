@echo off
REM Simple script to run Noctua Rhyme App locally

echo =====================================
echo Starting Noctua Rhyme App Locally
echo =====================================
echo.

REM Check if .env files exist
if not exist "node-backend\.env" (
    echo ERROR: node-backend\.env not found!
    echo Please create it with your ANTHROPIC_API_KEY
    echo.
    pause
    exit /b 1
)

if not exist "my-rhyme-app\.env.local" (
    echo ERROR: my-rhyme-app\.env.local not found!
    echo Please create it with your Firebase config
    echo.
    pause
    exit /b 1
)

REM Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd node-backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend dev server
echo Starting frontend dev server...
start "Frontend Dev Server" cmd /k "cd my-rhyme-app && npm run dev"

echo.
echo ✅ App is starting up!
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Press Ctrl+C in each window to stop the servers.
echo. 