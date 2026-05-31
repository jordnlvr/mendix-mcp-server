@echo off
title Start ngrok Tunnel for Mendix Expert
color 0E

echo.
echo ========================================
echo   ngrok Tunnel for ChatGPT Integration
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] ngrok is not installed or not in PATH!
    echo.
    echo Install ngrok:
    echo   1. Download from: https://ngrok.com/download
    echo   2. Or install via: winget install ngrok
    echo   3. Run: ngrok authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)

echo Checking if REST server is running on port 5050...
curl -s http://localhost:5050/health >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [WARNING] REST server is NOT running on port 5050!
    echo.
    echo Start the server first:
    echo   run start-rest-server.bat
    echo.
    echo Or use start-all.bat to launch both together.
    echo.
    pause
    exit /b 1
)

color 0A
echo [OK] REST server is running on port 5050
echo.
echo Starting ngrok tunnel...
echo.
echo IMPORTANT: Copy the "Forwarding" HTTPS URL for ChatGPT:
echo   Example: https://xxxx-xx-xx-xxx-xx.ngrok-free.app
echo.
echo Press Ctrl+C to stop the tunnel when done.
echo.
echo ========================================

ngrok http 5050
