# Mendix Expert MCP Server - Copilot Instructions

## Project Overview

This is a **Model Context Protocol (MCP) server** that provides AI assistants with deep Mendix development knowledge. It features TF-IDF search with fuzzy matching, auto-maintenance, and project analysis capabilities.

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
    ├── WebFetcher.js           # Web documentation suggestions
    ├── config.js               # Configuration loader
    ├── logger.js               # Logging utility
    └── validator.js            # Input validation
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
- Exposes **tools** for search, analysis, knowledge management
- Exposes **resources** for stats, validation, analytics

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
