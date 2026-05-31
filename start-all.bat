@echo off
title Mendix Expert - Full Stack Launcher
color 0E

echo.
echo ========================================
echo   Mendix Expert MCP Server v3.1.1
echo   Full Stack Launcher
echo ========================================
echo.
echo This will start:
echo   1. REST API Server (port 5050)
echo   2. ngrok Tunnel (for ChatGPT)
echo.
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

REM Change to the server directory
cd /d "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server"

REM Kill any existing process on port 5050
echo Checking for existing server on port 5050...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050 ^| findstr LISTENING') do (
    echo Killing existing process on port 5050 (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

REM Start the REST server in a new window
echo Starting REST API Server...
start "Mendix Expert REST Server" cmd /k "color 0A && node src/rest-proxy.js"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Check if server started
curl -s http://localhost:5050/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting a bit longer...
    timeout /t 3 /nobreak >nul
)

curl -s http://localhost:5050/health >nul 2>&1
if %errorlevel% equ 0 (
    color 0A
    echo.
    echo [OK] REST Server is running!
    echo   Local: http://localhost:5050
    echo   Dashboard: http://localhost:5050/dashboard
    echo.
) else (
    color 0C
    echo [WARNING] Server may still be starting...
    echo.
)

echo Starting ngrok tunnel...
echo.
echo ========================================
echo AFTER ngrok starts, look for the "Forwarding" line:
echo   https://xxxx-xx-xx-xxx-xx.ngrok-free.app
echo.
echo Copy that URL and paste it into ChatGPT's
echo custom GPT action configuration.
echo ========================================
echo.

ngrok http 5050
