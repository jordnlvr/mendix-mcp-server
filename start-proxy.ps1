# Start Railway SSE Proxy Server
# This must be running for Copilot to access mendix-expert

Write-Host "🚀 Starting Railway SSE Proxy..." -ForegroundColor Cyan
Write-Host ""

cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

Write-Host "📡 Proxy will run at: http://localhost:3000/sse" -ForegroundColor Yellow
Write-Host "🌐 Railway backend: https://mendix-mcp-server-production.up.railway.app" -ForegroundColor Yellow
Write-Host ""
Write-Host "Keep this window open while using Copilot!" -ForegroundColor Green
Write-Host ""

node .vscode/railway-sse-proxy.js
