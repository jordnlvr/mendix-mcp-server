# start-chatgpt-api.ps1
# Starts the Mendix Expert REST API and exposes it via ngrok for ChatGPT
# 
# Usage: .\start-chatgpt-api.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧠 Mendix Expert - ChatGPT API Launcher                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if REST server is already running
$existingProcess = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "⚠️  Port 5050 is already in use. Stopping existing process..." -ForegroundColor Yellow
    $pid = $existingProcess.OwningProcess | Select-Object -First 1
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start REST server
Write-Host "🚀 Starting REST API server..." -ForegroundColor Green
$restProcess = Start-Process -FilePath "node" -ArgumentList "src/rest-proxy.js" -WorkingDirectory $scriptDir -PassThru -WindowStyle Hidden
Write-Host "   REST server started (PID: $($restProcess.Id))" -ForegroundColor Gray

# Wait for server to be ready
Write-Host "   Waiting for server to initialize..." -ForegroundColor Gray
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5050/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($response.status -eq "healthy") {
            Write-Host "   ✅ REST server is healthy!" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
        $waited++
    }
}

if ($waited -ge $maxWait) {
    Write-Host "   ❌ REST server failed to start within $maxWait seconds" -ForegroundColor Red
    exit 1
}

# Start ngrok
Write-Host ""
Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Green

# Kill any existing ngrok processes
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start ngrok in background
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "5050" -PassThru -WindowStyle Hidden
Write-Host "   ngrok started (PID: $($ngrokProcess.Id))" -ForegroundColor Gray

# Wait for ngrok to establish tunnel
Start-Sleep -Seconds 3

# Get ngrok public URL from API
try {
    $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -ErrorAction Stop
    $publicUrl = $tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -ExpandProperty public_url -First 1
    
    if (-not $publicUrl) {
        $publicUrl = $tunnels.tunnels | Select-Object -ExpandProperty public_url -First 1
    }
} catch {
    Write-Host "   ⚠️  Could not retrieve ngrok URL. Check ngrok dashboard." -ForegroundColor Yellow
    $publicUrl = "Check http://127.0.0.1:4040"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🎉 Mendix Expert API is now PUBLIC!" -ForegroundColor Green
Write-Host ""
Write-Host "  📡 Public URL: " -NoNewline -ForegroundColor White
Write-Host "$publicUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🔧 Local URL:  http://localhost:5050" -ForegroundColor Gray
Write-Host "  📊 ngrok Dashboard: http://127.0.0.1:4040" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📋 ChatGPT Setup Instructions:" -ForegroundColor White
Write-Host "     1. Go to chat.openai.com → Create a Custom GPT" -ForegroundColor Gray
Write-Host "     2. Configure → Actions → Import from URL" -ForegroundColor Gray
Write-Host "     3. Enter: $publicUrl/openapi.json" -ForegroundColor Yellow
Write-Host "     4. Save and test your GPT!" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⏹️  To stop: Press Ctrl+C or close this window" -ForegroundColor Gray
Write-Host ""

# Keep script running and handle cleanup on exit
$cleanup = {
    Write-Host ""
    Write-Host "🛑 Shutting down..." -ForegroundColor Yellow
    Get-Process -Id $restProcess.Id -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Id $ngrokProcess.Id -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   Goodbye! 👋" -ForegroundColor Cyan
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup | Out-Null

# Wait for user to press Ctrl+C
try {
    Write-Host "Press Ctrl+C to stop..." -ForegroundColor DarkGray
    while ($true) {
        Start-Sleep -Seconds 60
        # Check if processes are still running
        if (-not (Get-Process -Id $restProcess.Id -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️  REST server stopped unexpectedly!" -ForegroundColor Red
            break
        }
    }
} finally {
    & $cleanup
}
