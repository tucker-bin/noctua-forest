@echo off
REM This opens deployment in a new window that won't close

start "Noctua Deployment" cmd /k deploy-node.bat %* 