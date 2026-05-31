# check-api-status.ps1
# Quick health check for Mendix Expert API
#
# Usage: .\check-api-status.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "🔍 Mendix Expert API Health Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Check REST server
$restRunning = $false
$restPort = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
if ($restPort) {
    $restRunning = $true
    Write-Host "✅ REST Server: " -NoNewline -ForegroundColor Green
    Write-Host "Running on port 5050 (PID: $($restPort.OwningProcess | Select-Object -First 1))" -ForegroundColor White
    
    # Test health endpoint
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5050/health" -TimeoutSec 5
        Write-Host "   Health: $($health.status)" -ForegroundColor Gray
        Write-Host "   Initialized: $($health.initialized)" -ForegroundColor Gray
        Write-Host "   Vector Search: $($health.vectorSearchAvailable)" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ REST Server: " -NoNewline -ForegroundColor Red
    Write-Host "Not running" -ForegroundColor White
}

Write-Host ""

# Check ngrok
$ngrokRunning = $false
$ngrokProcess = Get-Process -Name ngrok -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    $ngrokRunning = $true
    Write-Host "✅ ngrok: " -NoNewline -ForegroundColor Green
    Write-Host "Running (PID: $($ngrokProcess.Id))" -ForegroundColor White
    
    # Get public URL
    try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5
        $publicUrl = $tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -ExpandProperty public_url -First 1
        if ($publicUrl) {
            Write-Host "   Public URL: " -NoNewline -ForegroundColor Gray
            Write-Host "$publicUrl" -ForegroundColor Yellow
            Write-Host "   Dashboard: http://127.0.0.1:4040" -ForegroundColor Gray
            
            # Test public endpoint
            try {
                $publicHealth = Invoke-RestMethod -Uri "$publicUrl/health" -TimeoutSec 10
                Write-Host "   Public Access: " -NoNewline -ForegroundColor Gray
                Write-Host "✅ Working" -ForegroundColor Green
            } catch {
                Write-Host "   Public Access: " -NoNewline -ForegroundColor Gray
                Write-Host "❌ Failed ($($_.Exception.Message))" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "   ⚠️  Could not get tunnel info" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ ngrok: " -NoNewline -ForegroundColor Red
    Write-Host "Not running" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray

# Summary and recommendations
if ($restRunning -and $ngrokRunning) {
    Write-Host ""
    Write-Host "🎉 All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ChatGPT OpenAPI URL: " -NoNewline -ForegroundColor White
    Write-Host "$publicUrl/openapi.json" -ForegroundColor Yellow
    Write-Host ""
} elseif (-not $restRunning -and -not $ngrokRunning) {
    Write-Host ""
    Write-Host "⚠️  API is offline. Start it with:" -ForegroundColor Yellow
    Write-Host "   .\start-chatgpt-api.ps1" -ForegroundColor Cyan
    Write-Host ""
} elseif (-not $restRunning) {
    Write-Host ""
    Write-Host "⚠️  REST server is down. Restart with:" -ForegroundColor Yellow
    Write-Host "   node src/rest-proxy.js" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  ngrok is down. Restart with:" -ForegroundColor Yellow
    Write-Host "   ngrok http 5050" -ForegroundColor Cyan
    Write-Host ""
}
