# 🚀 Mendix MCP Server Setup Guide

## 📌 How MCP Servers Work

**MCP (Model Context Protocol)** is a standard protocol that allows AI tools like GitHub Copilot to connect to external knowledge sources.

### The Magic:

1. **You don't manually "start" the server** - VS Code starts it automatically
2. **VS Code manages the connection** - when Copilot needs it, VS Code launches the MCP server
3. **The server responds to Copilot's queries** - provides knowledge, tools, and resources
4. **VS Code stops it when done** - automatic lifecycle management

Think of it like a **plugin system for AI** - Copilot can access your custom knowledge base on-demand!

---

## 🔧 Step 1: Configure VS Code to Connect to Your MCP Server

### Option A: Automatic Configuration (Recommended)

Run this PowerShell command to add the MCP server to your VS Code settings:

```powershell
$settingsPath = "$env:APPDATA\Code\User\settings.json"
$settings = Get-Content $settingsPath -Raw | ConvertFrom-Json

# Add MCP server configuration
if (-not $settings.'github.copilot.chat.mcp') {
    $settings | Add-Member -NotePropertyName 'github.copilot.chat.mcp' -NotePropertyValue @{
        'mendix-expert' = @{
            command = 'node'
            args = @('D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\server.js')
            env = @{
                MENDIX_PROJECT_PATH = 'D:\kelly.seale\CodeBase\OneTech-main\OneTech.mpr'
                MENDIX_SDK_TOOLKIT_PATH = 'D:\Users\kelly.seale\VSCode-Dream-Workspace\Mendix-SDK-Toolkit'
            }
        }
    } -Force
} else {
    $settings.'github.copilot.chat.mcp'.'mendix-expert' = @{
        command = 'node'
        args = @('D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\server.js')
        env = @{
            MENDIX_PROJECT_PATH = 'D:\kelly.seale\CodeBase\OneTech-main\OneTech.mpr'
            MENDIX_SDK_TOOLKIT_PATH = 'D:\Users\kelly.seale\VSCode-Dream-Workspace\Mendix-SDK-Toolkit'
        }
    }
}

$settings | ConvertTo-Json -Depth 100 | Set-Content $settingsPath
Write-Host "✅ Mendix MCP server configured!" -ForegroundColor Green
```

### Option B: Manual Configuration

1. Open VS Code settings: `Ctrl+,`
2. Search for "MCP"
3. Click "Edit in settings.json"
4. Add this configuration:

```json
{
  "github.copilot.chat.mcp": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\mendix-mcp-server\\server.js"],
      "env": {
        "MENDIX_PROJECT_PATH": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
        "MENDIX_SDK_TOOLKIT_PATH": "D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\Mendix-SDK-Toolkit"
      }
    }
  }
}
```

**What this does:**

- `command: "node"` - Uses Node.js to run the server
- `args` - Path to your server.js file
- `env` - Environment variables so the server knows where OneTech and the SDK toolkit are

---

## ✅ Step 2: Restart VS Code

Close and reopen VS Code to load the new MCP configuration.

---

## 🎯 Step 3: Test It!

Open GitHub Copilot Chat (`Ctrl+Shift+P` → "GitHub Copilot: Open Chat") and try:

```
@workspace Use the mendix-expert MCP to explain domain modeling best practices
```

Or:

```
Tell me about the Request entity from OneTech using mendix-expert
```

---

## 🔍 How Copilot Knows About Your MCP Server

### Discovery Process:

1. **VS Code reads settings.json** on startup
2. **Finds `github.copilot.chat.mcp` section** with your MCP servers
3. **Registers "mendix-expert" as available** to Copilot
4. **When you mention "mendix-expert" or use @workspace**, Copilot can:
   - Query your knowledge base
   - Analyze OneTech entities
   - Access best practices
   - Get real-world examples

### Behind the Scenes:

```
You ask: "Use mendix-expert to explain associations"
    ↓
Copilot sees "mendix-expert" mentioned
    ↓
VS Code launches: node server.js
    ↓
Server loads knowledge base JSON files
    ↓
Copilot sends query: "associations"
    ↓
Server searches knowledge base
    ↓
Returns: Best practices, examples, patterns
    ↓
Copilot formats response for you
    ↓
Server stops (VS Code managed)
```

---

## 🌐 Can Other Tools Use Your MCP Server?

**YES!** Any tool that supports the Model Context Protocol can use it:

### Currently Supporting MCP:

✅ **GitHub Copilot** (what you're using)
✅ **Claude Desktop** (Anthropic's app)
✅ **Continue.dev** (VS Code extension)
✅ **Cline** (VS Code extension)
✅ **Zed Editor** (code editor with AI)
✅ **Sourcegraph Cody** (AI coding assistant)

### To Use with Claude Desktop:

1. Install Claude Desktop app
2. Configure in `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\mendix-mcp-server\\server.js"],
      "env": {
        "MENDIX_PROJECT_PATH": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
        "MENDIX_SDK_TOOLKIT_PATH": "D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\Mendix-SDK-Toolkit"
      }
    }
  }
}
```

### To Use with Continue.dev:

Add to `.continue/config.json` in your workspace:

```json
{
  "mcpServers": [
    {
      "name": "mendix-expert",
      "command": "node",
      "args": ["D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\mendix-mcp-server\\server.js"]
    }
  ]
}
```

---

## 🎛️ MCP Server Lifecycle

### Automatic Management (Normal):

- **Start:** VS Code launches when Copilot needs it
- **Run:** Processes queries from Copilot
- **Stop:** VS Code terminates when idle
- **You do nothing!** 🎉

### Manual Testing (Development):

If you want to test the server directly:

```powershell
# Run the server manually
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
node server.js
```

You'll see:

```
Mendix MCP Server running on stdio
Loaded knowledge base: studio-pro
Loaded knowledge base: model-sdk
...
Ready to serve Mendix expertise!
```

Press `Ctrl+C` to stop.

---

## 🔧 Troubleshooting

### "MCP server not found"

**Fix:** Restart VS Code after adding the configuration

### "Node.js not found"

**Fix:** Make sure Node.js is in your PATH:

```powershell
node --version  # Should show v24.11.0
```

### "Cannot find module '@modelcontextprotocol/sdk'"

**Fix:** Install dependencies:

```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
npm install
```

### "Knowledge base empty"

**Fix:** Run the research prompt from RESEARCH-PROMPT.md to populate the knowledge base

### "Server crashes"

**Check logs:**

```powershell
# VS Code logs MCP server output
# View in: Output panel → GitHub Copilot Chat
```

---

## 📊 MCP Server Status Check

Run this to verify everything:

```powershell
Write-Host "🔍 Checking MCP Server Setup..." -ForegroundColor Cyan

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js installed: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
}

# Check server file
$serverPath = "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\server.js"
if (Test-Path $serverPath) {
    Write-Host "✅ Server file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Server file not found" -ForegroundColor Red
}

# Check knowledge base
$knowledgePath = "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge"
if (Test-Path $knowledgePath) {
    $files = Get-ChildItem $knowledgePath -Filter "*.json"
    Write-Host "✅ Knowledge base: $($files.Count) files" -ForegroundColor Green
} else {
    Write-Host "❌ Knowledge base not found" -ForegroundColor Red
}

# Check VS Code settings
$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $settingsPath) {
    $content = Get-Content $settingsPath -Raw
    if ($content -match 'mendix-expert') {
        Write-Host "✅ VS Code configuration found" -ForegroundColor Green
    } else {
        Write-Host "⚠️ VS Code not configured yet" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 Setup Status Complete!" -ForegroundColor Cyan
```

---

## 🚀 Quick Start Checklist

- [ ] Node.js v24.11.0 installed ✅ (You already have this!)
- [ ] MCP server dependencies installed ✅ (npm install complete!)
- [ ] Knowledge base populated (Run RESEARCH-PROMPT.md)
- [ ] VS Code settings configured (Run Option A command above)
- [ ] VS Code restarted
- [ ] Test with Copilot Chat

---

## 💡 Pro Tips

### 1. Multiple MCP Servers

You can have multiple MCP servers in your configuration:

```json
{
  "github.copilot.chat.mcp": {
    "mendix-expert": { ... },
    "database-expert": { ... },
    "api-docs": { ... }
  }
}
```

### 2. Project-Specific MCP

Add `.vscode/settings.json` in a project with MCP config for project-specific knowledge.

### 3. Share Your MCP Server

Commit the `mendix-mcp-server/` folder to Git - your team can use the same knowledge base!

### 4. MCP Server Marketplace

Check out https://github.com/modelcontextprotocol for pre-built MCP servers.

---

## 🎉 That's It!

Your Mendix MCP server is a **background service** that:

- ✅ Starts automatically when needed
- ✅ Provides knowledge to Copilot
- ✅ Works across multiple AI tools
- ✅ Grows with your project
- ✅ Never forgets what it learns

**No manual server management required!** 🚀
