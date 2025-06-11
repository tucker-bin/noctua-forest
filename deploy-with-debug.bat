@echo off
REM This wrapper ensures the deployment window stays open

echo ========================================
echo DEPLOYMENT WRAPPER WITH DEBUG MODE
echo ========================================
echo.
echo This will run deploy-node.bat and keep the window open.
echo.

REM Get commit message
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" (
    set /p "COMMIT_MSG=Enter commit message (or press Enter for default): "
)
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update Node.js backend and React frontend"

REM Run deployment
echo Running deployment with message: "%COMMIT_MSG%"
echo.
call deploy-node.bat "%COMMIT_MSG%"

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

echo.
echo ========================================
if %EXIT_CODE%==0 (
    echo DEPLOYMENT COMPLETED WITH EXIT CODE: %EXIT_CODE% (Success)
) else (
    echo DEPLOYMENT FAILED WITH EXIT CODE: %EXIT_CODE%
)
echo ========================================
echo.

REM Check deployment log
if exist "deployment_log.txt" (
    echo Deployment log exists. Last 20 lines:
    echo ----------------------------------------
    powershell -command "Get-Content deployment_log.txt -Tail 20"
    echo ----------------------------------------
    echo.
)

REM Keep window open
echo Press any key to close this window...
pause >nul 