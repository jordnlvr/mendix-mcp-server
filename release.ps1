# Release Script for mendix-expert MCP Server
# Usage: .\release.ps1 -Version "2.2.0" -Message "Release description"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Releasing mendix-expert v$Version" -ForegroundColor Cyan

# 1. Update package.json version
Write-Host "📦 Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# 2. Update config/default.json version
Write-Host "⚙️ Updating config/default.json..." -ForegroundColor Yellow
$configJson = Get-Content "config/default.json" -Raw | ConvertFrom-Json
$configJson.server.version = $Version
$configJson | ConvertTo-Json -Depth 10 | Set-Content "config/default.json"

# 3. Validate knowledge base
Write-Host "🔍 Validating knowledge base..." -ForegroundColor Yellow
$validation = node -e "
const KM = require('./src/core/KnowledgeManager.js');
const km = new KM('./knowledge');
km.validateKnowledgeBase().then(r => {
    console.log(JSON.stringify(r.summary));
    if (r.summary.errors > 0) process.exit(1);
});
"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Validation failed! Fix errors before releasing." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Validation passed" -ForegroundColor Green

# 4. Git operations
Write-Host "📝 Committing changes..." -ForegroundColor Yellow
git add -A
git commit -m "release: v$Version - $Message"

Write-Host "🏷️ Creating tag v$Version..." -ForegroundColor Yellow
git tag -a "v$Version" -m "$Message"

Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
git push origin "v$Version"

Write-Host ""
Write-Host "✅ Release v$Version complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Go to https://github.com/jordnlvr/mendix-mcp-server/releases"
Write-Host "  2. Click 'Draft a new release'"
Write-Host "  3. Select tag v$Version"
Write-Host "  4. Add release notes from CHANGELOG.md"
Write-Host ""
