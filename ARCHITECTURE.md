# 📡 Mendix Expert MCP Server - Deployment Architecture

**Last Updated:** December 29, 2025  
**Deployed By:** Neo (Kelly Seale)  
**Status:** ✅ Production Ready

---

## 🌐 LIVE DEPLOYMENTS

We have **TWO** production deployments, each serving different purposes:

### 1. **Fly.io - MCP Server (SSE Protocol)** 🎯
- **URL:** `https://mendix-mcp-server.fly.dev`
- **SSE Endpoint:** `https://mendix-mcp-server.fly.dev/sse`
- **Purpose:** Real MCP protocol over Server-Sent Events (SSE)
- **Used By:** 
  - Claude Code CLI
  - Claude Desktop
  - GitHub Copilot in VS Code
  - Any MCP-compatible client
- **Cost:** **FREE** (Fly.io free tier)
- **Started:** December 29, 2025
- **Machines:** 2 (high availability)
- **Region:** iad (US East - Virginia)

### 2. **Railway - REST API** 🚂
- **URL:** `https://mendix-mcp-server-production.up.railway.app`
- **Purpose:** HTTP REST API for web integrations
- **Used By:**
  - Custom ChatGPT
  - n8n workflows
  - Make/Zapier automations
  - Web dashboard
  - Direct HTTP API calls
- **Cost:** ~$5/month
- **OpenAPI Spec:** `/openapi.json`

---

## 🗄️ SHARED INFRASTRUCTURE

Both deployments connect to the **SAME** cloud databases, ensuring they're always in sync:

### **Supabase (PostgreSQL)**
- **URL:** `https://uqiricziudqmwuyaeisj.supabase.co`
- **Purpose:** Persistent knowledge storage
- **Current Entries:** 321+ (as of Dec 29, 2025)
- **Tables:** 
  - `knowledge_entries` - All learned knowledge
  - `knowledge_files` - File metadata
  - `usage_stats` - Usage tracking
  - `analytics_events` - Analytics

### **Pinecone (Vector Database)**
- **Index:** `mendix-knowledge`
- **Purpose:** Semantic search via embeddings
- **Vectors:** 253+ indexed
- **Dimensions:** 1536 (text-embedding-3-small)
- **Region:** us-east-1

### **Azure OpenAI**
- **Endpoint:** `https://ai-foundry-mxcssa1598564046136.openai.azure.com`
- **Deployment:** `embed3s`
- **Purpose:** Generate embeddings for vector search

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TOOLS                             │
├──────────────────────┬──────────────────────────────────────┤
│ Claude Code CLI      │  Custom ChatGPT                       │
│ Claude Desktop       │  n8n Workflows                        │
│ GitHub Copilot       │  Web Dashboard                        │
│ VS Code Extensions   │  HTTP API Clients                     │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           │ SSE/MCP Protocol         │ HTTP REST API
           │                          │
┌──────────▼──────────┐    ┌──────────▼──────────────────────┐
│   Fly.io Server     │    │   Railway Server                 │
│                     │    │                                  │
│ - SSE Transport     │    │ - Express REST API               │
│ - MCP Tools         │    │ - OpenAPI endpoints              │
│ - Port 8080         │    │ - CORS enabled                   │
│ - 2 machines        │    │ - Single instance                │
│ - 256MB RAM         │    │ - 512MB RAM                      │
└──────────┬──────────┘    └──────────┬───────────────────────┘
           │                          │
           │                          │
           └────────────┬─────────────┘
                        │
         ┌──────────────▼─────────────────┐
         │   SHARED CLOUD DATABASES       │
         ├────────────────────────────────┤
         │ Supabase (PostgreSQL)          │
         │   - 321+ knowledge entries     │
         │   - Usage stats                │
         │   - Analytics                  │
         ├────────────────────────────────┤
         │ Pinecone (Vector DB)           │
         │   - 253+ embeddings            │
         │   - Semantic search            │
         ├────────────────────────────────┤
         │ Azure OpenAI                   │
         │   - Embedding generation       │
         └────────────────────────────────┘
```

---

## 🚀 DEPLOYMENT HISTORY

### **December 29, 2025 - Fly.io MCP Deployment**
**Why:** Need true MCP protocol support (Railway doesn't support SSE well)

**Steps Taken:**
1. Created SSE-enabled MCP server (`src/sse-server.js`)
2. Created Dockerfile for containerization
3. Created `fly.toml` configuration
4. Deployed to Fly.io free tier
5. Set environment secrets (Supabase, Pinecone, Azure OpenAI)
6. Connected to existing cloud databases
7. Configured all clients to use Fly.io endpoint

**Result:** ✅ Success! 
- Server running on 2 machines
- Connected to Supabase (321 entries)
- Connected to Pinecone (253 vectors)
- All knowledge automatically available
- $0/month cost

### **Earlier - Railway REST API Deployment**
- Created for HTTP REST API access
- Used by Custom ChatGPT
- Provides OpenAPI spec at `/openapi.json`
- Still running, still needed!

---

## 🔧 WHY TWO DEPLOYMENTS?

### **Railway Limitations:**
- ❌ No SSE (Server-Sent Events) support
- ❌ Containers restart frequently (kills stdio connections)
- ❌ Cannot use MCP protocol
- ✅ Perfect for HTTP REST API

### **Fly.io Advantages:**
- ✅ Full SSE support
- ✅ Persistent connections
- ✅ Real MCP protocol
- ✅ FREE tier (256MB RAM)
- ✅ High availability (2 machines)
- ❌ More complex setup

### **Best of Both Worlds:**
- **Fly.io** for coding tools (Claude Code, Copilot, etc.)
- **Railway** for web integrations (ChatGPT, n8n, etc.)
- **Both** share same knowledge base via Supabase!

---

## 📁 PROJECT STRUCTURE

```
mendix-mcp-server/
├── src/
│   ├── index.js           # Stdio MCP server (local use)
│   ├── rest-proxy.js      # Railway REST API server
│   ├── sse-server.js      # Fly.io SSE MCP server ⭐ NEW
│   └── ...
├── Dockerfile             # Fly.io containerization
├── .dockerignore          # Docker build optimization
├── fly.toml               # Fly.io configuration
├── flyio-secrets.ps1      # Script to set Fly.io secrets
├── FLYIO-DEPLOYMENT.md    # Fly.io deployment guide
├── RAILWAY-DEPLOYMENT.md  # Railway deployment guide
├── ARCHITECTURE.md        # This file!
└── ...
```

---

## 🔗 QUICK REFERENCE

### **Fly.io MCP Server**
```bash
# Check status
flyctl status

# View logs
flyctl logs

# SSH into machine
flyctl ssh console

# Restart
flyctl apps restart mendix-mcp-server

# Deploy updates
flyctl deploy

# Check secrets
flyctl secrets list
```

### **Railway REST API**
```bash
# View on Railway
railway open

# View logs
railway logs

# Deploy updates
git push origin main  # Auto-deploys
```

### **Health Checks**
```bash
# Fly.io
curl https://mendix-mcp-server.fly.dev/health

# Railway
curl https://mendix-mcp-server-production.up.railway.app/health
```

---

## 📞 SUPPORT

**If deployment breaks:**
1. Check logs: `flyctl logs` or `railway logs`
2. Check secrets: `flyctl secrets list`
3. Verify Supabase connection
4. Verify Pinecone connection
5. Check this documentation!

**Common Issues:**
- **"Module not found"** → Missing dependency, rebuild: `flyctl deploy`
- **"Connection refused"** → Check Supabase/Pinecone secrets
- **"Out of memory"** → Increase RAM in fly.toml (costs money)
- **"Failed health check"** → Check /health endpoint logs

---

## 🎯 FUTURE CONSIDERATIONS

### **Potential Improvements:**
- [ ] Add monitoring/alerting (e.g., Better Uptime)
- [ ] Add rate limiting per user
- [ ] Add authentication for public MCP endpoint
- [ ] Scale to multiple regions
- [ ] Add Redis caching layer
- [ ] Implement request queuing

### **Cost Optimization:**
- Fly.io: Currently FREE (256MB RAM)
- Railway: ~$5/month (could optimize with better caching)
- Supabase: FREE tier (sufficient for now)
- Pinecone: FREE tier (sufficient for now)

**Total Monthly Cost: ~$5** 🎉

---

**Last verified working:** December 29, 2025  
**Next review:** June 2025 (or when issues arise)
