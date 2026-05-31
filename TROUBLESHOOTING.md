# 🚨 Troubleshooting Guide - When Things Go Wrong

**Don't panic!** This guide will help you fix common issues.

---

## 🔍 DIAGNOSIS CHECKLIST

When something isn't working, start here:

### **1. Which server are you trying to use?**
- [ ] Fly.io MCP Server (for Claude Code/Copilot/Desktop)
- [ ] Railway REST API (for ChatGPT/n8n/web apps)

### **2. Is the server actually running?**

**Fly.io:**
```bash
flyctl status
# Should show: Status = running
```

**Railway:**
```bash
railway status
# OR visit: https://railway.app/project/your-project
```

### **3. Can you reach the health endpoint?**

**Fly.io:**
```bash
curl https://mendix-mcp-server.fly.dev/health
```

**Railway:**
```bash
curl https://mendix-mcp-server-production.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "initialized": true,
  "storage": "supabase",
  "entries": 321
}
```

---

## 🐛 COMMON ISSUES & FIXES

### **ISSUE: "Cannot connect to MCP server"**

**Symptoms:**
- Claude Code says "Connection failed"
- Copilot doesn't see @mendix-expert
- Desktop Claude doesn't respond to mendix-expert queries

**Diagnosis:**
```powershell
# Check config
cat $env:USERPROFILE\.claude\config.json

# Should contain:
# "mendix-expert": {
#   "type": "sse",
#   "url": "https://mendix-mcp-server.fly.dev/sse"
# }
```

**Fix:**
```powershell
# Run the configuration script
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Re-run config update (already done, but just in case)
# Or manually edit the config files
```

**Still broken?**
1. Check server is running: `flyctl status`
2. Check server logs: `flyctl logs --tail`
3. Restart the client (VS Code, Claude Desktop, etc.)

---

### **ISSUE: "Server returns 404"**

**Symptoms:**
- Trying to connect but getting 404 error
- Health check fails

**Diagnosis:**
Check you're using the correct URL:
- ✅ `https://mendix-mcp-server.fly.dev/sse` (MCP endpoint)
- ✅ `https://mendix-mcp-server.fly.dev/health` (Health check)
- ❌ `http://mendix-mcp-server.fly.dev` (wrong protocol)
- ❌ `https://mendix-mcp-server.fly.dev/mcp` (wrong path)

**Fix:**
Update config with correct URL (see above).

---

### **ISSUE: "Empty results" or "No knowledge found"**

**Symptoms:**
- Server responds but returns no results
- Knowledge base appears empty

**Diagnosis:**
```bash
# Check health endpoint
curl https://mendix-mcp-server.fly.dev/health

# Look for "entries" field - should be > 0
```

**Possible Causes:**

**1. Supabase connection failed:**
```bash
# Check secrets
flyctl secrets list

# Should see:
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_KEY
```

**Fix:**
```bash
flyctl secrets set SUPABASE_URL="https://uqiricziudqmwuyaeisj.supabase.co"
flyctl secrets set SUPABASE_ANON_KEY="your-anon-key"
flyctl secrets set SUPABASE_SERVICE_KEY="your-service-key"
```

**2. Supabase paused (free tier):**
- Go to https://supabase.com/dashboard
- Check if project is paused
- Wake it up if needed

**3. Database is actually empty:**
```bash
# Check Supabase dashboard
# Look at knowledge_entries table
# Should have 321+ rows
```

---

### **ISSUE: "Deployment failed"**

**Symptoms:**
- `flyctl deploy` fails
- Build errors
- Container won't start

**Diagnosis:**
```bash
flyctl logs
```

**Common Errors:**

**"Module not found":**
```bash
# Missing dependency
# Fix: Rebuild with clean install
flyctl deploy --no-cache
```

**"Port 8080 already in use":**
```bash
# Multiple instances trying to start
# Fix: Check fly.toml, should have:
# min_machines_running = 1
```

**"Out of memory":**
```bash
# Container using too much RAM
# Check: fly.toml should have:
# memory_mb = 256
# If needed, increase (costs money):
# memory_mb = 512
```

**"Health check failed":**
```bash
# Server not responding to /health
# Check logs: flyctl logs
# Verify /health endpoint works locally
```

---

### **ISSUE: "Claude Code authentication loop"**

**Symptoms:**
- Claude Code keeps asking to login
- Login completes but immediately asks again
- "Invalid API key" errors

**Diagnosis:**
```powershell
# Check for conflicting API key
[Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
```

**If it returns a value, that's the problem!**

**Fix:**
```powershell
# Remove the environment variable
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")

# Close ALL PowerShell windows
# Open new PowerShell
# Logout and re-authenticate
claude /logout
claude 'test'
# Choose "Claude.ai Subscription"
```

---

### **ISSUE: "VS Code doesn't see MCP server"**

**Symptoms:**
- Copilot doesn't show @mendix-expert
- No MCP tools available

**Diagnosis:**
```powershell
# Check VS Code settings
cat $env:APPDATA\Code\User\settings.json

# Look for github.copilot.chat.mcp section
```

**Fix:**
```powershell
# Update VS Code settings
# Add or update:
{
  "github.copilot.chat.mcp": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-mcp-server.fly.dev/sse"
    }
  }
}

# Restart VS Code
# Reload window: Ctrl+Shift+P → "Developer: Reload Window"
```

---

### **ISSUE: "Railway deployment stopped working"**

**Symptoms:**
- Custom ChatGPT returns errors
- n8n workflow fails
- REST API unreachable

**Diagnosis:**
```bash
# Check Railway dashboard
railway status

# Check logs
railway logs
```

**Common Causes:**

**1. Deployment failed:**
- Check GitHub repo
- Verify last commit
- Trigger manual redeploy: `railway up`

**2. Environment variables missing:**
- Check Railway dashboard → Variables
- Should have all Supabase, Pinecone, Azure OpenAI keys

**3. Service paused (free tier):**
- Railway pauses after 500 hours/month
- Upgrade to hobby plan ($5/mo) for always-on

---

### **ISSUE: "Slow responses"**

**Symptoms:**
- MCP server takes > 5 seconds to respond
- Timeouts

**Diagnosis:**
```bash
# Check server logs
flyctl logs --tail

# Look for:
# - Database connection errors
# - API rate limits
# - Memory warnings
```

**Possible Causes:**

**1. Cold start:**
- Fly.io free tier machines stop after inactivity
- First request wakes them up (slow)
- Solution: Upgrade to paid tier for always-on

**2. Supabase slow:**
- Free tier has connection limits
- Check Supabase dashboard for issues

**3. Pinecone slow:**
- Vector search can be slow on free tier
- Check Pinecone dashboard

**4. Too many entries:**
- 321+ entries might slow down some queries
- Consider adding caching (Redis)

---

## 🔄 NUCLEAR OPTIONS

**When all else fails:**

### **Option 1: Redeploy Fly.io from scratch**

```bash
# Destroy app
flyctl apps destroy mendix-mcp-server
# Confirm: y

# Navigate to project
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Launch fresh
flyctl launch --no-deploy

# Set secrets
.\flyio-secrets.ps1

# Deploy
flyctl deploy

# Update configs
# (run the PowerShell config script)
```

### **Option 2: Redeploy Railway from scratch**

```bash
# On Railway dashboard:
# 1. Delete service
# 2. Create new service
# 3. Connect GitHub repo
# 4. Add environment variables
# 5. Deploy
```

### **Option 3: Switch back to local MCP**

If cloud deployments are causing issues, you can always use local:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "npx",
      "args": ["@jordnlvr/mendix-mcp-server"]
    }
  }
}
```

**Pros:**
- Always works
- Faster (no network latency)
- Free

**Cons:**
- Only works on your machine
- Must be running locally

---

## 📞 GETTING HELP

### **Check These First:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understanding the system
2. [CONNECTION-GUIDE.md](./CONNECTION-GUIDE.md) - How to connect
3. [FLYIO-DEPLOYMENT.md](./FLYIO-DEPLOYMENT.md) - Fly.io specifics
4. [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md) - Railway specifics

### **Still Stuck?**

**Log Files to Check:**
```bash
# Fly.io
flyctl logs --tail

# Railway
railway logs

# Local development
npm run sse
# Check console output
```

**Information to Gather:**
- Which client? (Claude Code, Copilot, ChatGPT, etc.)
- Which server? (Fly.io or Railway)
- Error message (exact text)
- Health endpoint response
- Recent changes you made

### **Support Resources:**
- Fly.io: https://community.fly.io
- Railway: https://railway.app/help
- MCP Protocol: https://modelcontextprotocol.io
- This project issues: Check GitHub if you set it up

---

## 🧪 TEST SUITE

**Run this test suite to verify everything works:**

```powershell
Write-Host "🧪 MENDIX EXPERT MCP - FULL TEST SUITE" -ForegroundColor Cyan
Write-Host ""

# Test 1: Fly.io health
Write-Host "Test 1: Fly.io health check..." -ForegroundColor Yellow
$health = Invoke-RestMethod https://mendix-mcp-server.fly.dev/health
if ($health.status -eq "healthy") {
    Write-Host "  ✅ PASS - Fly.io is healthy" -ForegroundColor Green
} else {
    Write-Host "  ❌ FAIL - Fly.io unhealthy" -ForegroundColor Red
}

# Test 2: Railway health
Write-Host "Test 2: Railway health check..." -ForegroundColor Yellow
$health = Invoke-RestMethod https://mendix-mcp-server-production.up.railway.app/health
if ($health.status -eq "healthy") {
    Write-Host "  ✅ PASS - Railway is healthy" -ForegroundColor Green
} else {
    Write-Host "  ❌ FAIL - Railway unhealthy" -ForegroundColor Red
}

# Test 3: Knowledge base
Write-Host "Test 3: Knowledge base populated..." -ForegroundColor Yellow
if ($health.entries -gt 0) {
    Write-Host "  ✅ PASS - $($health.entries) entries found" -ForegroundColor Green
} else {
    Write-Host "  ❌ FAIL - No entries in knowledge base" -ForegroundColor Red
}

# Test 4: Claude Code config
Write-Host "Test 4: Claude Code config..." -ForegroundColor Yellow
$config = Get-Content "$env:USERPROFILE\.claude\config.json" | ConvertFrom-Json
if ($config.mcpServers.'mendix-expert'.url -eq "https://mendix-mcp-server.fly.dev/sse") {
    Write-Host "  ✅ PASS - Config correct" -ForegroundColor Green
} else {
    Write-Host "  ❌ FAIL - Config incorrect" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Test suite complete!" -ForegroundColor Cyan
```

---

**Last Updated:** December 29, 2025  
**If this doc doesn't help, ping Neo!** 🍺
