# 🎓 Complete User Guide

> Everything you need to know about using, updating, and sharing the mendix-expert MCP server.

---

## 📑 Table of Contents

1. [Quick Reference](#-quick-reference)
2. [Installation](#-installation)
3. [Daily Usage](#-daily-usage)
4. [Updating](#-updating)
5. [Adding Knowledge](#-adding-knowledge)
6. [Sharing](#-sharing)
7. [Troubleshooting](#-troubleshooting)
8. [Advanced Usage](#-advanced-usage)

---

## 🚀 Quick Reference

### Commands You'll Use Most

```powershell
# Pull latest changes
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
git pull

# Check server status
node src/index.js

# Validate knowledge base
node -e "const KM = require('./src/core/KnowledgeManager.js'); new KM('./knowledge').validateKnowledgeBase().then(r => console.log(r.summary));"

# Push your changes
git add -A
git commit -m "your message"
git push
```

### MCP Resources (access via @mendix-expert)

| Resource                      | What It Shows                              |
| ----------------------------- | ------------------------------------------ |
| `mendix://knowledge/overview` | All knowledge files and entry counts       |
| `mendix://analytics`          | Search hit rate, top terms, missed queries |
| `mendix://validation/report`  | Errors and warnings in knowledge base      |
| `mendix://maintenance`        | Auto-maintenance schedule and status       |

---

## 📦 Installation

### Fresh Install (New Machine)

```powershell
# 1. Clone the repository
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server

# 2. Install dependencies
npm install

# 3. Test it works
node src/index.js
# Should see: "Mendix Expert MCP Server running..."
# Press Ctrl+C to stop
```

### Configure VS Code

Add to your VS Code `settings.json` (Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"):

```json
"chat.mcp.servers": {
  "mendix-expert": {
    "type": "stdio",
    "command": "node",
    "args": ["C:/YOUR/PATH/TO/mendix-mcp-server/src/index.js"]
  }
}
```

⚠️ **Replace the path** with your actual installation path!

### Configure Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["C:/YOUR/PATH/TO/mendix-mcp-server/src/index.js"]
    }
  }
}
```

---

## 💻 Daily Usage

### In VS Code Copilot Chat

1. Open Copilot Chat (Ctrl+Shift+I)
2. Type `@mendix-expert` to activate the MCP server
3. Ask questions:
   - "How do I create a microflow with the SDK?"
   - "What's the best practice for domain model design?"
   - "Analyze my project at D:/Projects/MyApp.mpr"

### Example Queries

```
@mendix-expert How do I iterate over a list in a microflow using the SDK?

@mendix-expert What are the naming conventions for microflows?

@mendix-expert Show me the analytics - what queries are people searching?

@mendix-expert Check if my knowledge base has any validation errors
```

### Keyboard Shortcuts (VS Code)

| Shortcut         | Action              |
| ---------------- | ------------------- |
| `Ctrl+Shift+I`   | Open Copilot Chat   |
| `@mendix-expert` | Activate MCP server |
| `Ctrl+Enter`     | Submit query        |

---

## 🔄 Updating

### Pull Latest from GitHub

```powershell
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server

# Get latest changes
git pull

# If there are dependency updates
npm install
```

### Update After Making Changes

```powershell
# 1. See what changed
git status

# 2. Stage your changes
git add -A

# 3. Commit with descriptive message
git commit -m "knowledge: Add microflow error handling entries"

# 4. Push to GitHub
git push
```

### Creating a New Release

```powershell
# Use the release script
.\release.ps1 -Version "2.2.0" -Message "Added new SDK patterns"
```

This automatically:

- Updates version in package.json and config
- Validates the knowledge base
- Creates a git tag
- Pushes to GitHub
- You then create the Release on GitHub

---

## 📚 Adding Knowledge

### Quick Add (Single Entry)

1. Open the appropriate file in `knowledge/`:

   - `best-practices.json` - Naming, architecture, patterns
   - `model-sdk.json` - Model manipulation, elements
   - `platform-sdk.json` - Working copies, commits
   - `troubleshooting.json` - Errors and solutions
   - `studio-pro.json` - Studio Pro features

2. Add your entry to the `entries` array:

```json
{
  "id": "microflow-error-handling",
  "title": "Microflow Error Handling Best Practices",
  "category": "microflows",
  "content": "When handling errors in microflows, always use...",
  "keywords": ["error", "exception", "try-catch", "microflow"],
  "source": "experience",
  "lastUpdated": "2025-12-07"
}
```

3. Validate:

```powershell
node -e "const KM = require('./src/core/KnowledgeManager.js'); new KM('./knowledge').validateKnowledgeBase().then(r => console.log(r.summary));"
```

4. Commit and push:

```powershell
git add -A
git commit -m "knowledge: Add microflow error handling entry"
git push
```

### Using the MCP Tool

You can also add knowledge via the MCP server:

```
@mendix-expert add to knowledge base:
- Category: best-practices
- Title: "Microflow Naming Conventions"
- Content: "Always prefix microflows with ACT_ for actions, DS_ for data sources..."
- Keywords: naming, microflow, conventions
- Source: experience
```

---

## 🤝 Sharing

### Share the Whole Server

Give someone your GitHub URL:

```
https://github.com/jordnlvr/mendix-mcp-server
```

They can clone and use it immediately:

```bash
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server
npm install
```

### Make It Public (if private)

1. Go to https://github.com/jordnlvr/mendix-mcp-server/settings
2. Scroll to "Danger Zone"
3. Click "Change visibility" → Public

### Collaborate

1. Add collaborators: Settings → Collaborators → Add people
2. They can then push directly, or:
3. They fork → make changes → submit Pull Request

### Share Just the Knowledge

Export knowledge files:

```powershell
# Copy knowledge folder
Copy-Item -Path "knowledge" -Destination "C:\Shared\mendix-knowledge" -Recurse
```

---

## 🔧 Troubleshooting

### "Server not responding"

```powershell
# Test if server starts
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
node src/index.js

# Check for errors
# If it hangs, press Ctrl+C and check the error
```

### "Command not found: node"

Node.js isn't in your PATH:

```powershell
# Check if Node is installed
node --version

# If not, install from https://nodejs.org/
```

### "MCP server not showing in Copilot"

1. Check VS Code settings have the correct path
2. Restart VS Code completely
3. Try toggling MCP servers off/on in Copilot settings

### "Search returns no results"

```powershell
# Check knowledge base is valid
node -e "const KM = require('./src/core/KnowledgeManager.js'); new KM('./knowledge').validateKnowledgeBase().then(r => console.log(r.summary));"

# Check index stats
node -e "const SE = require('./src/core/SearchEngine.js'); const e = new SE(); e.initialize('./knowledge'); console.log(e.getStats());"
```

### "Git push rejected"

```powershell
# Pull first, then push
git pull --rebase
git push
```

---

## 🎯 Advanced Usage

### Check Knowledge Gaps

See what people search for but don't find:

```powershell
node -e "
const SE = require('./src/core/SearchEngine.js');
const e = new SE();
e.initialize('./knowledge');
console.log('Knowledge Gaps:', e.getKnowledgeGaps());
"
```

### Analyze Your Mendix Project

```
@mendix-expert analyze project at D:\kelly.seale\CodeBase\SmartHub-main\SmartHub.mpr

@mendix-expert analyze module RequestHub in my project
```

### Run Maintenance Manually

```powershell
node -e "
const MS = require('./src/utils/MaintenanceScheduler.js');
const KM = require('./src/core/KnowledgeManager.js');
const SE = require('./src/core/SearchEngine.js');

const km = new KM('./knowledge');
const se = new SE();
se.initialize('./knowledge');

const scheduler = new MS(km, se, './data');
scheduler.runTask('validation').then(r => console.log(r));
"
```

### View Analytics Dashboard

```powershell
node -e "
const SE = require('./src/core/SearchEngine.js');
const e = new SE();
e.initialize('./knowledge');
const a = e.getAnalytics();
console.log('=== Analytics Dashboard ===');
console.log('Hit Rate:', (a.hitRate * 100).toFixed(1) + '%');
console.log('Avg Response:', a.avgResponseTime.toFixed(2) + 'ms');
console.log('Total Queries:', a.totalQueries);
console.log('Top Terms:', a.topTerms.slice(0, 5));
console.log('Recent Misses:', a.recentMisses.slice(0, 5));
"
```

---

## 📍 File Locations

| What                  | Where                                                            |
| --------------------- | ---------------------------------------------------------------- |
| MCP Server            | `D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\` |
| Knowledge Files       | `mendix-mcp-server\knowledge\*.json`                             |
| Configuration         | `mendix-mcp-server\config\default.json`                          |
| VS Code Settings      | `%APPDATA%\Code - Insiders\User\settings.json`                   |
| Claude Desktop Config | `%APPDATA%\Claude\claude_desktop_config.json`                    |
| GitHub Repo           | https://github.com/jordnlvr/mendix-mcp-server                    |

---

## 🆘 Getting Help

1. **Check this guide first** - Most answers are here
2. **GitHub Issues** - https://github.com/jordnlvr/mendix-mcp-server/issues
3. **README** - Quick reference and setup
4. **CONTRIBUTING.md** - How to contribute

---

_Last updated: December 7, 2025_
