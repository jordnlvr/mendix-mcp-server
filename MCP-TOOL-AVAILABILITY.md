# 🔧 MCP Tool Availability by Client

**Last Updated:** December 29, 2025

This document tracks which MCP tools are available in each client.

---

## 📊 Tool Availability Matrix

| Tool | Fly.io MCP | Railway REST | Claude Code | Copilot | Desktop Claude |
|------|------------|--------------|-------------|---------|----------------|
| `query_mendix_knowledge` | ✅ Yes | ✅ Yes (as `/query`) | ✅ Yes | ✅ Yes | ✅ Yes |
| `search_knowledge` | ✅ Yes | ✅ Yes (as `/search`) | ✅ Yes | ✅ Yes | ✅ Yes |
| `add_to_knowledge_base` | ✅ Yes | ✅ Yes (as `/learn`) | ✅ Yes | ❌ **NOT EXPOSED** | ✅ Yes |
| `get_best_practice` | ❌ No | ✅ Yes (as `/best-practice`) | ❌ No | ❌ No | ❌ No |
| `get_server_status` | ✅ Yes (via `/health`) | ✅ Yes (as `/status`) | ✅ Yes | ⚠️ Partial | ✅ Yes |

---

## 🐛 KNOWN ISSUES

### **GitHub Copilot - Limited MCP Support** ⚠️

**Problem:**
- Copilot only exposes READ operations (query, search)
- Does NOT expose WRITE operations (add_to_knowledge_base)
- This is a limitation of Copilot's experimental MCP implementation

**Evidence:**
```
User tried: #mendix-expert add_to_knowledge_base...
Result: Copilot created a local .md file instead of calling the tool
```

**Workaround:**
Use Railway REST API for learning:
```powershell
$body = @{
    title = "Your Title"
    content = "Your knowledge (min 50 chars)"
    category = "best-practices"
    source = "Your name"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mendix-mcp-server-production.up.railway.app/learn" `
  -Method Post -Body $body -ContentType "application/json"
```

**Or use Claude Code:**
```powershell
claude "@mendix-expert - add this to knowledge base: [content]"
```

---

## ✅ RECOMMENDED CLIENTS FOR EACH USE CASE

### **For Searching/Querying:**
- ✅ **Copilot** - Works great! Use `#mendix-expert` prefix
- ✅ **Claude Code** - Works great! Use `@mendix-expert` prefix  
- ✅ **Desktop Claude** - Works great! Just mention `mendix-expert`

### **For Learning/Adding Knowledge:**
- ✅ **Claude Code** - Best MCP tool support
- ✅ **Desktop Claude** - Full MCP support
- ✅ **Railway REST API** - Use PowerShell/curl
- ❌ **Copilot** - NOT SUPPORTED (creates local files instead)

### **For Development Work:**
- ✅ **Copilot** - Good for inline code suggestions with Mendix context
- ✅ **Claude Code** - Best for complex queries and learning
- ✅ **Continue.dev** - Alternative with better MCP support than Copilot

---

## 🧪 HOW TO TEST TOOL AVAILABILITY

### **Test in Copilot:**
```
#mendix-expert What tools do you have available?
```

**Expected:** Should list available tools

### **Test in Claude Code:**
```powershell
claude "@mendix-expert - What MCP tools can you use?"
```

**Expected:** Should list all 3 tools including `add_to_knowledge_base`

---

## 🔧 COPILOT WORKAROUNDS

Since Copilot doesn't expose `add_to_knowledge_base`, here are alternatives:

### **Option 1: Use Railway REST API**
```powershell
# PowerShell function to learn via REST
function Add-MendixKnowledge {
    param(
        [string]$Title,
        [string]$Content,
        [string]$Category = "general",
        [string]$Source = "Manual"
    )
    
    $body = @{
        title = $Title
        content = $Content
        category = $Category
        source = $Source
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "https://mendix-mcp-server-production.up.railway.app/learn" `
        -Method Post -Body $body -ContentType "application/json"
}

# Usage:
Add-MendixKnowledge -Title "My Tip" -Content "Always validate input..." -Category "best-practices"
```

### **Option 2: Use Claude Code**
```powershell
# Just use Claude Code for learning
claude "@mendix-expert - Learn this: [your knowledge]"
```

### **Option 3: Use Desktop Claude**
Open Claude Desktop and chat:
```
Use mendix-expert to add this to the knowledge base: [your knowledge]
```

---

## 📱 CLIENT COMPARISON

| Feature | Copilot | Claude Code | Desktop Claude | Railway REST |
|---------|---------|-------------|----------------|--------------|
| **Search/Query** | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Add Knowledge** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Inline Suggestions** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Source Attribution** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Quality Assessment** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **MCP Compliance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | N/A |

---

## 🎯 RECOMMENDATIONS

**For Daily Development:**
- Use **Copilot** for queries and inline suggestions
- Use **Claude Code** when you need to add knowledge
- Use **Railway REST** for automation/scripts

**For Learning/Teaching:**
- Use **Claude Code** or **Desktop Claude**
- Avoid Copilot for `add_to_knowledge_base`

**For Custom Integrations:**
- Use **Railway REST API** directly
- See OpenAPI spec: `https://mendix-mcp-server-production.up.railway.app/openapi.json`

---

## 🐛 REPORT ISSUES

**If a tool isn't working:**
1. Check this document for known limitations
2. Test with different client (Claude Code vs Copilot)
3. Use Railway REST API as fallback
4. Report to Neo for investigation

**Known working combinations:**
- ✅ Claude Code + Fly.io MCP = All tools work
- ✅ Desktop Claude + Fly.io MCP = All tools work
- ⚠️ Copilot + Fly.io MCP = Read-only (search works, add doesn't)
- ✅ Any HTTP client + Railway REST = All endpoints work

---

**Last Verified:** December 29, 2025  
**Next Review:** When Copilot updates MCP support
