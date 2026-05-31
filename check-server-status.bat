@echo off
title Check Mendix Expert Server Status
color 0B

echo.
echo ========================================
echo   Mendix Expert Server Status Check
echo ========================================
echo.

echo Checking if server is running on port 5050...
echo.

curl -s http://localhost:5050/health >nul 2>&1
if %errorlevel% equ 0 (
    color 0A
    echo [OK] Server is RUNNING!
    echo.
    echo Fetching health status...
    curl -s http://localhost:5050/health
    echo.
    echo.
    echo Dashboard: http://localhost:5050/dashboard
    echo.
) else (
    color 0C
    echo [ERROR] Server is NOT running!
    echo.
    echo To start the server, run:
    echo   start-rest-server.bat
    echo.
    echo Or double-click the desktop shortcut.
)

echo.
pause
