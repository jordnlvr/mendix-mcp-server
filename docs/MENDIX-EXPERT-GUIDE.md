# Mendix Expert MCP Server

## Complete User & Integration Guide

### v2.8.0 | December 2025

---

<div style="font-size: 11px; line-height: 1.4;">

## Table of Contents

1. [What Is This?](#1-what-is-this)
2. [Quick Start (5 Minutes)](#2-quick-start)
3. [Configuration Guide](#3-configuration-guide)
4. [All Available Tools](#4-all-available-tools)
5. [Power User Commands](#5-power-user-commands)
6. [Beast Mode](#6-beast-mode)
7. [Integration Options](#7-integration-options)
8. [Things to Watch Out For](#8-things-to-watch-out-for)
9. [Maintenance & Operations](#9-maintenance--operations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What Is This?

**Mendix Expert** is a self-learning AI assistant that knows Mendix inside and out. It's built on the Model Context Protocol (MCP), which means it plugs directly into VS Code Copilot, Claude Desktop, Cursor, or any MCP-compatible AI tool.

### What Makes It Special

| Feature                   | What It Does                                       |
| ------------------------- | -------------------------------------------------- |
| **700KB+ Knowledge Base** | Verified Mendix patterns, SDK code, best practices |
| **Semantic Search**       | Understands meaning, not just keywords             |
| **Self-Learning**         | Automatically harvests new Mendix documentation    |
| **Project Analysis**      | Analyzes your actual `.mpr` files                  |
| **Theme Analysis**        | Deep SCSS/design-properties validation             |
| **Beast Mode**            | Exhaustive research when you need it               |

---

## 2. Quick Start

### Install from npm (Recommended)

```bash
npm install -g @jordnlvr/mendix-mcp-server
```

### Or Clone from GitHub

```bash
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server
npm install
```

### Test It Works

```bash
# From npm install
mendix-mcp-server --help

# From clone
node src/index.js
# Press Ctrl+C after you see "Server running..."
```

---

## 3. Configuration Guide

### VS Code (GitHub Copilot Chat)

**File:** `%APPDATA%\Code\User\settings.json` (or Code - Insiders)

```json
{
  "chat.mcp.servers": {
    "mendix-expert": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

**Usage:** Type `@mendix-expert` in Copilot Chat, then your question.

---

### Claude Desktop

**File:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

**Usage:** Claude will automatically have access to Mendix tools.

---

### Cursor IDE

**File:** `.cursor/mcp.json` in your project root

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

---

### ChatGPT (Custom GPT)

Start the REST API proxy:

```bash
cd mendix-mcp-server
npm run rest
# Runs on http://localhost:5050
```

Then expose via ngrok for ChatGPT Actions:

```bash
ngrok http 5050
```

Import `openapi.json` into your Custom GPT's Actions configuration.

---

### Environment Variables (Optional)

**Good news: No configuration required!** The server works out of the box.

For enhanced semantic search, you can optionally add:

```env
# OPTIONAL: Better semantic search with OpenAI
OPENAI_API_KEY=sk-your-key-here

# OR for Azure OpenAI (enterprise users)
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# OPTIONAL: Use your own Pinecone (advanced)
# By default uses built-in shared knowledge base
# PINECONE_API_KEY=your_key
```

Without any API keys, the server uses local TF-IDF search (still works well!).

---

## 4. All Available Tools

### Core Knowledge Tools

| Tool                     | Purpose                            | Example Call                          |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| `query_mendix_knowledge` | Search the knowledge base          | `"How do I create a microflow?"`      |
| `search_mendix`          | Hybrid keyword + semantic search   | `"nanoflow vs microflow performance"` |
| `get_best_practice`      | Get recommendations for a scenario | `"security for public REST APIs"`     |

### Project Analysis Tools

| Tool              | Purpose                    | Example Call                                      |
| ----------------- | -------------------------- | ------------------------------------------------- |
| `analyze_project` | Analyze a Mendix .mpr file | `analyze_project path="D:/MyApp/MyApp.mpr"`       |
| `analyze_theme`   | Deep theme/SCSS analysis   | `analyze_theme path="D:/MyApp" format="detailed"` |

### Self-Learning Tools

| Tool                    | Purpose                 | Example Call                       |
| ----------------------- | ----------------------- | ---------------------------------- |
| `add_to_knowledge_base` | Save new knowledge      | Auto-used when learning            |
| `harvest`               | Fetch fresh Mendix docs | `harvest sources=["releaseNotes"]` |

### System Tools

| Tool                  | Purpose                   | Example Call          |
| --------------------- | ------------------------- | --------------------- |
| `hello`               | Health check & stats      | `hello`               |
| `get_usage_analytics` | See what's being searched | `get_usage_analytics` |

---

## 5. Power User Commands

### The Essentials

```
@mendix-expert How do I create a REST service that returns JSON?
```

```
@mendix-expert What's the best practice for handling errors in microflows?
```

```
@mendix-expert Analyze my theme at D:/Projects/MyApp
```

---

### SDK Questions (Platform SDK / Model SDK)

```
@mendix-expert Show me verified Platform SDK code to create a microflow with a loop
```

```
@mendix-expert How do I create an entity with associations using the Model SDK?
```

```
@mendix-expert What's the correct pattern for StringTemplate in LogMessageAction?
```

---

### Theme & Styling

```
@mendix-expert Analyze my design-properties.json for issues
```

```
@mendix-expert What's the scaffold pattern for custom themes?
```

```
@mendix-expert How do I set up local fonts instead of Google Fonts?
```

---

### Debugging & Troubleshooting

```
@mendix-expert Why might my REST service return 403?
```

```
@mendix-expert Common causes of "Object is not retrievable" error
```

```
@mendix-expert How to debug slow page loads in Mendix 10?
```

---

## 6. Beast Mode

### What Is Beast Mode?

Beast Mode triggers exhaustive, multi-step research. Instead of a quick answer, the AI will:

1. Search multiple knowledge sources
2. Cross-reference patterns
3. Fetch web documentation if needed
4. Provide comprehensive, verified answers

### How to Activate

**Option 1: Explicit Request**

```
@mendix-expert [BEAST MODE] Tell me everything about workflow best practices
```

**Option 2: Use Trigger Phrases**

```
@mendix-expert Do deep research on pluggable widget development
```

```
@mendix-expert Give me a comprehensive guide to Mendix security
```

```
@mendix-expert I need exhaustive documentation on the Platform SDK
```

**Trigger words:** `deep`, `comprehensive`, `exhaustive`, `everything about`, `complete guide`

### When to Use Beast Mode

✅ **Good for:**

- Learning a new Mendix feature thoroughly
- Preparing documentation or training materials
- Debugging complex issues
- SDK development requiring verified patterns

❌ **Overkill for:**

- Quick syntax questions
- Simple "how do I..." queries
- Yes/no questions

---

## 7. Integration Options

### Option A: Direct MCP (Best Experience)

**Pros:** Real-time, full tool access, bi-directional
**Setup:** VS Code/Claude/Cursor configuration (see Section 3)
**Best for:** Daily development work

---

### Option B: REST API + ChatGPT

**Pros:** Works in browser, shareable Custom GPT
**Setup:**

```bash
npm run rest          # Start local server
ngrok http 5050       # Expose to internet
# Import openapi.json into ChatGPT Actions
```

**Best for:** Sharing with team members without local setup

---

### Option C: Smithery Cloud

**Pros:** Zero local setup, always available
**Setup:** Install from [smithery.ai/server/@jordnlvr/mendix-mcp-server](https://smithery.ai)
**Best for:** Quick evaluation, cloud-first workflows

---

### Option D: Programmatic Access

```javascript
import { MendixExpertServer } from '@jordnlvr/mendix-mcp-server';

const server = new MendixExpertServer();
const result = await server.query('microflow error handling');
console.log(result);
```

---

## 8. Things to Watch Out For

### ⚠️ Common Pitfalls

| Issue              | Cause                  | Fix                                        |
| ------------------ | ---------------------- | ------------------------------------------ |
| "Server not found" | Wrong path in config   | Use absolute paths with forward slashes    |
| Stale answers      | Old knowledge          | Run `npm run harvest` to refresh           |
| No semantic search | Missing API keys       | Add Pinecone + OpenAI/Azure keys to `.env` |
| Slow responses     | Large project analysis | Use `module_name` filter in analyze tools  |

---

### ⚠️ SDK Pattern Warnings

The knowledge base marks patterns as **verified** or **unverified**:

```
✅ VERIFIED: Tested against real Mendix SDK
⚠️ UNVERIFIED: From documentation, not live-tested
```

**Always test SDK code in a scratch app first!**

Known SDK gotchas documented in knowledge base:

- `model.allEntities()` does NOT exist (use `domainModel.load().entities`)
- `StringTemplate.createIn()` does NOT exist (use `createInLogMessageActionUnderMessageTemplate`)
- Always delete flows BEFORE activities in microflow modifications

---

### ⚠️ Theme Analysis Limitations

- Only analyzes files on disk (not changes in Studio Pro memory)
- SCSS compilation errors may not be detected
- design-properties.json must be valid JSON

---

## 9. Maintenance & Operations

### npm Scripts Reference

```bash
npm start              # Run MCP server (stdio mode)
npm run rest           # Run REST API (port 5050)
npm run reindex        # Reindex vectors after knowledge updates
npm run reindex:force  # Full vector rebuild
npm run harvest        # Fetch latest Mendix docs
npm run maintenance    # Run full maintenance cycle
npm run vector-status  # Check Pinecone connection
npm test               # Run test suite
```

---

### Keeping Knowledge Fresh

**Automatic:** Weekly harvest via GitHub Actions

**Manual:**

```bash
npm run harvest
npm run reindex
```

---

### Checking Health

```
@mendix-expert hello
```

Returns:

- Version number
- Knowledge entry count
- Search index status
- Vector store connection
- Last maintenance time

---

## 10. Troubleshooting

### Server Won't Start

```bash
# Check Node version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Test syntax
node --check src/index.js
```

---

### "Tool not found" in VS Code

1. Reload VS Code window (Ctrl+Shift+P → "Developer: Reload Window")
2. Check Output panel → "MCP" for errors
3. Verify path in settings.json uses forward slashes

---

### Search Returns Nothing

```bash
# Check knowledge base loaded
node -e "import('./src/core/KnowledgeManager.js').then(m => new m.default().load().then(() => console.log('OK')))"

# Rebuild search index
npm run reindex:force
```

---

### REST API Errors

```bash
# Check if port in use
netstat -ano | findstr :5050

# Kill existing process
taskkill /PID <pid> /F

# Restart
npm run rest
```

---

## Quick Reference Card

| I want to...       | Command                                        |
| ------------------ | ---------------------------------------------- |
| Ask a question     | `@mendix-expert <question>`                    |
| Analyze my project | `@mendix-expert analyze my project at D:/path` |
| Get best practices | `@mendix-expert best practice for <topic>`     |
| Deep research      | `@mendix-expert [BEAST MODE] <topic>`          |
| Check status       | `@mendix-expert hello`                         |
| Update knowledge   | `npm run harvest && npm run reindex`           |

---

## Resources

- **GitHub:** [github.com/jordnlvr/mendix-mcp-server](https://github.com/jordnlvr/mendix-mcp-server)
- **npm:** [npmjs.com/package/@jordnlvr/mendix-mcp-server](https://www.npmjs.com/package/@jordnlvr/mendix-mcp-server)
- **Documentation:** [jordnlvr.github.io/mendix-mcp-server](https://jordnlvr.github.io/mendix-mcp-server/)
- **Smithery:** [smithery.ai/server/@jordnlvr/mendix-mcp-server](https://smithery.ai/server/@jordnlvr/mendix-mcp-server)

---

_Built with ❤️ for the Mendix community_

</div>
