---
layout: default
title: Installation Guide
parent: Getting Started
nav_order: 1
---

# Installation Guide

Get mendix-expert running in 5 minutes

---

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** with Copilot, OR **Claude Desktop**

---

## Installation Methods

Choose the method that works best for you:

### Method 1: Smithery (Recommended - Easiest)

**Smithery** automatically handles installation and configuration:

```bash
# Install Smithery CLI
npm install -g @smithery/cli

# Install Mendix Expert MCP Server
smithery install @jordnlvr/mendix-mcp-server --client claude

# Or for VS Code Copilot
smithery install @jordnlvr/mendix-mcp-server --client vscode
```

**Done!** Smithery configures everything for you. You can start using `@mendix-expert` immediately.

**Registry URL:** [smithery.ai/server/@jordnlvr/mendix-mcp-server](https://smithery.ai/server/@jordnlvr/mendix-mcp-server)

---

### Method 2: npm (Quick)

```bash
# Install globally
npm install -g @jordnlvr/mendix-mcp-server

# Or use with npx (no install needed)
npx @jordnlvr/mendix-mcp-server
```

Then configure your MCP client manually (see Step 2 below).

---

### Method 3: From Source (Advanced)

```powershell
# Choose where to install (anywhere you want)
cd C:\Projects

# Clone
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server

# Install dependencies
npm install

# Test it works
node src/index.js
```

You should see output about the server starting. Press `Ctrl+C` to stop.

---

## Step 2: Configure Your AI Client (Methods 2 & 3 only)

### Option A: VS Code Copilot

1. Open VS Code
2. Press `Ctrl+,` to open Settings
3. Click the `{}` icon (top right) to open JSON
4. Add this (update the path!):

```json
"chat.mcp.servers": {
  "mendix-expert": {
    "type": "stdio",
    "command": "node",
    "args": ["C:/Projects/mendix-mcp-server/src/index.js"]
  }
}
```

5. Restart VS Code

### Option B: Claude Desktop

1. Open `%APPDATA%\Claude\claude_desktop_config.json`
2. Add:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["C:/Projects/mendix-mcp-server/src/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

---

## Step 4: Verify It's Working

In VS Code Copilot Chat or Claude:

```
@mendix-expert What are the best practices for microflow naming?
```

You should get a response with Mendix-specific knowledge!

---

## Updating

```powershell
cd C:\Projects\mendix-mcp-server
git pull
npm install  # if package.json changed
```

---

## Troubleshooting

### "node is not recognized"

Node.js isn't in your PATH. Either:

- Restart your terminal after installing Node
- Or use the full path: `"C:/Program Files/nodejs/node.exe"`

### "ENOENT: no such file"

The path in your config is wrong. Make sure:

- Use forward slashes `/` or escaped backslashes `\\`
- The path points to `src/index.js`, not just the folder

### Server not appearing in Copilot

1. Check the path is correct
2. Restart VS Code completely (not just reload)
3. Check VS Code Output panel for errors

---

## Next Steps

- Read the [User Guide](USER-GUIDE.md) for daily usage
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) to add knowledge
- Visit the [GitHub repo](https://github.com/jordnlvr/mendix-mcp-server)
