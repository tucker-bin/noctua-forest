@echo off
setlocal enabledelayedexpansion

REM Find project root (where .git exists)
set ROOT_DIR=%cd%
:find_git
if exist "%ROOT_DIR%\.git" goto found_git
cd ..
if "%cd%"=="%ROOT_DIR%" goto not_found
set ROOT_DIR=%cd%
goto find_git
:found_git
cd /d "%ROOT_DIR%"
echo Project root found at %ROOT_DIR%

REM Proceed with production deploy
REM (Insert your production deploy commands below)
echo ==========================================
echo Deploy to Production via GitHub CI/CD
echo ==========================================

set /p commit_msg="Enter commit message: "
git status
if errorlevel 1 goto git_error
git add .
git commit -m "%commit_msg%"
git push
if errorlevel 1 goto git_error
echo.
echo Deploy these changes to production? (y/n): 
set /p confirm=
if /i not "%confirm%"=="y" goto end
REM Insert your deployment trigger here (e.g., call a GitHub Actions workflow or gcloud deploy)
echo Production deployment triggered via CI/CD pipeline.
goto end
:git_error
echo ERROR: Not a git repository or git command failed.
goto end
:not_found
echo ERROR: Could not find project root (.git directory not found).
goto end
:end
cd /d "%~dp0"
endlocal 