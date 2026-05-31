# 📋 QUICK REFERENCE - Mendix Expert MCP Server

**Print this page and keep it handy!**

---

## 🌐 DEPLOYMENT URLs

```
Fly.io MCP:  https://mendix-mcp-server.fly.dev/sse
Railway API: https://mendix-mcp-server-production.up.railway.app
```

---

## 🔌 CLIENT CONFIGS

### Claude Code CLI
**File:** `C:\Users\kelly.seale\.claude\config.json`
```json
{
  "mcpServers": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-mcp-server.fly.dev/sse"
    }
  }
}
```

### VS Code Copilot
**File:** `%APPDATA%\Code\User\settings.json`
```json
{
  "github.copilot.chat.mcp": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-mcp-server.fly.dev/sse"
    }
  }
}
```

### Claude Desktop
**File:** `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-mcp-server.fly.dev/sse"
    }
  }
}
```

---

## ⚡ QUICK COMMANDS

### Fly.io Management
```bash
flyctl status              # Check server status
flyctl logs --tail         # Watch logs live
flyctl ssh console         # SSH into container
flyctl apps restart        # Restart server
flyctl deploy              # Deploy updates
flyctl secrets list        # View environment variables
```

### Railway Management
```bash
railway status             # Check status
railway logs               # View logs
railway open               # Open dashboard
```

### Health Checks
```bash
# Fly.io
curl https://mendix-mcp-server.fly.dev/health

# Railway
curl https://mendix-mcp-server-production.up.railway.app/health
```

---

## 🔧 WHEN TO USE WHICH?

| Need | Use | Why |
|------|-----|-----|
| Claude Code CLI | Fly.io | Real MCP protocol |
| GitHub Copilot | Fly.io | Requires MCP/SSE |
| Claude Desktop | Fly.io | Native MCP support |
| Custom ChatGPT | Railway | HTTP REST API |
| n8n/Make/Zapier | Railway | HTTP webhooks |
| Web App | Railway | Standard HTTP |

---

## 🚨 QUICK TROUBLESHOOTING

### Server Not Responding?
```bash
# 1. Check status
flyctl status

# 2. Check logs
flyctl logs

# 3. Restart if needed
flyctl apps restart mendix-mcp-server
```

### Config Not Working?
```bash
# 1. Check config file exists
cat ~/.claude/config.json

# 2. Verify URL is correct
# Should be: https://mendix-mcp-server.fly.dev/sse

# 3. Restart client
# Close and reopen VS Code, Claude Desktop, etc.
```

### Authentication Issues?
```bash
# Remove conflicting API key
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")

# Close all terminals, open new one
claude /logout
claude 'test'
# Choose "Claude.ai Subscription"
```

---

## 📊 CURRENT STATUS

- **Fly.io Server:** ✅ Running (2 machines)
- **Railway API:** ✅ Running
- **Knowledge Base:** 321+ entries (Supabase)
- **Vector Index:** 253+ embeddings (Pinecone)
- **Monthly Cost:** ~$5 (Railway) + $0 (Fly.io) = $5 total

---

## 📞 EMERGENCY CONTACTS

**Documentation:**
- Full Docs: `D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\`
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Connections: [CONNECTION-GUIDE.md](./CONNECTION-GUIDE.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**Dashboards:**
- Fly.io: https://fly.io/dashboard
- Railway: https://railway.app/dashboard
- Supabase: https://supabase.com/dashboard
- Pinecone: https://app.pinecone.io

---

## 🧪 QUICK TEST

```powershell
# Test Fly.io
Invoke-RestMethod https://mendix-mcp-server.fly.dev/health

# Test Railway
Invoke-RestMethod https://mendix-mcp-server-production.up.railway.app/health

# Test Claude Code
claude "Use @mendix-expert to show server status"

# Test in Copilot
# @workspace use mendix-expert to explain microflows
```

---

**Last Updated:** December 29, 2025  
**Deployed By:** Neo @ Siemens
