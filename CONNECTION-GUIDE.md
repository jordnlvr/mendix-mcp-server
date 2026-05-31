# 🔌 Connection Guide - How to Connect to Mendix Expert MCP Server

**Quick Decision:** Need MCP protocol? → Fly.io. Need HTTP REST? → Railway.

---

## 🎯 WHICH ENDPOINT TO USE?

### **Use Fly.io (MCP/SSE)** when:
- ✅ Using Claude Code CLI
- ✅ Using Claude Desktop
- ✅ Using GitHub Copilot in VS Code
- ✅ Using any MCP-compatible client
- ✅ Need real-time tool execution
- ✅ Want to use `@mendix-expert` syntax

**Endpoint:** `https://mendix-mcp-server.fly.dev/sse`  
**Protocol:** SSE (Server-Sent Events) with MCP

### **Use Railway (REST API)** when:
- ✅ Building Custom ChatGPT
- ✅ Using n8n/Make/Zapier workflows
- ✅ Making HTTP API calls from web apps
- ✅ Need OpenAPI/Swagger spec
- ✅ Building public-facing integrations
- ✅ Want to use standard HTTP

**Endpoint:** `https://mendix-mcp-server-production.up.railway.app`  
**Protocol:** HTTP REST API

---

## 🛠️ CLIENT CONFIGURATION

### **1. Claude Code CLI**

**Location:** `C:\Users\kelly.seale\.claude\config.json`

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

**Usage:**
```bash
claude "Use @mendix-expert to explain microflows"
```

**Troubleshooting:**
- Config not working? Delete `~/.claude/.credentials.json` and re-authenticate
- Run: `claude /logout` then `claude 'test'`
- Choose "Claude.ai Subscription" option

---

### **2. Claude Desktop (this app!)**

**Location:** `C:\Users\kelly.seale\AppData\Roaming\Claude\claude_desktop_config.json`

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

**Usage:**
In chat, type:
```
Use mendix-expert to search for domain modeling best practices
```

**Troubleshooting:**
- Restart Claude Desktop after config changes
- Check hamburger menu → Settings → Developer → MCP Servers
- Should see "mendix-expert" listed

---

### **3. VS Code GitHub Copilot**

**Location:** `C:\Users\kelly.seale\AppData\Roaming\Code\User\settings.json`

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

**Usage:**
In Copilot chat:
```
@workspace use mendix-expert to show best practices for microflows
```

**Troubleshooting:**
- Restart VS Code after config changes
- Check Copilot extension is enabled
- Copilot must be authenticated with GitHub account

---

### **4. Custom ChatGPT**

**Uses:** Railway REST API (not Fly.io!)

**Setup:**
1. Go to ChatGPT → Explore GPTs → Create
2. Configure → Actions
3. Import schema from: `https://mendix-mcp-server-production.up.railway.app/openapi.json`
4. Authentication: None (public API)

**Available Endpoints:**
- `POST /query` - Search knowledge base
- `POST /search` - Hybrid search
- `POST /best-practice` - Get best practice recommendations
- `POST /learn` - Add new knowledge
- `GET /health` - Health check
- `GET /status` - Server status

**Example Action:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Mendix Expert API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://mendix-mcp-server-production.up.railway.app"
    }
  ]
}
```

---

### **5. n8n Workflow**

**Uses:** Railway REST API

**HTTP Request Node Configuration:**
- **Method:** POST
- **URL:** `https://mendix-mcp-server-production.up.railway.app/query`
- **Body (JSON):**
```json
{
  "topic": "microflows",
  "detail_level": "detailed"
}
```

**Example Workflow:**
1. Webhook Trigger
2. HTTP Request → Mendix Expert API
3. Parse JSON
4. Send to Slack/Email/etc.

---

### **6. Continue.dev (VS Code Extension)**

**If you want to use Continue instead of Copilot:**

**Location:** `.continue/config.json` in your project

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

## 🧪 TESTING YOUR CONNECTION

### **Test Fly.io MCP Server:**

**1. Health Check (Browser):**
```
https://mendix-mcp-server.fly.dev/health
```
Should return JSON with entry count.

**2. Command Line:**
```powershell
# PowerShell
Invoke-RestMethod https://mendix-mcp-server.fly.dev/health

# Bash/WSL
curl https://mendix-mcp-server.fly.dev/health
```

**3. Test with Claude Code:**
```bash
claude "Use @mendix-expert to show server status"
```

**Expected:** Response with knowledge base stats.

---

### **Test Railway REST API:**

**1. Health Check:**
```bash
curl https://mendix-mcp-server-production.up.railway.app/health
```

**2. Query Endpoint:**
```bash
curl -X POST https://mendix-mcp-server-production.up.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"topic":"microflows","detail_level":"basic"}'
```

**3. OpenAPI Spec:**
```
https://mendix-mcp-server-production.up.railway.app/openapi.json
```

---

## 🔐 AUTHENTICATION

### **Fly.io MCP Server:**
- **Current:** No authentication (public endpoint)
- **Risk:** Anyone with URL can use it
- **Mitigation:** URL is not public, Fly.io has built-in DDoS protection
- **Future:** Consider adding API key auth if needed

### **Railway REST API:**
- **Current:** No authentication (public API)
- **Why:** Designed for Custom ChatGPT (no auth support)
- **Risk:** Minimal (read-only knowledge base)
- **Rate Limiting:** None currently

**Recommendation:** If you want to add auth, implement in both servers.

---

## 📊 MONITORING

### **Check Server Status:**

**Fly.io:**
```bash
flyctl status
flyctl logs --tail
```

**Railway:**
```bash
railway status
railway logs
```

### **Health Endpoints:**
Both servers expose `/health`:
```json
{
  "status": "healthy",
  "initialized": true,
  "storage": "supabase",
  "entries": 321
}
```

---

## 🚨 TROUBLESHOOTING

### **"Connection refused" or "Cannot connect"**

**Fly.io:**
1. Check if server is running: `flyctl status`
2. Check logs: `flyctl logs`
3. Verify secrets: `flyctl secrets list`
4. Test health endpoint: `curl https://mendix-mcp-server.fly.dev/health`

**Railway:**
1. Check Railway dashboard
2. Check deployment logs
3. Verify environment variables
4. Test health endpoint

---

### **"No response from MCP server"**

**Check config files:**
```powershell
# Claude Code
cat ~/.claude/config.json

# VS Code
cat $env:APPDATA\Code\User\settings.json

# Claude Desktop
cat $env:APPDATA\Claude\claude_desktop_config.json
```

**Verify URL is correct:**
```
https://mendix-mcp-server.fly.dev/sse
```
NOT:
- ~~http://~~ (must be https)
- ~~.../mcp~~ (endpoint is /sse)
- ~~localhost:8080~~ (that's local development)

---

### **"Server returns 404"**

**Verify endpoint paths:**
- MCP/SSE: `https://mendix-mcp-server.fly.dev/sse` ✅
- Health: `https://mendix-mcp-server.fly.dev/health` ✅
- REST query: `https://mendix-mcp-server-production.up.railway.app/query` ✅

---

### **"Empty or no results"**

**Check knowledge base connection:**
1. Visit health endpoint
2. Verify `entries` count > 0
3. Check Supabase dashboard
4. Check Pinecone dashboard

**If entries = 0:**
- Supabase connection failed
- Check environment secrets
- Check Supabase is not paused (free tier pauses after inactivity)

---

## 📞 QUICK REFERENCE CARD

```
┌────────────────────────────────────────────────────────────┐
│ MENDIX EXPERT MCP SERVER - QUICK REFERENCE                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ FLY.IO MCP SERVER (for coding tools)                       │
│ URL: https://mendix-mcp-server.fly.dev/sse                 │
│ Used by: Claude Code, Copilot, Claude Desktop             │
│ Protocol: SSE/MCP                                          │
│                                                            │
│ RAILWAY REST API (for web integrations)                    │
│ URL: https://mendix-mcp-server-production.up.railway.app  │
│ Used by: ChatGPT, n8n, web apps                           │
│ Protocol: HTTP REST                                        │
│                                                            │
│ SHARED DATABASE                                            │
│ Supabase: 321+ entries                                     │
│ Pinecone: 253+ vectors                                     │
│                                                            │
│ CONFIGS                                                    │
│ Claude Code: ~/.claude/config.json                         │
│ VS Code: %APPDATA%\Code\User\settings.json                │
│ Desktop: %APPDATA%\Claude\claude_desktop_config.json      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Print this and stick it on your monitor! 📋

---

**Last Updated:** December 29, 2025  
**Next Review:** When things break 😅
