# Mendix Expert MCP Server - Copilot Instructions

## Project Overview

This is a **Model Context Protocol (MCP) server** that provides AI assistants with deep Mendix development knowledge. It features TF-IDF search with fuzzy matching, auto-maintenance, project analysis, and **a built-in research protocol that teaches AI to find and learn new information**.

## 🔬 CRITICAL: Research Protocol

**When you don't have an answer, you MUST research it!**

### Research Sources (in priority order):

1. **Official Docs**: https://docs.mendix.com/
2. **Model SDK API**: https://apidocs.rnd.mendix.com/modelsdk/latest/
3. **Platform SDK API**: https://apidocs.rnd.mendix.com/platformsdk/latest/
4. **SDK Demo Repo**: https://github.com/mendix/sdk-demo (GOLD MINE for patterns!)
5. **GitHub Code Search**: `mendixmodelsdk language:typescript`
6. **npm packages**: Search for packages depending on mendixmodelsdk
7. **Community Forum**: https://community.mendix.com/
8. **Archives**: Wayback Machine, archive.ph for old content

### After Research:
- **ALWAYS add findings to knowledge base** using `add_to_knowledge_base` tool
- Note the Mendix version the info applies to
- Cite your sources

See [docs/RESEARCH-PROTOCOL.md](docs/RESEARCH-PROTOCOL.md) for the full protocol.

## Architecture

```
src/
├── index.js                 # Main MCP server entry point (ESM)
├── core/
│   ├── SearchEngine.js      # TF-IDF search with Levenshtein fuzzy matching
│   ├── KnowledgeManager.js  # Knowledge CRUD, validation, staleness detection
│   ├── CacheManager.js      # LRU/LFU caching with TTL
│   ├── ProjectLoader.js     # .mpr file analysis
│   └── QualityScorer.js     # Result quality ranking
└── utils/
    ├── MaintenanceScheduler.js  # Automated periodic maintenance
    ├── SyncReminder.js          # GitHub sync tracking and reminders
    ├── WebFetcher.js            # Web documentation suggestions
    ├── config.js                # Configuration loader
    ├── logger.js                # Logging utility
    └── validator.js             # Input validation
```

## Key Patterns

### Search Engine

- Uses **inverted index** for O(1) term lookups
- **TF-IDF scoring** for relevance ranking
- **Levenshtein distance** for fuzzy matching (edit distance 1-2)
- **Synonym expansion** (26 Mendix-specific mappings)
- **Stemming** (7 suffix rules)

### Knowledge Base

- JSON files in `knowledge/` directory
- Each entry has: id, title, category, content, keywords, source, lastUpdated
- Validation checks for required fields, duplicates, quality issues
- Staleness detection for entries older than 90 days

### MCP Protocol

- Uses `@modelcontextprotocol/sdk` for server implementation
- Exposes **tools** for search, analysis, knowledge management, sync
- Exposes **resources** for stats, validation, analytics, sync status

## Coding Standards

1. **ESM modules** - Use `import`/`export`, not `require`
2. **Async/await** - Prefer over callbacks
3. **JSDoc comments** - Document all public methods
4. **Error handling** - Always wrap async operations in try/catch
5. **Logging** - Use the logger utility, not console.log in production

## When Modifying Search

- Test with typos: "micorflow" should find "microflow"
- Test synonyms: "MF" should expand to "microflow"
- Run validation after changes: `node -e "require('./src/core/KnowledgeManager.js').validateKnowledgeBase()"`

## When Adding Knowledge

```json
{
  "id": "kebab-case-unique-id",
  "title": "Clear Searchable Title",
  "category": "microflows|domain-model|sdk|deployment|etc",
  "content": "Detailed content with examples...",
  "keywords": ["relevant", "search", "terms"],
  "source": "official|community|experience",
  "lastUpdated": "YYYY-MM-DD"
}
```

## Syncing with GitHub

```powershell
.\sync.ps1 status   # Check sync status
.\sync.ps1 pull     # Get updates
.\sync.ps1 push     # Backup changes
.\sync.ps1 both     # Full sync
```

## Testing Commands

```bash
# Validate knowledge
node -e "const KM = require('./src/core/KnowledgeManager.js'); new KM('./knowledge').validateKnowledgeBase().then(r => console.log(r.summary));"

# Test search
node -e "const SE = require('./src/core/SearchEngine.js'); const e = new SE(); e.initialize('./knowledge'); console.log(e.search('microflow'));"

# Check analytics
node -e "const SE = require('./src/core/SearchEngine.js'); const e = new SE(); e.initialize('./knowledge'); console.log(e.getAnalytics());"
```

## Never Do

- Don't modify `node_modules/`
- Don't commit test files (`test-*.js`)
- Don't hardcode file paths - use config
- Don't skip validation before commits
- Don't give up when knowledge base doesn't have an answer - **RESEARCH IT!**
