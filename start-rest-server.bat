@echo off
title Mendix Expert REST Server
color 0A

echo.
echo ========================================
echo   Mendix Expert MCP Server v3.1.1
echo   REST API Server
echo ========================================
echo.

cd /d "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server"

echo Checking for existing processes on port 5050...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050 ^| findstr LISTENING') do (
    echo Killing existing process on port 5050 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting REST server on http://localhost:5050
echo NOTE: First startup takes ~10 seconds to initialize vector embeddings.
echo.
echo Dashboard: http://localhost:5050/dashboard
echo Health:    http://localhost:5050/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cmd /k "node src/rest-proxy.js"
