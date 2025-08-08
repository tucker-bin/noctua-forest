@echo off
setlocal
cd /d "%~dp0.."

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server on http://localhost:8080
  start "" http://localhost:8080/books.html
  python -m http.server 8080
) else (
  echo Python not found. Opening books.html directly.
  start "" books.html
)
endlocal

