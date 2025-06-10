@echo off
REM Check for commit message argument
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Auto commit"

REM Change to project directory
cd /d "C:\Users\User\Downloads\my-ryhme-app-main"

REM Git add, commit, and push
git add .
git commit -m "%COMMIT_MSG%"
git push