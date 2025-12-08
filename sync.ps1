# sync.ps1 - Easy sync helper for mendix-expert MCP server
# Usage: .\sync.ps1 [pull|push|status|both]

param(
    [Parameter(Position=0)]
    [ValidateSet('pull', 'push', 'status', 'both', 'help')]
    [string]$Action = 'status'
)

$ErrorActionPreference = "Stop"
$RepoPath = $PSScriptRoot

function Show-Banner {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  🔄 mendix-expert MCP Server Sync" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Get-SyncStatus {
    Show-Banner
    
    Write-Host "📍 Repository: " -NoNewline
    Write-Host $RepoPath -ForegroundColor Yellow
    Write-Host ""
    
    # Check for local changes
    $localChanges = git status --porcelain
    $hasLocalChanges = $localChanges.Length -gt 0
    
    # Fetch and check for remote changes
    Write-Host "🔍 Checking for remote updates..." -ForegroundColor Gray
    git fetch origin main 2>$null
    $behind = git rev-list HEAD..origin/main --count 2>$null
    $ahead = git rev-list origin/main..HEAD --count 2>$null
    
    Write-Host ""
    Write-Host "📊 Status:" -ForegroundColor White
    Write-Host "───────────────────────────────────────────────────"
    
    if ($hasLocalChanges) {
        Write-Host "  📝 Local changes: " -NoNewline
        Write-Host "YES - you have uncommitted changes" -ForegroundColor Yellow
    } else {
        Write-Host "  📝 Local changes: " -NoNewline
        Write-Host "No" -ForegroundColor Green
    }
    
    if ($behind -gt 0) {
        Write-Host "  📥 Behind remote: " -NoNewline
        Write-Host "$behind commits - updates available!" -ForegroundColor Yellow
    } else {
        Write-Host "  📥 Behind remote: " -NoNewline
        Write-Host "Up to date" -ForegroundColor Green
    }
    
    if ($ahead -gt 0) {
        Write-Host "  📤 Ahead of remote: " -NoNewline
        Write-Host "$ahead commits - need to push" -ForegroundColor Yellow
    } else {
        Write-Host "  📤 Ahead of remote: " -NoNewline
        Write-Host "Nothing to push" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Recommendations
    if ($hasLocalChanges -or $behind -gt 0 -or $ahead -gt 0) {
        Write-Host "💡 Recommended actions:" -ForegroundColor White
        Write-Host "───────────────────────────────────────────────────"
        
        if ($behind -gt 0) {
            Write-Host "  .\sync.ps1 pull   " -NoNewline -ForegroundColor Cyan
            Write-Host "# Get $behind update(s) from GitHub"
        }
        
        if ($hasLocalChanges) {
            Write-Host "  .\sync.ps1 push   " -NoNewline -ForegroundColor Cyan
            Write-Host "# Backup your local changes"
        }
        
        if ($behind -gt 0 -and ($hasLocalChanges -or $ahead -gt 0)) {
            Write-Host "  .\sync.ps1 both   " -NoNewline -ForegroundColor Cyan
            Write-Host "# Full sync (pull then push)"
        }
        Write-Host ""
    } else {
        Write-Host "✅ All synced! Nothing to do." -ForegroundColor Green
        Write-Host ""
    }
}

function Invoke-Pull {
    Show-Banner
    Write-Host "📥 Pulling updates from GitHub..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $result = git pull 2>&1
        Write-Host $result
        Write-Host ""
        Write-Host "✅ Pull complete!" -ForegroundColor Green
        
        # Record the pull in sync state
        $stateFile = Join-Path $RepoPath "data\sync-state.json"
        if (Test-Path $stateFile) {
            $state = Get-Content $stateFile | ConvertFrom-Json
            $state.lastPull = (Get-Date).ToString("o")
            $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
        }
    } catch {
        Write-Host "❌ Pull failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try resolving conflicts with:" -ForegroundColor Yellow
        Write-Host "  git status"
        Write-Host "  git merge --abort  # to cancel merge"
    }
    Write-Host ""
}

function Invoke-Push {
    Show-Banner
    Write-Host "📤 Pushing changes to GitHub..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check for changes
    $localChanges = git status --porcelain
    if ($localChanges.Length -eq 0) {
        Write-Host "ℹ️  No local changes to push." -ForegroundColor Gray
        Write-Host ""
        return
    }
    
    # Stage all changes
    Write-Host "📝 Staging changes..." -ForegroundColor Gray
    git add -A
    
    # Show what's being committed
    Write-Host "📋 Changes to commit:" -ForegroundColor Gray
    git status --short
    Write-Host ""
    
    # Get commit message
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"
    $defaultMsg = "Sync: Update $date"
    
    $msg = Read-Host "Commit message [$defaultMsg]"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = $defaultMsg
    }
    
    try {
        # Commit
        git commit -m $msg
        
        # Push
        Write-Host ""
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Gray
        git push
        
        Write-Host ""
        Write-Host "✅ Push complete!" -ForegroundColor Green
        
        # Record the push in sync state
        $stateFile = Join-Path $RepoPath "data\sync-state.json"
        if (Test-Path $stateFile) {
            $state = Get-Content $stateFile | ConvertFrom-Json
            $state.lastPush = (Get-Date).ToString("o")
            $state | ConvertTo-Json -Depth 10 | Set-Content $stateFile
        }
    } catch {
        Write-Host "❌ Push failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

function Invoke-BothSync {
    Show-Banner
    Write-Host "🔄 Full sync: Pull then Push" -ForegroundColor Cyan
    Write-Host ""
    
    # Pull first
    Write-Host "Step 1/2: Pulling updates..." -ForegroundColor Gray
    try {
        $pullResult = git pull 2>&1
        Write-Host $pullResult
        Write-Host "✅ Pull complete" -ForegroundColor Green
    } catch {
        Write-Host "❌ Pull failed: $_" -ForegroundColor Red
        Write-Host "Resolve conflicts before continuing." -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    
    # Then push
    Write-Host "Step 2/2: Pushing local changes..." -ForegroundColor Gray
    
    $localChanges = git status --porcelain
    if ($localChanges.Length -eq 0) {
        Write-Host "ℹ️  No local changes to push." -ForegroundColor Gray
    } else {
        git add -A
        $date = Get-Date -Format "yyyy-MM-dd HH:mm"
        git commit -m "Sync: Update $date"
        git push
        Write-Host "✅ Push complete" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Full sync complete!" -ForegroundColor Green
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "Usage: .\sync.ps1 [command]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  status  " -NoNewline -ForegroundColor Cyan
    Write-Host "Check sync status (default)"
    Write-Host "  pull    " -NoNewline -ForegroundColor Cyan
    Write-Host "Get updates from GitHub"
    Write-Host "  push    " -NoNewline -ForegroundColor Cyan
    Write-Host "Backup local changes to GitHub"
    Write-Host "  both    " -NoNewline -ForegroundColor Cyan
    Write-Host "Full sync (pull then push)"
    Write-Host "  help    " -NoNewline -ForegroundColor Cyan
    Write-Host "Show this help"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\sync.ps1           # Check status"
    Write-Host "  .\sync.ps1 pull      # Get updates"
    Write-Host "  .\sync.ps1 push      # Backup changes"
    Write-Host "  .\sync.ps1 both      # Full sync"
    Write-Host ""
}

# Main
Set-Location $RepoPath

switch ($Action) {
    'status' { Get-SyncStatus }
    'pull' { Invoke-Pull }
    'push' { Invoke-Push }
    'both' { Invoke-BothSync }
    'help' { Show-Help }
}
