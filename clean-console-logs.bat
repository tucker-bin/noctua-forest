@echo off
REM Script to clean up console.log statements

echo ==========================================
echo Console.log Cleanup Script
echo ==========================================
echo.

REM Create backup directory
if not exist "backup" mkdir backup

echo Creating backups before modifications...
echo.

REM Backup files that contain console.log
xcopy /Y "node-backend\index.js" "backup\" >nul 2>&1
xcopy /Y "my-rhyme-app\src\contexts\AuthContext.tsx" "backup\" >nul 2>&1
xcopy /Y "my-rhyme-app\src\pages\TopUpTokens.tsx" "backup\" >nul 2>&1
xcopy /Y "my-rhyme-app\src\pages\Analysis.tsx" "backup\" >nul 2>&1
xcopy /Y "my-rhyme-app\src\components\*.tsx" "backup\" >nul 2>&1

echo Backups created in 'backup' directory.
echo.

echo Cleaning console.log statements...
echo.

REM Use PowerShell to comment out console.log statements
powershell -Command "& {
    # Define files to process
    $files = @(
        'node-backend\index.js',
        'my-rhyme-app\src\contexts\AuthContext.tsx',
        'my-rhyme-app\src\pages\TopUpTokens.tsx',
        'my-rhyme-app\src\pages\Analysis.tsx',
        'my-rhyme-app\src\components\UsageDashboard.tsx',
        'my-rhyme-app\src\components\NewsletterSignup.tsx',
        'my-rhyme-app\src\components\Navbar.tsx',
        'my-rhyme-app\src\components\Drawer.tsx',
        'my-rhyme-app\src\components\AdminDashboard.tsx'
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host Processing $file...
            $content = Get-Content $file -Raw
            
            # Comment out console.log/error/warn statements
            $content = $content -replace '(\s*)(console\.(log|error|warn)\(.*?\);)', '$1// $2'
            
            # For multiline console statements, handle them too
            $content = $content -replace '(\s*)(console\.(log|error|warn)\([^;]*?\n[^;]*?\);)', '$1/* $2 */'
            
            Set-Content -Path $file -Value $content
            Write-Host $file processed.
        }
    }
    
    Write-Host
    Write-Host 'Console.log cleanup complete!'
}"

echo.
echo Would you like to use a proper logging library instead? (Recommended)
echo.
pause 