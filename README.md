<p align="center">
  <img src="https://img.shields.io/badge/version-2.1.0-blue.svg" alt="Version 2.1.0">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node >= 18">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/MCP-compatible-purple.svg" alt="MCP Compatible">
</p>

# 🧠 Mendix Expert MCP Server

> **A self-learning, high-performance MCP server providing comprehensive Mendix development knowledge and dynamic project analysis.**

The **mendix-expert** server transforms how you work with Mendix by giving AI assistants deep knowledge of the Mendix platform, SDK patterns, best practices, and the ability to analyze your actual `.mpr` project files.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Intelligent Search** | TF-IDF with Levenshtein fuzzy matching - typos like "micorflow" still find "microflow" |
| 🧠 **Self-Learning** | Automatically grows smarter as you add knowledge and track usage patterns |
| 📊 **Analytics** | 92% hit rate, 2ms response, tracks missed queries to identify knowledge gaps |
| 🔧 **Auto-Maintenance** | Scheduled validation, staleness detection, cache cleanup - runs itself |
| 📁 **Project Analysis** | Analyze any `.mpr` file - discover modules, entities, microflows dynamically |
| 🌐 **Web Suggestions** | When local knowledge misses, suggests official Mendix documentation URLs |

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

## 📚 Available Tools

| Tool | Description |
|------|-------------|
| `query_mendix_knowledge` | Search the knowledge base for any Mendix topic |
| `analyze_project` | Analyze a `.mpr` file or extracted project directory |
| `get_best_practice` | Get recommendations for specific scenarios |
| `add_to_knowledge_base` | Contribute new knowledge (auto quality scoring) |

---

## 📊 MCP Resources

Access these via the MCP resources protocol:

| Resource | What It Shows |
|----------|---------------|
| `mendix://knowledge/overview` | Knowledge base summary & file list |
| `mendix://stats` | Server statistics (uptime, cache, index size) |
| `mendix://search/config` | Current search configuration |
| `mendix://validation/report` | Knowledge validation errors/warnings |
| `mendix://analytics` | Search analytics (hit rate, top terms, gaps) |
| `mendix://staleness` | Entries older than 90 days needing updates |
| `mendix://maintenance` | Auto-maintenance schedule & status |

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

| File | Entries | Topics |
|------|---------|--------|
| `model-sdk.json` | 25 | Model manipulation, elements, properties |
| `platform-sdk.json` | 23 | Working copies, commits, branches |
| `best-practices.json` | 28 | Naming, architecture, performance |
| `troubleshooting.json` | 22 | Common errors and solutions |
| `studio-pro.json` | 20 | Studio Pro features, shortcuts |
| `advanced-patterns.json` | 18 | Complex SDK patterns |
| `performance-guide.json` | 15 | Optimization techniques |
| `security-guide.json` | 14 | Security best practices |
| `sdk-community-resources.json` | 12 | Community links, forums |

---

## 🔄 Auto-Maintenance

The server maintains itself with scheduled tasks:

| Task | Frequency | Purpose |
|------|-----------|---------|
| Validation | Every 7 days | Check knowledge quality |
| Staleness Check | Every 7 days | Find outdated entries |
| Cache Cleanup | Daily | Clear expired cache |
| Analytics Reset | Every 14 days | Archive and reset stats |

View status via `mendix://maintenance` resource.

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

### Recent Updates (v2.1.0)
- ✅ Fuzzy search with Levenshtein distance
- ✅ Analytics tracking with knowledge gap detection
- ✅ Auto-maintenance scheduler
- ✅ Web suggestions for missed queries
- ✅ Staleness detection for old entries

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
