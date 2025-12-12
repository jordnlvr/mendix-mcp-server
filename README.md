<p align="center">
  <a href="https://www.npmjs.com/package/@jordnlvr/mendix-mcp-server"><img src="https://img.shields.io/npm/v/@jordnlvr/mendix-mcp-server.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@jordnlvr/mendix-mcp-server"><img src="https://img.shields.io/npm/dm/@jordnlvr/mendix-mcp-server.svg?style=flat-square" alt="npm downloads"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square" alt="Node >= 20">
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/MCP-compatible-purple.svg?style=flat-square" alt="MCP Compatible">
</p>

# 🧠 Mendix Expert MCP Server

> **A self-learning, auto-researching MCP server that gives AI assistants deep Mendix expertise and grows smarter with every interaction.**

[![npm install](https://nodei.co/npm/@jordnlvr/mendix-mcp-server.png?mini=true)](https://www.npmjs.com/package/@jordnlvr/mendix-mcp-server)

---

## 🚀 Quick Install

```bash
# Install globally
npm install -g @jordnlvr/mendix-mcp-server

# Or use with npx (no install needed)
npx @jordnlvr/mendix-mcp-server
```

**📖 Full Documentation:** [jordnlvr.github.io/mendix-mcp-server](https://jordnlvr.github.io/mendix-mcp-server/)

---

## 🆕 What's New in v3.5.1

### 🌍 Universal Self-Learning (v3.5.1)

**Every AI client now learns automatically!**

- **Quality signals for ALL clients** - GitHub Copilot, Claude Desktop, Cursor, ChatGPT, n8n, Make, Zapier
- **MCP tools get quality assessment** - `query_mendix_knowledge` and `get_best_practice` return answer quality
- **Shared logic** - `assessAnswerQuality()` ensures consistent behavior across REST and MCP
- **Self-learning instructions** - AI clients are guided to add knowledge when results are weak

### 🧠 Self-Learning API (v3.5.0)

- **NEW: `POST /learn` endpoint** - Add knowledge via REST API
- **Accepts:** title, content, category, source, sourceUrl, mendixVersion, tags
- **Auto-stores to Supabase + auto-indexes to Pinecone**
- **Quality assessment on `/search`** - Returns `answerQuality` and `beastModeNeeded`

### 🗄️ Supabase-First Storage (v3.4.0)

- **242+ knowledge entries** in PostgreSQL (no more JSON file chaos!)
- **Single source of truth** - Supabase is primary, vectors in Pinecone
- **Persistent across restarts** - Railway containers can restart without data loss

### 🔮 Pinecone Auto-Indexing (v3.4.1-3.4.2)

- **253 vectors indexed** - All knowledge searchable semantically
- **Auto-index on add** - New knowledge immediately gets vector embeddings
- **OpenAI text-embedding-3-small** - 1536 dimensions, truncated to 6000 chars

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

## 🤔 What Is This?

This is a **Model Context Protocol (MCP) server** that supercharges AI assistants (like GitHub Copilot, Claude, ChatGPT) with:

1. **Deep Mendix Knowledge** - 700KB+ of curated entries about SDK patterns, best practices, troubleshooting
2. **Semantic Vector Search** - Pinecone + Azure OpenAI/OpenAI embeddings for meaning-based search
3. **Self-Learning** - Every discovery gets saved to the knowledge base automatically
4. **Auto-Harvesting** - Scheduled crawls of docs.mendix.com for fresh content
5. **Project & Theme Analysis** - Analyze `.mpr` files AND custom themes with grades (A+ to F)
6. **Beast Mode** - Exhaustive 5-tier research protocol when answers aren't in the knowledge base
7. **Analytics Dashboard** - Visual dashboard showing usage patterns and popular topics
8. **Studio Pro Extensions** - Complete guide for building C# extensions for Studio Pro 11+

**Think of it as giving your AI assistant a Mendix expert's brain that keeps getting smarter.**

---

## ✨ Key Features

| Feature                        | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| 🌍 **Universal Self-Learning** | ALL clients (Copilot, Claude, ChatGPT, n8n) get quality signals & learn    |
| 🧠 **REST `/learn` Endpoint**  | Add knowledge via HTTP - ChatGPT can store what it finds                   |
| 🔍 **Intelligent Search**      | TF-IDF with fuzzy matching - typos like "micorflow" still find "microflow" |
| 🔮 **Vector Search**           | Semantic search using Pinecone (253 vectors, 1536 dimensions)              |
| 🎯 **Hybrid Search**           | Combined keyword + semantic search for best of both worlds                 |
| 📊 **Quality Assessment**      | Every search returns `answerQuality` and `beastModeNeeded`                 |
| 🔬 **Beast Mode**              | 5-tier research protocol - docs, GitHub, npm, forums, archives             |
| 🗄️ **Supabase Storage**        | 242+ entries in PostgreSQL - survives Railway restarts                     |
| 🎨 **Theme Analyzer v2.0**     | Web-focused, follows @imports, CSS custom properties, letter grades        |
| 📁 **Project Analysis**        | Analyze any `.mpr` file - discover modules, entities, microflows           |
| 🧩 **Studio Pro Extensions**   | Build C# extensions for Studio Pro 11+ with verified patterns              |
| 🔄 **Auto-Deploy**             | Push to GitHub → Railway deploys automatically                             |

---

## 🔬 The Research Protocol (Beast Mode)

**This is the magic.** When the knowledge base doesn't have an answer, the AI is instructed to search through **5 tiers exhaustively**:

### 📚 Tier 1: Official Sources

- docs.mendix.com, API references, Academy, Marketplace
- Release notes (version-specific changes)

### 💻 Tier 2: Code Repositories

- **GitHub mendix org** - sdk-demo (GOLDMINE!), widgets-resources, docs repo
- **GitHub Code Search** - Find real implementations across ALL repos
- **npm packages** - Search `mendixmodelsdk`, `mendixplatformsdk`, `@mendix/*`

### 💬 Tier 3: Community Sources

- Mendix Forum (community.mendix.com)
- Stack Overflow ([mendix] tag)
- GitHub Issues & Discussions
- Reddit (r/mendix, r/lowcode)
- Dev.to, Medium, LinkedIn articles

### 🗄️ Tier 4: Archives

- **Wayback Machine** (web.archive.org) - Old/removed docs
- **archive.today** (archive.ph) - Preserved pages
- **Google Cache** - Recently cached versions

### 🎬 Tier 5: Video & Multimedia

- YouTube (Mendix Official, Mendix World talks)
- LinkedIn Learning courses

### ⚠️ Version Grading

Results are graded by version compatibility:

- 🟢 **Exact** - Same Mendix version
- 🟡 **Close** - Same major version (10.x matches 10.y)
- 🟠 **Relevant** - Different major but concept applies
- ⚪ **Legacy** - Old but useful for understanding

### 🧠 Self-Learning

After finding ANY information:

1. ✅ Automatically saves to knowledge base
2. ✅ Re-indexes keyword search
3. ✅ **Updates vector embeddings** for semantic search

**The knowledge base grows every time you use it!**

See [docs/RESEARCH-PROTOCOL.md](docs/RESEARCH-PROTOCOL.md) for the full protocol.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server
npm install
```

### 2. Configure Your MCP Client

**VS Code (Copilot Chat)**

Add to your VS Code `settings.json`:

```json
"chat.mcp.servers": {
  "mendix-expert": {
    "type": "stdio",
    "command": "node",
    "args": ["C:/path/to/mendix-mcp-server/src/index.js"]
  }
}
```

**Claude Desktop**

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mendix-expert": {
      "command": "node",
      "args": ["C:/path/to/mendix-mcp-server/src/index.js"]
    }
  }
}
```

### 3. Use It!

In your AI chat:

- `@mendix-expert` - Ask about Mendix development
- "How do I create a microflow with the SDK?"
- "Analyze my project at D:/Projects/MyApp.mpr"

---

## 🌐 REST API (NEW in v2.5.2!)

Want to use Mendix Expert from **ChatGPT Custom GPTs**, **web apps**, or **other tools**? The REST API exposes all functionality over HTTP.

### Start the REST Server

```bash
# Using npm script
npm run rest

# Or directly
node src/rest-proxy.js
```

Server runs at `http://localhost:5050`

### Available Endpoints

| Endpoint          | Method | Description                           |
| ----------------- | ------ | ------------------------------------- |
| `/health`         | GET    | Health check and status               |
| `/status`         | GET    | Server status with example queries    |
| `/tools`          | GET    | List all available endpoints          |
| `/dashboard`      | GET    | 📊 Visual analytics dashboard (HTML)  |
| `/beast-mode`     | GET    | 🔥 Get Beast Mode research protocol   |
| `/analytics`      | GET    | Usage analytics and statistics (JSON) |
| `/harvest-status` | GET    | 🌾 Check harvest schedule & status    |
| `/query`          | POST   | Query knowledge base                  |
| `/search`         | POST   | Hybrid search (keyword + semantic)    |
| `/best-practice`  | POST   | Get best practice recommendations     |
| `/analyze`        | POST   | Analyze Mendix project                |
| `/analyze-theme`  | POST   | 🎨 Deep theme analysis with grading   |
| `/harvest`        | POST   | 🌾 Trigger manual harvest             |
| `/knowledge-gap`  | POST   | 📝 Report missing knowledge           |

### Example Usage

```bash
# Health check
curl http://localhost:5050/health

# Search for entity creation
curl -X POST http://localhost:5050/search \
  -H "Content-Type: application/json" \
  -d '{"query":"how to create entity SDK","limit":5}'

# Get best practices
curl -X POST http://localhost:5050/best-practice \
  -H "Content-Type: application/json" \
  -d '{"scenario":"microflow error handling"}'
```

### ChatGPT Integration

Make Mendix Expert available as a ChatGPT Custom GPT with public internet access:

```powershell
# One command to start REST server + ngrok tunnel
.\start-chatgpt-api.ps1

# Check status anytime
.\check-api-status.ps1
```

**Full setup guide:** [docs/CHATGPT-SETUP.md](docs/CHATGPT-SETUP.md)

Quick steps:

1. Run `.\start-chatgpt-api.ps1` - starts server and shows public URL
2. Create a Custom GPT at chat.openai.com
3. Go to Configure → Actions → Import from URL
4. Enter: `https://YOUR-NGROK-URL.ngrok-free.app/openapi.json`
5. Copy the system prompt from [docs/CHATGPT-SETUP.md](docs/CHATGPT-SETUP.md)

**Note:** Free ngrok URLs change on restart. Keep the script running or consider ngrok's paid tier for a stable URL.

---

## ☁️ Cloud Deployment (Railway + Supabase)

**No local server needed!** The Mendix Expert API is available 24/7 at:

```
https://mendix-mcp-server-production.up.railway.app
```

### 🗄️ Persistent Knowledge with Supabase

**NEW in v3.3.0:** The server uses Supabase for persistent cloud storage. This means:

- ✅ **Knowledge persists across container restarts** (Railway's ephemeral filesystem is no longer a problem)
- ✅ **Self-learning works in the cloud** - knowledge added via the API is permanently saved
- ✅ **Shared knowledge base** - Local and cloud instances share the same knowledge
- ✅ **Faster searches** - PostgreSQL full-text search with indexes

To enable Supabase on your own deployment, see [docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md).

### Using the Cloud API

```bash
# Health check
curl https://mendix-mcp-server-production.up.railway.app/health

# Search the knowledge base
curl -X POST https://mendix-mcp-server-production.up.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{"query":"microflow creation SDK"}'

# Get best practices
curl -X POST https://mendix-mcp-server-production.up.railway.app/best-practice \
  -H "Content-Type: application/json" \
  -d '{"scenario":"error handling"}'
```

### ChatGPT Custom GPT (Cloud)

Use the cloud API for ChatGPT Custom GPTs - no ngrok needed!

1. Create a Custom GPT at chat.openai.com
2. Go to Configure → Actions → Import from URL
3. Enter: `https://mendix-mcp-server-production.up.railway.app/openapi.json`
4. Save and use!

### n8n Integration

Add an HTTP Request node with:

```
URL: https://mendix-mcp-server-production.up.railway.app/search
Method: POST
Body: { "query": "your search term" }
```

### Deploy Your Own Instance

Want your own Railway instance? See [docs/RAILWAY-DEPLOYMENT.md](docs/RAILWAY-DEPLOYMENT.md).

---

## 📚 Available Tools

| Tool                     | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `query_mendix_knowledge` | Search the knowledge base for any Mendix topic         |
| `analyze_project`        | Analyze a `.mpr` file or extracted project directory   |
| `analyze_theme`          | 🎨 **NEW!** Deep theme analysis with grading (A+ to F) |
| `get_best_practice`      | Get recommendations for specific scenarios             |
| `add_to_knowledge_base`  | Contribute new knowledge (auto quality scoring)        |
| `sync_mcp_server`        | Sync with GitHub (pull updates, push changes)          |
| `harvest`                | 🌾 Crawl Mendix docs for fresh knowledge               |
| `harvest_status`         | Check harvest status and available sources             |
| `hello`                  | Get a welcome screen with status and examples          |
| `beast_mode`             | 🔥 Get the exhaustive research protocol prompt         |
| `vector_search`          | 🔮 Semantic search - find concepts                     |
| `hybrid_search`          | 🎯 Combined keyword + semantic search                  |
| `vector_status`          | Check Pinecone index and search stats                  |
| `reindex_vectors`        | Re-index knowledge for vector search                   |
| `get_usage_analytics`    | 📊 View usage stats, popular topics, trends            |

---

## 🔥 Beast Mode Research Protocol

The server includes an **aggressive, exhaustive research protocol** that ensures AI assistants never give up when searching for Mendix answers.

### What It Does

When enabled (it's embedded in every query!), Beast Mode mandates:

1. **6-Tier Exhaustive Search** - Official docs → GitHub code → npm packages → Community → Archives → Obscure sources
2. **Never Give Up** - Search ALL tiers before saying "I don't know"
3. **Version Awareness** - Always verify Mendix version compatibility (7.x through 11.x differ!)
4. **Auto-Learning** - Save everything found to knowledge base

### Key Gold Mine Sources

| Source                                    | Why It's Critical                                     |
| ----------------------------------------- | ----------------------------------------------------- |
| `github.com/mendix/sdk-demo`              | Has schema extraction patterns!                       |
| `npm search mendixmodelsdk`               | Find packages that USE the SDK - real implementations |
| `web.archive.org/web/*/docs.mendix.com/*` | Old/removed documentation                             |

### Get the Full Prompt

```bash
# Get the full copy-paste ready research prompt
@mendix-expert beast_mode

# Get a brief summary
@mendix-expert beast_mode format="brief"

# Get explanation of what it is
@mendix-expert beast_mode format="instructions"
```

Use the prompt output in ANY AI chat to enable exhaustive Mendix research!

See [docs/RESEARCH-PROTOCOL.md](docs/RESEARCH-PROTOCOL.md) for the complete protocol.

---

## 🌾 Knowledge Harvester (NEW!)

The server can automatically crawl official Mendix documentation to stay up-to-date!

### How It Works

```
Scheduled Crawler → docs.mendix.com → Parse → Add to Knowledge Base
                                                      ↓
                              User Query → TF-IDF Search → Results
```

### Sources Indexed

| Source                   | Content                               | Priority |
| ------------------------ | ------------------------------------- | -------- |
| Studio Pro Release Notes | 10.x, 11.x changelogs                 | High     |
| Reference Guide          | Pages, domain model, microflows       | High     |
| How-To Guides            | Front-end, integration, extensibility | Medium   |
| Studio Pro Guide         | Page variables, Maia, workflows       | High     |
| SDK Documentation        | Platform SDK, Model SDK               | High     |
| API Documentation        | REST, OData, web services             | Medium   |

### Priority Topics Auto-Harvested

- ✅ Page Variables (new in 10.0+)
- ✅ Workflows 2.0
- ✅ Maia AI Assistant
- ✅ Atlas UI 3.x / Design Tokens
- ✅ Pluggable Widgets API
- ✅ Studio Pro Extensions
- ✅ Platform & Model SDK patterns

### Usage

```bash
# Harvest all sources
@mendix-expert harvest

# Harvest specific sources
@mendix-expert harvest sources=["releaseNotes", "mxsdk"]

# Check harvest status
@mendix-expert harvest_status

# Dry run (preview without saving)
@mendix-expert harvest dryRun=true
```

### Auto-Harvest Schedule

- Runs automatically every **7 days**
- Can be triggered manually anytime
- Rebuilds search index after adding new knowledge

---

## 🔮 Vector Search (Enhanced in v2.8.0!)

The server includes **semantic vector search** using Pinecone! This means you can search by **meaning**, not just keywords.

### Why Vector Search?

| Keyword Search              | Vector Search                                                 |
| --------------------------- | ------------------------------------------------------------- |
| Finds "microflow"           | Finds "microflow", "workflow", "automation", "business logic" |
| Exact match required        | Semantic understanding                                        |
| "loop" won't find "iterate" | "loop" finds "iterate", "forEach", "while"                    |

### Zero Configuration Required! 🎉

**Good news: Vector search works out of the box!** The server includes a built-in connection to the shared Mendix knowledge base. No Pinecone account or API key needed.

### Optional: Improve Search Quality with Embeddings

For the best semantic search quality, provide an embedding API key:

#### Option 1: OpenAI (Recommended for most users)

```env
OPENAI_API_KEY=sk-your-key-here
```

#### Option 2: Azure OpenAI (Enterprise/Siemens users)

```env
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002
```

**Priority Order:** Azure OpenAI → Standard OpenAI → Local TF-IDF (fallback)

**Without any API keys:** Server uses local TF-IDF search - still works great!

### Advanced: Use Your Own Pinecone Index

If you want to maintain your own knowledge base:

```env
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your-index-name
```

### Usage

```bash
# Semantic search - finds conceptually related content
@mendix-expert vector_search query="how to iterate over a list"

# Hybrid search - best of both worlds
@mendix-expert hybrid_search query="microflow error handling"

# Check vector index status
@mendix-expert vector_status

# Re-index after adding new knowledge
@mendix-expert reindex_vectors
```

### How Hybrid Search Works

```
User Query: "loop through entities"
    │
    ├─→ Keyword Search (40% weight)
    │      Finds: "loop", "entity", "iterate"
    │
    └─→ Vector Search (60% weight)
           Finds: "forEach", "list iteration", "aggregate"
    │
    └─→ Reciprocal Rank Fusion
           Merges results, ranks by combined score
           🎯 = Both matched, 📝 = Keyword only, 🔮 = Vector only
```

---

## 📊 MCP Resources

Access these via the MCP resources protocol:

| Resource                      | What It Shows                                 |
| ----------------------------- | --------------------------------------------- |
| `mendix://knowledge/overview` | Knowledge base summary & file list            |
| `mendix://stats`              | Server statistics (uptime, cache, index size) |
| `mendix://search/config`      | Current search configuration                  |
| `mendix://validation/report`  | Knowledge validation errors/warnings          |
| `mendix://analytics`          | Search analytics (hit rate, top terms, gaps)  |
| `mendix://staleness`          | Entries older than 90 days needing updates    |
| `mendix://maintenance`        | Auto-maintenance schedule & status            |

---

## 🔧 Search Features

### Fuzzy Matching

Typos are handled gracefully:

- `"micorflow"` → finds **microflow**
- `"domian model"` → finds **domain model**
- `"platfrom sdk"` → finds **platform sdk**

### Synonym Expansion

Searches automatically expand:

- `MF` → microflow
- `DM` → domain model
- `SDK` → mendixmodelsdk, mendixplatformsdk
- `NP` → non-persistent

### Stemming

Finds variations:

- `"microflows"` matches **microflow**
- `"creating"` matches **create**
- `"validation"` matches **validate**

---

## 📁 Knowledge Base

177 entries across 9 topic files:

| File                           | Entries | Topics                                   |
| ------------------------------ | ------- | ---------------------------------------- |
| `model-sdk.json`               | 25      | Model manipulation, elements, properties |
| `platform-sdk.json`            | 23      | Working copies, commits, branches        |
| `best-practices.json`          | 28      | Naming, architecture, performance        |
| `troubleshooting.json`         | 22      | Common errors and solutions              |
| `studio-pro.json`              | 20      | Studio Pro features, shortcuts           |
| `advanced-patterns.json`       | 18      | Complex SDK patterns                     |
| `performance-guide.json`       | 15      | Optimization techniques                  |
| `security-guide.json`          | 14      | Security best practices                  |
| `sdk-community-resources.json` | 12      | Community links, forums                  |
| `pluggable-widgets.json`       | 6       | **NEW!** Widget types, hooks, patterns   |
| `getting-started.json`         | 4       | **NEW!** Environment setup guides        |

---

## 🧪 Verified Patterns (v2.5.0)

All SDK and Widget patterns have been **live-tested** against real Mendix apps in December 2025.

### ✅ Platform/Model SDK Patterns (VERIFIED)

These patterns are confirmed working with `mendixplatformsdk` + `mendixmodelsdk`:

| Pattern                            | Status | Notes                            |
| ---------------------------------- | ------ | -------------------------------- |
| Entity creation                    | ✅     | All 5 attribute types work       |
| Association creation               | ✅     | Reference type verified          |
| Microflow creation                 | ✅     | Start → LogMessage → End         |
| `model.allDomainModels()`          | ✅     | Returns domain model interfaces  |
| `model.allMicroflows()`            | ✅     | Returns all microflow interfaces |
| `model.flushChanges()`             | ✅     | Required before commit           |
| `workingCopy.commitToRepository()` | ✅     | Commits to branch                |

### ⚠️ Critical API Corrections

| Incorrect Pattern              | Correct Pattern                                                          |
| ------------------------------ | ------------------------------------------------------------------------ |
| `model.allEntities()`          | **Does NOT exist** - use `domainModel.load().entities`                   |
| `StartEvent.createIn(mf)`      | `StartEvent.createIn(mf.objectCollection)`                               |
| `StringTemplate.create(model)` | `StringTemplate.createInLogMessageActionUnderMessageTemplate(logAction)` |
| `workingCopy.id()`             | `workingCopy.id` (it's a property, not a method)                         |

### ✅ Widget API Patterns (VERIFIED)

These types compile correctly with `mendix@11.5.0`:

**Core Types**: EditableValue, DynamicValue, ActionValue, ListValue, ListAttributeValue, ListActionValue, SelectionSingleValue, ListExpressionValue, ListWidgetValue

**React Hooks**: useConst, useSetup, useDebounce, useLazyListValue, useSelectionHelper, useOnResetValueEvent, useOnSetValueEvent, useFilterAPI

### 📚 Getting Started Guides

The knowledge base now includes **step-by-step setup guides** for:

1. **Platform/Model SDK** - Connect to Mendix, create working copies, modify models
2. **Pluggable Widgets** - Create custom React widgets for Studio Pro
3. **Studio Pro Extensions** - Build C# or web extensions for the IDE
4. **mx.exe Analysis** - Local offline analysis of .mpr files

Ask: `@mendix-expert "How do I set up SDK development?"` or `"Getting started with pluggable widgets"`

---

## 🔄 Auto-Maintenance

The server maintains itself with scheduled tasks:

| Task                  | Frequency        | Purpose                           |
| --------------------- | ---------------- | --------------------------------- |
| Validation            | Every 7 days     | Check knowledge quality           |
| Staleness Check       | Every 7 days     | Find outdated entries             |
| Cache Cleanup         | Daily            | Clear expired cache               |
| Analytics Reset       | Every 14 days    | Archive and reset stats           |
| **Knowledge Harvest** | **Every 7 days** | **Crawl Mendix docs for updates** |

View status via `mendix://maintenance` resource.

---

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the enhancement roadmap.

### Phase 1: Knowledge Harvester ✅ COMPLETE

- Auto-crawl Mendix documentation
- Weekly auto-updates
- Priority topic targeting (Maia, page variables, etc.)

### Phase 2: Vector Search 🔮 PLANNED

- Pinecone integration for semantic search
- Hybrid keyword + vector search
- "How do I loop" finds "iteration patterns"

### Phase 3: RAG Integration 🚀 FUTURE

- Generated answers with context
- Source citations
- Conversation memory

---

## 📈 Performance

Current metrics:

- **92% hit rate** - Most queries find relevant results
- **2ms average response** - Near-instant answers
- **177 indexed entries** - Comprehensive coverage
- **3,157 unique terms** - Rich vocabulary

---

## 🛠️ Development

### Project Structure

```
mendix-mcp-server/
├── src/
│   ├── index.js              # Main MCP server
│   ├── core/
│   │   ├── SearchEngine.js   # TF-IDF + fuzzy search
│   │   ├── KnowledgeManager.js
│   │   ├── CacheManager.js
│   │   ├── ProjectLoader.js
│   │   └── QualityScorer.js
│   └── utils/
│       ├── MaintenanceScheduler.js
│       ├── WebFetcher.js
│       └── ...
├── knowledge/               # Knowledge base JSON files
├── config/default.json      # Configuration
└── package.json
```

### Testing

```bash
# Test search
node -e "
const SE = require('./src/core/SearchEngine.js');
const e = new SE(); e.initialize('./knowledge');
console.log(e.search('microflow'));
"

# Validate knowledge
node -e "
const KM = require('./src/core/KnowledgeManager.js');
new KM('./knowledge').validateKnowledgeBase().then(r => console.log(r.summary));
"
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Ideas

- 📚 Add knowledge entries for topics you know well
- 🐛 Report bugs or unexpected behavior
- ✨ Suggest new features
- 📖 Improve documentation

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

### Recent Updates (v2.5.0) 🆕

- 🧪 **Verified SDK Patterns** - All patterns live-tested against real Mendix apps
- 🔧 **Critical Bug Fixes** - Fixed `model.allEntities()`, `StartEvent.createIn()`, `StringTemplate` patterns
- 📚 **Pluggable Widgets Knowledge** - 9 widget types, 8 React hooks, filter builders
- 🚀 **Getting Started Guides** - Step-by-step environment setup for SDK, widgets, extensions
- 📖 **Enhanced Documentation** - Verified patterns, API corrections, setup guides

### v2.4.1

- 🔧 **Self-Learning Pipeline Fix** - `add_to_knowledge_base` now updates vector store
- 🔧 **Harvester Integration** - Auto-harvest now re-indexes vectors after adding new knowledge
- 📚 **Documentation** - Updated README with Azure OpenAI setup and maintenance guide

### v2.4.0

- 🧠 **Azure OpenAI Embeddings** - 3x faster than standard OpenAI (355ms vs 971ms)
- 🔮 **Enhanced Semantic Search** - 1536-dimension vectors for better understanding
- ⚖️ **Rebalanced Weights** - 40% keyword / 60% vector for optimal results
- 🔄 **Embedding Fallback Chain** - Azure → OpenAI → Local TF-IDF

### v2.3.0

- 🔮 **Vector Search** - Semantic search using Pinecone
- 🎯 **Hybrid Search** - Combined keyword + vector with RRF fusion
- 📊 **316 Knowledge Vectors** - Full knowledge base indexed

### v2.2.0

- 🌾 **Knowledge Harvester** - Auto-crawl Mendix docs for fresh knowledge
- ✅ Weekly auto-harvest from official documentation
- ✅ Priority topic targeting (Maia, page variables, workflows 2.0)
- ✅ Release notes parser for Studio Pro 10.x, 11.x

### v2.1.0

- ✅ Fuzzy search with Levenshtein distance
- ✅ Analytics tracking with knowledge gap detection
- ✅ Auto-maintenance scheduler

---

## 🔧 Maintenance Guide

### Keeping the Knowledge Base Current

The MCP server is designed to be **self-maintaining**:

| Feature             | How It Works                                       | Frequency             |
| ------------------- | -------------------------------------------------- | --------------------- |
| **Auto-Harvest**    | Crawls docs.mendix.com for new content             | Weekly (every 7 days) |
| **Self-Learning**   | Saves solutions discovered during research         | On every discovery    |
| **Vector Re-Index** | Updates semantic embeddings when knowledge changes | Automatic             |

### Manual Maintenance Tasks

1. **Trigger Manual Harvest**

   ```bash
   @mendix-expert harvest
   ```

2. **Re-index Vectors** (if search seems off)

   ```bash
   @mendix-expert reindex_vectors
   ```

3. **Check Index Health**

   ```bash
   @mendix-expert vector_status
   ```

4. **Sync with GitHub** (if running on multiple machines)
   ```bash
   @mendix-expert sync_mcp_server
   ```

### Monitoring

- **Hit Rate**: Should be >90% (check via `@mendix-expert hello`)
- **Vector Count**: Should match knowledge entry count (~300+)
- **Last Harvest**: Check `harvest_status` - should be <7 days old

### Troubleshooting

| Issue                       | Fix                                                                   |
| --------------------------- | --------------------------------------------------------------------- |
| Search results seem wrong   | Run `reindex_vectors`                                                 |
| Missing new Mendix features | Run `harvest` to fetch latest docs                                    |
| Slow embeddings             | Check if Azure OpenAI key is configured (faster than standard OpenAI) |
| No vector results           | Built-in Pinecone works automatically; check network connectivity     |

- ✅ Web suggestions for missed queries
- ✅ Staleness detection for old entries
- ✅ GitHub sync reminder system

---

## 📜 License

[MIT License](LICENSE) - Use it, modify it, share it!

---

## 🙏 Acknowledgments

- **Mendix** - For the amazing low-code platform
- **Model Context Protocol** - For the MCP specification
- **Kelly Seale** - Co-creator and Mendix SDK expert

---

<p align="center">
  <strong>Built with 💜 for the Mendix community</strong>
</p>
