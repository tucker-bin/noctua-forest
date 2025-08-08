@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

REM Ensure this working directory is marked safe to avoid 'dubious ownership'
git config --global --add safe.directory "%CD%" >nul 2>&1

git rev-parse --is-inside-work-tree >nul 2>&1 || (
  echo Not a git repository. Initialize and add a remote first.
  echo Example: git init ^&^& git remote add origin ^<your_repo_url^>
  exit /b 1
)

for /f %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURR_BRANCH=%%b
if "%CURR_BRANCH%"=="" set CURR_BRANCH=main
if /i "%CURR_BRANCH%"=="HEAD" set CURR_BRANCH=main

git remote get-url origin >nul 2>&1 || (
  echo No remote named "origin". Configure it with:
  echo   git remote add origin ^<your_repo_url^>
  exit /b 1
)

set FORCE=--force-with-lease
if /i "%1"=="--no-force" (
  set FORCE=
  shift
)

set msg=%*
if "%msg%"=="" set msg=chore: publish site

git add -A
git commit -m "%msg%" >nul 2>&1

echo Pushing to origin/%CURR_BRANCH% ...
git push -u origin %CURR_BRANCH% %FORCE%
if not %errorlevel%==0 (
  echo Push failed. Common fixes:
  echo - Ensure you have permission to push to the repo
  echo - If the remote has new commits, pull/rebase or use --no-force to avoid conflicts
  echo - Verify branch exists on remote: git ls-remote --heads origin %CURR_BRANCH%
  exit /b 1
)

echo Published to %CURR_BRANCH%. If Cloud Build trigger is configured, deployment will start.
endlocal

