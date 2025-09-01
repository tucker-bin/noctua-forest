@echo off
echo Updating Firebase Auth Domain configuration...
node update-auth-domain.js
if %ERRORLEVEL% NEQ 0 (
    echo Migration failed. Check the error messages above.
    exit /b 1
)
echo.
echo Migration completed. Follow the next steps displayed above.
pause
