# AI Session Continuity Document

## For GitHub Copilot, Claude, or Any AI Assistant

**Last Updated:** December 8, 2025  
**Version:** 2.8.0  
**Owner:** Kelly Seale (kelly.seale@siemens.com)

---

## 🎯 What This Project Is

This is **@jordnlvr/mendix-mcp-server** - an enterprise-grade, self-learning AI assistant for Mendix development. It's built on the Model Context Protocol (MCP) and integrates with VS Code Copilot, Claude Desktop, Cursor, and ChatGPT.

### Core Value Proposition

- **700KB+ verified Mendix knowledge** across 20+ JSON files
- **Semantic search** via Pinecone (built-in shared index - no user setup!)
- **Multiple embedding providers** - Azure OpenAI, OpenAI, or local TF-IDF
- **Project & theme analysis** for actual .mpr files
- **Self-learning** - harvests docs, remembers solutions
- **Beast Mode** - exhaustive multi-step research on demand

---

## 📍 Where Everything Lives

### Publishing & Distribution

| Platform          | Location                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **npm**           | `@jordnlvr/mendix-mcp-server` - [npmjs.com/package/@jordnlvr/mendix-mcp-server](https://npmjs.com/package/@jordnlvr/mendix-mcp-server) |
| **GitHub**        | `jordnlvr/mendix-mcp-server` - [github.com/jordnlvr/mendix-mcp-server](https://github.com/jordnlvr/mendix-mcp-server)                  |
| **Documentation** | [jordnlvr.github.io/mendix-mcp-server](https://jordnlvr.github.io/mendix-mcp-server/)                                                  |
| **Smithery**      | [smithery.ai/server/@jordnlvr/mendix-mcp-server](https://smithery.ai/server/@jordnlvr/mendix-mcp-server)                               |

### Key Files & Folders

```
mendix-mcp-server/
├── src/
│   ├── index.js              # Main MCP server (ESM)
│   ├── rest-proxy.js         # REST API for ChatGPT
│   ├── core/
│   │   ├── SearchEngine.js   # TF-IDF + fuzzy + semantic
│   │   ├── KnowledgeManager.js
│   │   └── ...
│   ├── analyzers/
│   │   └── ThemeAnalyzer.js  # Deep SCSS/theme analysis (50KB)
│   ├── vector/
│   │   ├── VectorStore.js    # Pinecone integration
│   │   └── HybridSearch.js   # Keyword + semantic fusion
│   └── utils/
│       ├── MaintenanceScheduler.js
│       └── Analytics.js
├── knowledge/                 # JSON knowledge base (~1MB)
│   ├── theme-analysis.json   # v1.4.0 - fonts, design-properties, scaffold
│   ├── platform-sdk.json     # Verified SDK patterns
│   ├── best-practices.json
│   └── ...
├── scripts/
│   └── reindex-vectors.js    # Vector reindex utility
├── docs/                      # Jekyll site for GitHub Pages
│   ├── MENDIX-EXPERT-GUIDE.html  # PDF-ready user guide
│   └── ...
├── .github/
│   └── workflows/            # CI/CD automation
│       ├── ci.yml
│       ├── npm-publish.yml
│       ├── pages.yml
│       └── weekly-stats.yml
├── CHANGELOG.md              # Version history
├── ARCHITECTURE.md           # Full system design
└── package.json              # v2.7.3
```

---

## 👤 Owner's Preferences (Kelly Seale)

### Communication Style

- **Autonomous work preferred** - Complete tasks fully, then report
- **Research first** - Don't guess, fetch docs and verify
- **Beast Mode for complex tasks** - Thorough, iterative, use todo lists
- **Small fonts** - Prefers compact, information-dense output
- **No fluff** - Direct answers, tables over paragraphs

### Technical Preferences

- **TypeScript > JavaScript** for new projects
- **ESM modules** (`import`/`export`)
- **JSONC** for config files (comments allowed)
- **PowerShell** on Windows
- **Forward slashes** in paths even on Windows

### Workflow

1. Research → Implement → Test → Commit → Push → Publish
2. Always update CHANGELOG.md
3. Create git tags for releases (`v2.7.3`)
4. npm publish with `--access public`

---

## 🔧 How to Extend/Fix/Add

### Adding to Knowledge Base

1. Edit appropriate JSON file in `knowledge/`
2. Follow entry format:

```json
{
  "id": "UNIQUE-ID-001",
  "rule": "Clear rule or pattern",
  "severity": "critical|important|warning|info",
  "why": "Explanation of why this matters",
  "example": "Code or usage example"
}
```

3. Run `npm run reindex` to update vectors
4. Commit and push

### Adding a New Tool

1. Add tool definition in `src/index.js` under `server.setRequestHandler(ListToolsRequestSchema, ...)`
2. Add handler in `server.setRequestHandler(CallToolRequestSchema, ...)`
3. Update `openapi.json` if REST endpoint needed
4. Document in README.md and user guide

### Adding a New Analyzer

1. Create `src/analyzers/NewAnalyzer.js`
2. Export class with `analyze(path, options)` method
3. Import and wire up in `src/index.js`
4. Add corresponding knowledge in `knowledge/`

### Fixing Bugs

1. Check `ARCHITECTURE.md` for component responsibilities
2. Use logger: `logger.debug()`, `logger.info()`, `logger.error()`
3. Add test case if missing
4. Update CHANGELOG.md under `## [Unreleased]`

---

## 🚀 Release Process

### Quick Release

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Commit
git add -A
git commit -m "v2.7.x: Description"
git push origin main

# 4. Tag and push
git tag -a v2.7.x -m "v2.7.x - Release notes"
git push origin v2.7.x

# 5. Publish to npm
npm publish --access public
```

### Automated (via GitHub Actions)

- Push to `main` → CI runs tests
- Push tag `v*` → Creates GitHub Release
- Create Release → Publishes to npm (if NPM_TOKEN set)

---

## 🔬 Beast Mode Research Protocol

When asked for deep research or when information isn't in knowledge base:

### Trigger Words

`deep`, `comprehensive`, `exhaustive`, `everything about`, `complete guide`, `[BEAST MODE]`

### Research Process

1. **Search internal knowledge first** - `query_mendix_knowledge`
2. **Check official docs** - https://docs.mendix.com/
3. **Check SDK APIs**:
   - Model SDK: https://apidocs.rnd.mendix.com/modelsdk/latest/
   - Platform SDK: https://apidocs.rnd.mendix.com/platformsdk/latest/
4. **Check GitHub** - https://github.com/mendix/ (sdk-demo repo is gold!)
5. **Fetch web pages** if needed
6. **ALWAYS save findings** - Use `add_to_knowledge_base` tool
7. **Note versions** - Mendix 10 vs 11 differences matter

### After Research

- Add to appropriate knowledge JSON file
- Include `source` field with URL
- Include `lastUpdated` date
- Run `npm run reindex`

---

## 🛠️ npm Scripts Reference

```bash
npm start              # Run MCP server (stdio)
npm run rest           # Run REST API (port 5050)
npm run reindex        # Reindex vectors after knowledge updates
npm run reindex:force  # Full vector rebuild
npm run harvest        # Fetch latest Mendix docs
npm run maintenance    # Run full maintenance cycle
npm run vector-status  # Check Pinecone connection
npm test               # Run test suite
```

---

## 🔑 Environment Variables

**IMPORTANT: No environment variables are required!** The server works out of the box.

```env
# OPTIONAL: For better semantic search quality
# Choose ONE embedding provider:

# Option 1: OpenAI (most users)
OPENAI_API_KEY=sk-your-key-here

# Option 2: Azure OpenAI (enterprise/Siemens)
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# OPTIONAL: Use your own Pinecone index (advanced)
# By default, uses built-in shared knowledge base
# PINECONE_API_KEY=your_key
```

Without embedding keys, server uses local TF-IDF search (still good!).

---

## 📊 Current Status (December 2025)

### Version History (Recent)

| Version | Date  | Highlights                                                      |
| ------- | ----- | --------------------------------------------------------------- |
| 2.8.0   | Dec 8 | Built-in Pinecone, OpenAI+Azure support, ThemeAnalyzer verdicts |
| 2.7.3   | Dec 8 | Font config, design system workflow enhancements                |
| 2.7.2   | Dec 8 | Comprehensive design-properties.json documentation              |
| 2.7.1   | Dec 8 | Scaffold pattern for custom themes                              |
| 2.7.0   | Dec 8 | ThemeAnalyzer (50KB deep SCSS analysis)                         |
| 2.6.0   | Dec 8 | Usage analytics, Mendix 10/11 knowledge                         |

### What's Working Well

- ✅ npm publishing automated
- ✅ GitHub Pages documentation site
- ✅ CI/CD with 5 workflows
- ✅ Vector search with Pinecone
- ✅ Theme analysis with design-properties validation
- ✅ REST API for ChatGPT integration
- ✅ Self-maintenance scheduling

### Known Limitations

- Tests need expansion (basic coverage only)
- Some SDK patterns marked "unverified"
- Vector reindex required after knowledge updates

---

## 🆘 If You're a New AI Session

1. **Read this file first** - You now have full context
2. **Check CHANGELOG.md** - See what's changed recently
3. **Check package.json** - Current version and scripts
4. **Check knowledge/theme-analysis.json** - Latest theme best practices
5. **Use Beast Mode** - When in doubt, research thoroughly
6. **Commit often** - Kelly prefers seeing progress
7. **Update docs** - Keep CHANGELOG.md and guides current

### Quick Verification

```bash
# Check current version
node -e "console.log(require('./package.json').version)"

# Check npm version
npm view @jordnlvr/mendix-mcp-server version

# Check knowledge base loads
node -e "import('./src/core/KnowledgeManager.js').then(m => new m.default().load().then(() => console.log('OK')))"
```

---

## 📞 Contact

**Owner:** Kelly Seale  
**Email:** kelly.seale@siemens.com  
**GitHub:** jordnlvr  
**npm:** @jordnlvr

---

_This document ensures AI session continuity. Update it when major changes are made._
