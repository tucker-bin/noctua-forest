@echo off
REM Security Cleanup Script for Noctua Rhyme App
REM This script helps clean up security issues

setlocal enabledelayedexpansion

echo =========================================
echo Security Cleanup for Noctua Rhyme App
echo =========================================
echo.
echo WARNING: This script will help clean up security issues.
echo Make sure you have backed up your repository first!
echo.
pause

:menu
echo.
echo Select cleanup task:
echo 1. Remove sensitive files
echo 2. Clean git history (Remove exposed secrets)
echo 3. Check for remaining issues
echo 4. Generate security report
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto remove_sensitive
if "%choice%"=="2" goto clean_git
if "%choice%"=="3" goto check_issues
if "%choice%"=="4" goto security_report
if "%choice%"=="5" goto end

echo Invalid choice. Please try again.
goto menu

:remove_sensitive
echo.
echo Removing sensitive files...
echo.

REM Remove files that might contain secrets
if exist "PASTE_YOUR_ENV_HERE.txt" (
    echo Removing PASTE_YOUR_ENV_HERE.txt...
    del /f "PASTE_YOUR_ENV_HERE.txt"
)

if exist "my-rhyme-app\old.env" (
    echo Removing my-rhyme-app\old.env...
    del /f "my-rhyme-app\old.env"
)

if exist ".git\cloudbuild.yaml" (
    echo Removing .git\cloudbuild.yaml...
    del /f ".git\cloudbuild.yaml"
)

if exist "src\App.js" (
    echo Removing old src\App.js...
    del /f "src\App.js"
)

REM Remove old deployment scripts
echo.
echo Removing redundant deployment scripts...
set count=0
for %%f in (
    "cleanup-directories.bat"
    "create-env-files.bat"
    "deploy-node.bat"
    "deploy-production.bat"
    "deploy-simple.bat"
    "deploy-with-debug.bat"
    "env-helper.bat"
    "fix-clean-script.bat"
    "quick-deploy-fix.bat"
    "quick-env-setup.bat"
    "restore-firebase-config.bat"
    "setup-env-from-parent.bat"
    "setup-env-interactive.bat"
    "setup-env.bat"
    "start-backend.bat"
    "test-backend.bat"
    "test-deployment.bat"
    "FINAL_ENV_SETUP.bat"
    "run-deployment.cmd"
) do (
    if exist %%f (
        del /f %%f
        set /a count+=1
    )
)
echo Removed !count! redundant deployment scripts.

echo.
echo Sensitive files removed!
pause
goto menu

:clean_git
echo.
echo WARNING: This will rewrite git history!
echo This should only be done if you have exposed secrets.
echo.
set /p confirm="Are you SURE you want to continue? (type YES): "
if not "%confirm%"=="YES" goto menu

echo.
echo Cleaning git history...
echo.

REM Check if BFG Repo-Cleaner is available
where bfg >nul 2>&1
if errorlevel 1 (
    echo BFG Repo-Cleaner not found.
    echo.
    echo To install BFG:
    echo 1. Download from: https://rtyley.github.io/bfg-repo-cleaner/
    echo 2. Add to PATH
    echo.
    echo Alternative: Use git filter-branch (slower):
    echo.
    set /p usefilter="Use git filter-branch instead? (y/n): "
    if /i "!usefilter!"=="y" goto git_filter_branch
    pause
    goto menu
)

REM Use BFG to remove sensitive files
echo Using BFG to clean repository...
bfg --delete-files "PASTE_YOUR_ENV_HERE.txt" 
bfg --delete-files "old.env"
bfg --delete-files "cloudbuild.yaml"
bfg --delete-files "App.js" --no-blob-protection

echo.
echo Running git reflog and gc...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo Git history cleaned!
echo.
echo IMPORTANT: You must force push to remote:
echo   git push origin --force --all
echo   git push origin --force --tags
echo.
pause
goto menu

:git_filter_branch
echo Using git filter-branch (this may take a while)...
git filter-branch --force --index-filter ^
  "git rm --cached --ignore-unmatch PASTE_YOUR_ENV_HERE.txt my-rhyme-app/old.env .git/cloudbuild.yaml src/App.js" ^
  --prune-empty --tag-name-filter cat -- --all

echo.
echo Git history cleaned!
echo.
echo IMPORTANT: You must force push to remote:
echo   git push origin --force --all
echo   git push origin --force --tags
echo.
pause
goto menu

:check_issues
echo.
echo Checking for remaining security issues...
echo.

REM Check for .env files
echo Checking for .env files that might be committed...
git ls-files | findstr /i "\.env" >nul
if not errorlevel 1 (
    echo WARNING: Found .env files in git:
    git ls-files | findstr /i "\.env"
    echo.
)

REM Check for API keys in code
echo Checking for potential API keys in code...
findstr /s /i "api_key apiKey ANTHROPIC_API_KEY FIREBASE.*KEY" *.js *.ts *.tsx *.json 2>nul | findstr /v "node_modules" | findstr /v ".env" | findstr /v "example" | findstr /v "template" >temp_keys.txt
if exist temp_keys.txt (
    for /f %%i in ('find /c /v "" ^< temp_keys.txt') do set lines=%%i
    if !lines! gtr 0 (
        echo WARNING: Found potential API keys in code:
        type temp_keys.txt
        echo.
    )
    del temp_keys.txt
)

REM Check for console.log statements
echo Checking for console.log statements...
findstr /s /n "console\.log" *.js *.ts *.tsx 2>nul | findstr /v "node_modules" | find /c /v "" >temp_count.txt
set /p logcount=<temp_count.txt
del temp_count.txt
if !logcount! gtr 0 (
    echo Found !logcount! console.log statements in code.
    echo Consider removing these for production.
    echo.
)

echo Security check complete!
pause
goto menu

:security_report
echo.
echo Generating security report...
echo.

(
echo Security Report for Noctua Rhyme App
echo Generated: %date% %time%
echo =====================================
echo.
echo ## Files Checked:
echo.

REM Check sensitive files
echo ### Sensitive Files:
if exist "PASTE_YOUR_ENV_HERE.txt" echo - [EXISTS] PASTE_YOUR_ENV_HERE.txt
if exist "my-rhyme-app\old.env" echo - [EXISTS] my-rhyme-app\old.env
if exist ".git\cloudbuild.yaml" echo - [EXISTS] .git\cloudbuild.yaml
if exist "src\App.js" echo - [EXISTS] src\App.js
echo.

echo ### Environment Files:
if exist "node-backend\.env" echo - [EXISTS] node-backend\.env (OK if not in git^)
if exist "my-rhyme-app\.env.local" echo - [EXISTS] my-rhyme-app\.env.local (OK if not in git^)
echo.

echo ### Old Python Files:
if exist "app.py" echo - [EXISTS] app.py
if exist "requirements.txt" echo - [EXISTS] requirements.txt
if exist "Dockerfile" echo - [EXISTS] Dockerfile
if exist "venv" echo - [EXISTS] venv\
if exist "src" echo - [EXISTS] src\
if exist "templates" echo - [EXISTS] templates\
if exist "static" echo - [EXISTS] static\
echo.

echo ## Git Status:
echo.
git status --short
echo.

echo ## Recommendations:
echo 1. Remove all files marked [EXISTS] in Sensitive Files section
echo 2. Ensure .env files are in .gitignore
echo 3. Rotate any exposed API keys
echo 4. Remove old Python backend files
echo 5. Use Secret Manager for production deployments
echo.
) > SECURITY_REPORT.txt

echo Security report saved to SECURITY_REPORT.txt
type SECURITY_REPORT.txt
pause
goto menu

:end
echo.
echo Security cleanup complete!
echo Remember to:
echo 1. Rotate any exposed API keys
echo 2. Push changes to remote repository
echo 3. Set up Secret Manager for production
echo.
endlocal
exit /b 0 