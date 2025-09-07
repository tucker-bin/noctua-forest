@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."

set LOG=%CD%\scripts\publish.log
echo ==== PUBLISH %DATE% %TIME% ==== > "%LOG%"

REM Ensure this working directory is marked safe to avoid 'dubious ownership'
git config --global --add safe.directory "%CD%" >> "%LOG%" 2>&1

git rev-parse --is-inside-work-tree >> "%LOG%" 2>&1 || (
  echo Not a git repository. Initialize and add a remote first. >> "%LOG%"
  echo Example: git init ^&^& git remote add origin ^<your_repo_url^> >> "%LOG%"
  echo Not a git repository. See scripts\publish.log for details.
  pause
  exit /b 1
)

for /f %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURR_BRANCH=%%b
if "%CURR_BRANCH%"=="" set CURR_BRANCH=main
if /i "%CURR_BRANCH%"=="HEAD" set CURR_BRANCH=main

git remote get-url origin >> "%LOG%" 2>&1 || (
  echo No remote named "origin". Configure it with: >> "%LOG%"
  echo   git remote add origin ^<your_repo_url^> >> "%LOG%"
  echo Missing origin remote. See scripts\publish.log for details.
  pause
  exit /b 1
)

set FORCE=--force-with-lease
if /i "%1"=="--no-force" (
  set FORCE=
  shift
)

set msg=%*
if "%msg%"=="" set msg=publish: site update

git add -A >> "%LOG%" 2>&1
git commit -m "%msg%" >> "%LOG%" 2>&1

echo Pushing to origin/%CURR_BRANCH% with %FORCE% ... >> "%LOG%"
git push -u origin %CURR_BRANCH% %FORCE% >> "%LOG%" 2>&1
if not %errorlevel%==0 (
  echo Push failed. See scripts\publish.log for details.
  powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 60"
  pause
  exit /b 1
)

echo Published to %CURR_BRANCH%. If Cloud Build trigger is configured, deployment will start.
powershell -NoProfile -Command "Get-Content -Path '%LOG%' -Tail 20"
pause
endlocal
