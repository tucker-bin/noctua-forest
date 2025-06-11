@echo off
echo ========================================
echo Cleaning up deprecated directories...
echo ========================================
echo.

REM Remove Python virtual environment
if exist venv (
    echo Removing venv...
    rmdir /s /q venv
    echo Done.
) else (
    echo venv not found, skipping...
)

REM Remove old Flask source
if exist src (
    echo Removing src...
    rmdir /s /q src
    echo Done.
) else (
    echo src not found, skipping...
)

REM Remove Grafana monitoring
if exist grafana (
    echo Removing grafana...
    rmdir /s /q grafana
    echo Done.
) else (
    echo grafana not found, skipping...
)

REM Remove Flask static files
if exist static (
    echo Removing static...
    rmdir /s /q static
    echo Done.
) else (
    echo static not found, skipping...
)

REM Remove Flask templates
if exist templates (
    echo Removing templates...
    rmdir /s /q templates
    echo Done.
) else (
    echo templates not found, skipping...
)

REM Remove old public build
if exist public (
    echo Removing public...
    rmdir /s /q public
    echo Done.
) else (
    echo public not found, skipping...
)

REM Remove Python cache
if exist __pycache__ (
    echo Removing __pycache__...
    rmdir /s /q __pycache__
    echo Done.
) else (
    echo __pycache__ not found, skipping...
)

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo Removed files:
echo - app.py (Flask backend)
echo - requirements.txt (Python deps)
echo - Dockerfile (Python container)
echo - prometheus.yml (monitoring)
echo - docker-compose.monitoring.yml
echo - cloudbuild.yaml (old deployment)
echo - cloudbuild-minimal.yaml
echo.
echo Run this script to remove directories.
echo.
pause 