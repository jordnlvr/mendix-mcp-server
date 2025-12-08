# Contributing to mendix-expert MCP Server

First off, thank you for considering contributing! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding Knowledge](#adding-knowledge)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

Be kind, be respectful, be helpful. We're all here to make Mendix development better.

## Getting Started

### Prerequisites

- Node.js 18+ 
- Git
- VS Code (recommended)

### Setup

```bash
# Clone the repo
git clone https://github.com/jordnlvr/mendix-mcp-server.git
cd mendix-mcp-server

# Install dependencies
npm install

# Test it works
node src/index.js
```

### Project Structure

```
mendix-mcp-server/
├── src/
│   ├── index.js              # Main MCP server entry
│   ├── core/
│   │   ├── SearchEngine.js   # TF-IDF search with fuzzy matching
│   │   ├── KnowledgeManager.js # Knowledge CRUD & validation
│   │   ├── CacheManager.js   # Response caching
│   │   ├── ProjectLoader.js  # .mpr analysis
│   │   └── QualityScorer.js  # Result ranking
│   └── utils/
│       ├── MaintenanceScheduler.js # Auto maintenance
│       ├── WebFetcher.js     # Doc suggestions
│       ├── config.js         # Configuration loader
│       ├── logger.js         # Logging
│       └── validator.js      # Input validation
├── knowledge/                # Knowledge base JSON files
├── config/
│   └── default.json          # Server configuration
└── tests/                    # Test files
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `knowledge/topic` - Knowledge base additions
- `docs/description` - Documentation updates

### Testing Changes

```bash
# Test search functionality
node -e "
const SearchEngine = require('./src/core/SearchEngine.js');
const engine = new SearchEngine();
engine.initialize('./knowledge');
console.log(engine.search('microflow'));
"

# Test validation
node -e "
const KnowledgeManager = require('./src/core/KnowledgeManager.js');
const km = new KnowledgeManager('./knowledge');
km.validateKnowledgeBase().then(r => console.log(r.summary));
"

# Full server test
node src/index.js
```

## Adding Knowledge

### Knowledge Entry Format

```json
{
  "id": "unique-kebab-case-id",
  "title": "Clear, Searchable Title",
  "category": "microflows|domain-model|sdk|deployment|...",
  "content": "Detailed explanation with examples...",
  "keywords": ["relevant", "search", "terms"],
  "source": "official|community|experience",
  "lastUpdated": "2025-12-07"
}
```

### Quality Guidelines

1. **Be specific** - Include code examples, exact steps
2. **Cite sources** - Link to official docs when possible
3. **Use keywords** - Think about what someone would search
4. **Keep current** - Update `lastUpdated` when modifying

### Adding to Existing File

1. Open the relevant `knowledge/*.json` file
2. Add your entry to the `entries` array
3. Run validation: `node -e "require('./src/core/KnowledgeManager.js').validateKnowledgeBase()"`
4. Commit with message: `knowledge: Add [topic] to [file]`

### Creating New Knowledge File

```json
{
  "name": "Topic Name",
  "description": "What this file covers",
  "version": "1.0.0",
  "entries": []
}
```

## Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** with clear commits
3. **Test locally** - ensure search still works
4. **Update CHANGELOG.md** under `[Unreleased]`
5. **Submit PR** with description of changes
6. **Wait for review** - I'll review within 48 hours

### Commit Message Format

```
type: Short description

Longer explanation if needed.

type = feat|fix|docs|knowledge|refactor|test|chore
```

Examples:
- `feat: Add support for nanoflow search`
- `knowledge: Add deployment troubleshooting entries`
- `fix: Handle empty search queries gracefully`

## Style Guide

### JavaScript

- ESM modules (`import`/`export`)
- Async/await over callbacks
- JSDoc comments for public methods
- Meaningful variable names

### JSON Knowledge Files

- 2-space indentation
- Double quotes for strings
- No trailing commas
- Alphabetize keywords arrays

---

## Questions?

Open an issue or reach out. Happy contributing! 🚀
