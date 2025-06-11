@echo off
echo Fixing the clean script issue...
echo.

cd my-rhyme-app

echo Installing rimraf locally...
npm install --save-dev rimraf

echo.
echo Testing clean command...
call npm run clean
if errorlevel 1 (
    echo Clean still failing, updating package.json...
    
    REM Create a backup
    copy package.json package.json.backup
    
    REM Use PowerShell to update the clean script
    powershell -Command "(Get-Content package.json) -replace '\"clean\": \"rimraf dist\"', '\"clean\": \"if exist dist rmdir /s /q dist\"' | Set-Content package.json"
    
    echo Updated clean script to use native Windows command
)

cd ..
echo.
echo Fix applied! Try deployment again.
pause 