# Mendix Expert MCP Server v2.0

> A modular, scalable, self-learning MCP server providing comprehensive Mendix development knowledge and dynamic project analysis.

## 🚀 What's New in v2.0

### 🎯 Universal Project Analysis

- **No more hard-coded paths!** Analyze ANY Mendix project (.mpr or extracted directory)
- Dynamic module discovery • Multi-project support with intelligent caching

### 🔍 Intelligent Search

- **50x faster** with inverted index • Relevance scoring with TF-IDF
- Quality-weighted results • Related topic suggestions

### ⭐ Quality Scoring

- Multi-factor assessment (source, recency, usage, verification)
- Automatic quality tiers • Continuous improvement through usage tracking

### 🧠 Self-Learning

- Automatic duplicate detection • Intelligent duplicate merging
- Version history tracking • Knowledge evolution over time

### ⚡ Performance

- Smart LRU/LFU caching • Efficient indexing
- Minimal memory footprint • Sub-millisecond query response

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Tools](#-tools)
- [Configuration](#-configuration)
- [Migration](#-migration)
- [Architecture](#-architecture)
- [Troubleshooting](#-troubleshooting)

## 🔧 Installation

### Prerequisites

- Node.js >= 18.0.0 • npm or pnpm • MCP-compatible client (VS Code with Copilot, Claude Desktop)

### Install Dependencies

```powershell
cd mendix-mcp-server
npm install
```

**Dependencies:** `@modelcontextprotocol/sdk`, `fs-extra`, `glob`, `uuid`

## 🎯 Quick Start

### 1. Configure VS Code

Add to your `settings.json`:

```json
{
  "github.copilot.chat.mcp": {
    "enabled": true,
    "servers": {
      "mendix-expert": {
        "command": "node",
        "args": ["D:\\path\\to\\mendix-mcp-server\\src\\index.js"]
      }
    }
  }
}
```

### 2. Configure Projects (Optional)

Edit `config/default.json`:

```json
{
  "paths": {
    "projects": {
      "onetech": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
      "myapp": "C:\\Projects\\MyApp\\MyApp.mpr"
    }
  }
}
```

### 3. Start Using

Restart VS Code, then:

```
@mendix-expert What are best practices for domain model design?
```

## 📖 Usage

### In GitHub Copilot Chat

```
@mendix-expert [your question]
```

### Command Line

```powershell
npm start     # Start server
npm run dev   # Development mode with auto-restart
npm run legacy # Run v1.0
```

## 🛠️ Tools

### 1. query_mendix_knowledge

Search the knowledge base with intelligent ranking.

**Parameters:**

- `topic` (required): Your search query
- `detail_level` (optional): 'brief' | 'detailed' | 'comprehensive'
- `max_results` (optional): Maximum results (default: 10)

**Example:**

```
@mendix-expert Query knowledge about microflows and performance
```

**Returns:** Relevance score • Quality score • Source URL • Usage stats • Related topics

---

### 2. analyze_project

Analyze entities in ANY Mendix project.

**Parameters:**

- `project_path` (required): Path to .mpr or extracted directory
- `module_name` (required): Module containing entity
- `entity_name` (required): Entity to analyze

**Example:**

```
@mendix-expert Analyze ServiceRequest entity in OneTech RequestHub module
```

**Returns:** Attributes • Associations • Documentation • Module context

**Note:** Works with ANY Mendix project!

---

### 3. get_best_practice

Get best practice recommendations for specific scenarios.

**Parameters:**

- `scenario` (required): Development scenario

---

### 4. add_to_knowledge_base

Add knowledge with auto-learning features.

**Parameters:**

- `knowledge_file` (required): Target file
- `category` (required): Category
- `content` (required): Knowledge content
- `source` (required): Source URL for quality scoring
- `verified` (optional): Verification status

**Auto-Learning:**

- Duplicate detection • Intelligent merging • Quality scoring • Version tracking

---

## 📊 Resources

Access via MCP resource URIs:

| Resource      | URI                        | Description             |
| ------------- | -------------------------- | ----------------------- |
| All Knowledge | `mendix://knowledge/all`   | Complete knowledge base |
| KB Statistics | `mendix://stats/knowledge` | Knowledge metrics       |
| Search Stats  | `mendix://stats/search`    | Search performance      |
| Project Stats | `mendix://stats/projects`  | Loaded projects info    |

---

## ⚙️ Configuration

### Configuration File

`config/default.json` contains all settings:

```json
{
  "cache": {
    "strategy": "lru", // or "lfu"
    "maxSize": 100,
    "defaultTTL": 1800000 // 30 minutes
  },
  "search": {
    "maxResults": 10,
    "minRelevance": 0.3
  },
  "quality": {
    "sourceReliability": {
      "docs.mendix.com": 1.0,
      "academy.mendix.com": 0.95,
      "github.com/mendix": 0.9,
      "marketplace.mendix.com": 0.85,
      "forum.mendix.com": 0.8
    }
  }
}
```

### Environment Variables

Override settings using dot notation:

```powershell
$env:MENDIX_MCP_CACHE_STRATEGY = "lfu"
$env:MENDIX_MCP_PATHS_PROJECTS_ONETECH = "C:\Path\To\OneTech.mpr"
npm start
```

**Pattern:** `MENDIX_MCP_<SECTION>_<KEY>_<SUBKEY>`

---

## 🔄 Migration

### From v1.0 to v2.0

**See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for complete details.**

**Key Changes:**

1. **Tool name changed:** `analyze_onetech_entity` → `analyze_project` (now accepts any project)
2. **Entry point changed:** `server.js` → `src/index.js`
3. **New parameter:** Added `source` to `add_to_knowledge_base`
4. **Configuration externalized:** All settings in `config/default.json`

**Quick Migration Steps:**

1. Update VS Code settings to use `src/index.js`
2. Update tool calls to use `analyze_project` with `project_path`
3. Configure projects in `config/default.json`
4. Restart VS Code

**Rollback:** Use `npm run legacy` to run v1.0

---

## 🏗️ Architecture

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete details.**

### High-Level Structure

```
src/
├── index.js              # Server entry point, MCP protocol
├── utils/
│   ├── logger.js         # Centralized logging
│   ├── validator.js      # Input validation
│   └── config.js         # Configuration management
├── core/
│   ├── CacheManager.js   # Smart caching (LRU/LFU)
│   ├── ProjectLoader.js  # Dynamic project loading
│   ├── KnowledgeManager.js # KB CRUD + versioning
│   ├── SearchEngine.js   # Inverted index search
│   └── QualityScorer.js  # Multi-factor quality
└── tools/
    └── index.js          # MCP tool implementations
```

### Design Principles

- **Modularity:** Each component has single responsibility
- **Dependency Injection:** All dependencies injected for testability
- **Separation of Concerns:** Clear boundaries between layers
- **Performance:** Caching and indexing for speed
- **Quality:** Built-in validation and scoring

---

## 💻 Development

### Running Tests

```powershell
npm test
```

### Development Mode

```powershell
npm run dev  # Auto-restart on changes
```

### Adding a New Tool

1. Create tool class in `src/tools/index.js`
2. Implement `execute()` and `getSchema()`
3. Export and initialize in `src/index.js`
4. Add to CallToolRequestSchema handler

See [ARCHITECTURE.md](./ARCHITECTURE.md#extension-points) for details.

---

## 🐛 Troubleshooting

### Server Won't Start

**Check:**

1. Node version: `node --version` (>= 18)
2. Dependencies: `npm install`
3. Config: Check logs for validation errors
4. VS Code settings: Verify path to `src/index.js`

**Debug:**

```powershell
node src/index.js 2>&1 | Select-String -Pattern "ERROR"
```

---

### Tool Execution Fails

**Common issues:**

- **"Unknown tool"** - Tool name misspelled
- **"Validation error"** - Missing or invalid parameters
- **"Project not found"** - Invalid project path

---

### Poor Search Results

**Solutions:**

1. Restart server (rebuilds index)
2. Lower `search.minRelevance` in config
3. Add more knowledge using `add_to_knowledge_base`

---

### High Memory Usage

**Solutions:**

```json
{
  "cache": {
    "maxSize": 50, // Reduce from 100
    "defaultTTL": 900000 // 15 min instead of 30
  }
}
```

---

## 📚 Resources

### Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - v1.0 → v2.0 migration guide
- [AUTO-RESEARCH-FEATURE.md](./AUTO-RESEARCH-FEATURE.md) - Auto-learning details

### Mendix Resources

- [Mendix Documentation](https://docs.mendix.com/)
- [Mendix Academy](https://academy.mendix.com/)
- [Mendix Forum](https://forum.mendix.com/)
- [Mendix GitHub](https://github.com/mendix)

### MCP Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

## 🎉 Features Comparison

| Feature             | v1.0         | v2.0             |
| ------------------- | ------------ | ---------------- |
| Project Analysis    | OneTech only | Any project      |
| Search              | Linear O(n)  | Indexed O(log n) |
| Quality Scoring     | ❌           | ✅ Multi-factor  |
| Duplicate Detection | ❌           | ✅ Automatic     |
| Version Tracking    | ❌           | ✅ Full history  |
| Caching             | ❌           | ✅ LRU/LFU       |
| Relevance Ranking   | ❌           | ✅ TF-IDF        |
| Multi-Project       | ❌           | ✅ Unlimited     |
| Configuration       | Hard-coded   | Externalized     |
| Module Discovery    | Manual enum  | Automatic        |
| Performance         | Baseline     | 50x faster       |
| Self-Learning       | Partial      | Full             |

---

## 🤝 Contributing

### Adding Knowledge

Use `add_to_knowledge_base` tool with high-quality sources:

```
@mendix-expert Add this knowledge:
Category: performance
Content: [your content]
Source: https://docs.mendix.com/...
```

### Improving Quality

1. Update outdated knowledge (> 2 years)
2. Add missing knowledge from official docs
3. Verify community-sourced knowledge
4. Remove duplicates and low-quality entries

---

## 📄 License

MIT

---

**Welcome to Mendix Expert MCP Server v2.0!** 🚀

For questions or support, refer to the documentation or check the logs.

Happy Mendix development! 🎊
