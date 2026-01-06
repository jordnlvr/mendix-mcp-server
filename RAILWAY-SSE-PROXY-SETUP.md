# 🔌 Railway SSE Proxy Setup (CORRECT VERSION)

**Last Updated:** December 29, 2025

---

## 🎯 What This Actually Does

Creates a **LOCAL SSE MCP SERVER** (http://localhost:3000/sse) that **PROXIES** to Railway's REST API.

```
Copilot (#mendix-expert)
    ↓ SSE/MCP
http://localhost:3000/sse (LOCAL proxy server)
    ↓ HTTP REST
https://mendix-mcp-server-production.up.railway.app (Railway)
    ↓
Supabase + Pinecone
```

---

## ✅ Setup Steps

### **1. Start the Proxy Server**

**Option A - PowerShell Script:**
```powershell
.\start-proxy.ps1
```

**Option B - Direct:**
```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
node .vscode/railway-sse-proxy.js
```

**You'll see:**
```
╔═══════════════════════════════════════════════════╗
║   🔌 Railway SSE Proxy Server                     ║
║   Local MCP:  http://localhost:3000/sse           ║
║   Railway:    https://mendix-mcp-server-...       ║
║   Status:     Ready for Copilot connections!      ║
╚═══════════════════════════════════════════════════╝
```

**KEEP THIS WINDOW OPEN!** The proxy must be running for Copilot to work.

---

### **2. VS Code Settings (Already Configured)**

**File:** `%APPDATA%\Code\User\settings.json`

```json
{
  "github.copilot.chat.mcp": {
    "mendix-expert": {
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

✅ **This is already set!**

---

### **3. Reload VS Code**

```
Ctrl+Shift+P → "Reload Window"
```

---

### **4. Test in Copilot**

```
#mendix-expert What tools do you have?
```

**Expected:**
```
Available tools:
1. query_mendix_knowledge
2. search_knowledge
3. add_to_knowledge_base ⭐
4. get_best_practice
5. get_server_status
```

---

## 🧪 Test the /learn Tool

```
#mendix-expert Add to knowledge base:
Title: Proxy Test
Content: This tests that the local SSE proxy correctly connects to Railway's REST API and the /learn endpoint works.
Category: test
```

**Expected:**
```
✅ Knowledge Added!
**Title:** Proxy Test
**ID:** [uuid]
**Vector Indexed:** Yes
```

---

## 🔧 How It Works

### **The Proxy Server (.vscode/railway-sse-proxy.js):**

1. **Starts local Express server** on port 3000
2. **Exposes SSE endpoint** at `/sse`
3. **Implements MCP protocol** (tools/list, tools/call)
4. **Translates MCP → HTTP REST:**
   - MCP: `query_mendix_knowledge("topic")`
   - REST: `POST /query` to Railway
5. **Formats responses** nicely for Copilot

### **The Flow:**

```javascript
// Copilot sends MCP request:
{
  "method": "tools/call",
  "params": {
    "name": "add_to_knowledge_base",
    "arguments": { "title": "...", "content": "..." }
  }
}

// Proxy translates to HTTP:
fetch('https://mendix-mcp-server-production.up.railway.app/learn', {
  method: 'POST',
  body: JSON.stringify({ title: "...", content: "..." })
})

// Railway returns:
{ "success": true, "id": "...", "vectorIndexed": true }

// Proxy formats and returns to Copilot:
{
  "content": [{
    "type": "text",
    "text": "✅ Knowledge Added!\n**Title:** ...\n**ID:** ..."
  }]
}
```

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `.vscode/railway-sse-proxy.js` | The proxy server (SSE MCP ↔ Railway REST) |
| `start-proxy.ps1` | Quick start script |
| `%APPDATA%\Code\User\settings.json` | VS Code config (points to localhost:3000) |

---

## 🚀 Daily Workflow

**Every time you want to use Copilot with mendix-expert:**

1. **Start proxy:** `.\start-proxy.ps1`
2. **Keep it running** (minimize the window)
3. **Use Copilot:** `#mendix-expert ...`
4. **When done:** Close proxy window (Ctrl+C)

---

## 🆘 Troubleshooting

### **"mendix-expert not found in Copilot"**
1. Is proxy running? Check for the startup message
2. Test health: http://localhost:3000/health
3. Reload VS Code window

### **"Connection refused"**
- Proxy not started! Run `.\start-proxy.ps1`

### **"Port 3000 already in use"**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it
taskkill /PID [PID] /F

# Or edit railway-sse-proxy.js and change PORT
```

### **"Railway endpoint failed"**
```powershell
# Test Railway directly
Invoke-RestMethod https://mendix-mcp-server-production.up.railway.app/health
```

If that fails, Railway is down. Check Railway dashboard.

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Copilot Chat             │
│         (#mendix-expert)                │
└─────────────────┬───────────────────────┘
                  │ SSE/MCP Protocol
                  ↓
┌─────────────────────────────────────────┐
│    railway-sse-proxy.js                 │
│    (localhost:3000/sse)                 │
│                                         │
│    - Express server                     │
│    - SSE transport                      │
│    - MCP protocol handler               │
│    - HTTP REST client                   │
└─────────────────┬───────────────────────┘
                  │ HTTP REST
                  ↓
┌─────────────────────────────────────────┐
│    Railway REST API                     │
│    mendix-mcp-server-production         │
│                                         │
│    Endpoints:                           │
│    - POST /query                        │
│    - POST /search                       │
│    - POST /learn ⭐                      │
│    - POST /best-practice                │
│    - GET  /status                       │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│    Data Layer                           │
│    - Supabase (321+ entries)            │
│    - Pinecone (253+ vectors)            │
└─────────────────────────────────────────┘
```

---

## ✅ Success Criteria

**You know it's working when:**

1. ✅ Proxy shows "Ready for Copilot connections"
2. ✅ `#mendix-expert` responds in Copilot
3. ✅ All 5 tools are available
4. ✅ `/learn` tool adds knowledge successfully
5. ✅ New knowledge appears in future searches

---

## 🎯 Key Differences from Before

### **WRONG (what I did first):**
- Tried to use stdio MCP directly
- No local server
- Didn't understand the flow

### **RIGHT (what I just built):**
- ✅ Local HTTP/SSE server (port 3000)
- ✅ Proxies MCP ↔ Railway REST
- ✅ Copilot connects to localhost
- ✅ Proxy forwards to Railway
- ✅ All tools work!

---

**NOW IT'S CORRECT!** 🎯

Start the proxy and test it! 🚀🍺
