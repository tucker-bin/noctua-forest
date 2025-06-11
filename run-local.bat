@echo off
setlocal enabledelayedexpansion

REM Find project root (where package.json exists)
set ROOT_DIR=%cd%
:find_pkg
if exist "%ROOT_DIR%\package.json" goto found_pkg
cd ..
if "%cd%"=="%ROOT_DIR%" goto not_found
set ROOT_DIR=%cd%
goto find_pkg
:found_pkg
cd /d "%ROOT_DIR%"
echo Project root found at %ROOT_DIR%

REM Start local development server (customize as needed)
echo ==========================================
echo Starting Local Development Server
echo ==========================================
REM Example: start backend and frontend (customize for your project)
start cmd /k "cd node-backend && npm install && npm run dev"
start cmd /k "cd my-rhyme-app && npm install && npm run dev"
goto end
:not_found
echo ERROR: Could not find project root (package.json not found).
goto end
:end
cd /d "%~dp0"
endlocal 