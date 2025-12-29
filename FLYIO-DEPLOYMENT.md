# 🚀 Fly.io Deployment Guide

## ✅ What You Get
- **FREE hosting** (256MB RAM, shared CPU)
- **Real MCP server** (SSE protocol)
- **Same knowledge base** (connects to your Supabase)
- **All 242+ learned entries** automatically available
- **Public HTTPS endpoint** for Claude Code/Desktop

---

## 📋 Prerequisites Checklist
- [ ] Fly CLI installed
- [ ] Fly.io account created
- [ ] Environment variables ready (Supabase, Pinecone, etc.)

---

## 🔧 Step-by-Step Deployment

### 1. Install Fly CLI (if not done)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2. Login to Fly.io
```powershell
flyctl auth login
```
This opens your browser to authenticate.

### 3. Navigate to Project
```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
```

### 4. Create Fly.io App
```powershell
flyctl launch --copy-config --no-deploy
```
**Important:** When it asks, choose:
- App name: `mendix-expert-mcp` (or your preference)
- Region: `iad` (US East) or closest to you
- Database: **NO** (we're using Supabase)
- Redis: **NO**

### 5. Set Environment Variables
```powershell
# Supabase (REQUIRED - this is where your 242+ entries are!)
flyctl secrets set SUPABASE_URL="https://uqiricziudqmwuyaeisj.supabase.co"
flyctl secrets set SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
flyctl secrets set SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_KEY"

# Pinecone (REQUIRED for vector search - 253 vectors)
flyctl secrets set PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
flyctl secrets set PINECONE_INDEX="mendix-knowledge"

# Azure OpenAI (for embeddings)
flyctl secrets set AZURE_OPENAI_API_KEY="YOUR_AZURE_KEY"
flyctl secrets set AZURE_OPENAI_ENDPOINT="https://ai-foundry-mxcssa1598564046136.openai.azure.com"
flyctl secrets set AZURE_OPENAI_EMBEDDING_DEPLOYMENT="embed3s"
flyctl secrets set AZURE_OPENAI_API_VERSION="2024-12-01-preview"

# OpenAI (fallback)
flyctl secrets set OPENAI_API_KEY="YOUR_OPENAI_KEY"
```

### 6. Deploy!
```powershell
flyctl deploy
```

This will:
- Build your app
- Deploy to Fly.io
- Start the SSE MCP server
- Connect to your Supabase (all your learned knowledge!)

### 7. Check Status
```powershell
# View logs
flyctl logs

# Check if healthy
flyctl status

# Get your URL
flyctl info
```

Your MCP server URL will be: `https://mendix-expert-mcp.fly.dev`

---

## 🎯 Configure Claude Code

Update your `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-expert-mcp.fly.dev/sse"
    }
  }
}
```

**For VS Code Copilot**, update `%APPDATA%\Code\User\settings.json`:

```json
{
  "github.copilot.chat.mcp": {
    "mendix-expert": {
      "type": "sse",
      "url": "https://mendix-expert-mcp.fly.dev/sse"
    }
  }
}
```

---

## ✅ Test It!

```powershell
# In PowerShell
claude "Use @mendix-expert to explain microflow naming"

# Or in VS Code Copilot
# "@workspace use mendix-expert to show best practices"
```

---

## 💰 Cost

**FREE TIER includes:**
- 3 shared-cpu-1x machines with 256MB RAM
- 160GB outbound data transfer
- $5 credit/month (more than enough for this)

**Your app uses:**
- 1 machine × 256MB RAM = **100% FREE** ✅
- Minimal data transfer (API responses are small)

**Actual cost: $0/month** 🎉

---

## 🔍 Troubleshooting

### App won't start
```powershell
flyctl logs
```
Look for errors about missing env vars or connection issues.

### Can't connect
```powershell
# Check if app is running
flyctl status

# Restart if needed
flyctl apps restart mendix-expert-mcp
```

### Update code
```powershell
# Just redeploy
flyctl deploy
```

---

## 🎊 Success!

Once deployed:
- ✅ Your MCP server is online 24/7
- ✅ All 242+ learned entries available
- ✅ Vector search with 253 indexed entries
- ✅ Can use from Claude Code, Copilot, anywhere
- ✅ FREE hosting forever (within limits)
- ✅ Railway can stay as REST API for ChatGPT/n8n

**You now have BOTH:**
- Railway REST API (for web/n8n)
- Fly.io MCP Server (for coding tools)

Both connected to same Supabase = always in sync! 🚀
