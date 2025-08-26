@echo off
setlocal
cd /d "%~dp0.."

REM Check if Chrome exists in common locations
set "CHROME_PATH="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

REM Check for python
where python >nul 2>nul
set PYTHON_FOUND=%errorlevel%

REM Start local server
if %PYTHON_FOUND%==0 (
    echo Starting local server on http://localhost:8080
    if defined CHROME_PATH (
        start "" "%CHROME_PATH%" --incognito "http://localhost:8080/welcome.html"
    ) else (
        start "" http://localhost:8080/welcome.html
    )
    python -m http.server 8080
) else (
    echo Python not found. Opening welcome.html directly.
    if defined CHROME_PATH (
        start "" "%CHROME_PATH%" --incognito "welcome.html"
    ) else (
        start "" welcome.html
    )
)
endlocal

