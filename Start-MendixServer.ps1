# Mendix Expert MCP Server - One-Click Launcher
# Run this script to start the REST server and optionally ngrok tunnel

$ServerDir = "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server"
$Port = 5050

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mendix Expert MCP Server v3.1.1" -ForegroundColor Green
Write-Host "  One-Click Launcher" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to server directory
Set-Location $ServerDir

# Kill any existing process on port
Write-Host "Checking for existing server on port $Port..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingProcess) {
    Write-Host "Stopping existing process (PID: $($existingProcess.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Run the server directly in THIS window (not a new one)
Write-Host ""
Write-Host "Starting REST server..." -ForegroundColor Green
Write-Host "NOTE: First startup takes ~10 seconds to initialize vector embeddings." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Dashboard: http://localhost:$Port/dashboard" -ForegroundColor Cyan
Write-Host "  Health:    http://localhost:$Port/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run node directly - keeps this window as the server
& node src/rest-proxy.js
