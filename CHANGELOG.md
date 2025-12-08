# Changelog

All notable changes to the **mendix-expert MCP Server** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Web documentation auto-fetching
- Knowledge base expansion
- Additional Mendix SDK patterns

---

## [2.5.2] - 2025-12-08

### Added

- **REST API Proxy** (`src/rest-proxy.js`): Expose all MCP tools over HTTP for ChatGPT and web integration
  - `GET /health` - Health check with status
  - `GET /status` - Server info with example queries
  - `GET /tools` - List available endpoints
  - `POST /query` - Query knowledge base
  - `POST /search` - Hybrid search (keyword + semantic)
  - `POST /best-practice` - Get recommendations
  - `POST /analyze` - Analyze Mendix projects
- **OpenAPI Specification** (`openapi.json`): Import into ChatGPT Actions for Custom GPT integration
- **npm script**: `npm run rest` to start REST server on port 5050
- REST API documentation in README

### Changed

- REST server gracefully handles missing vector store (keyword-only fallback)
- Added process-level error handlers to prevent crashes

---

## [2.5.0] - 2025-12-08

### Added

- **Pluggable Widgets Knowledge** (`pluggable-widgets.json`): Complete verified patterns for widget development
  - 9 core widget types (EditableValue, DynamicValue, ActionValue, ListValue, etc.)
  - 8 React hooks (useConst, useSetup, useDebounce, useLazyListValue, etc.)
  - Filter builders API documentation
  - Widget XML configuration patterns
  - Project structure and build commands

### Fixed

- **CRITICAL**: Fixed `model.allEntities()` documentation - this API does NOT exist
  - Must use `domainModel.load().entities` instead
  - Added warning note in `model-sdk.json`
- **CRITICAL**: Fixed `LogMessageAction` pattern in `platform-sdk.json`
  - Correct API: `StringTemplate.createInLogMessageActionUnderMessageTemplate(logAction)`
  - Previous pattern `StringTemplate.createIn()` does not exist
- **CRITICAL**: Fixed `StartEvent.createIn()` pattern
  - Correct: `StartEvent.createIn(mf.objectCollection)` NOT `createIn(mf)`

### Changed

- Added `verified_patterns_december_2025` section to `platform-sdk.json` with live-tested code
- Updated knowledge README with verification testing details

### Verified

All SDK patterns **live-tested** against CompanionTestApp3 (mendixplatformsdk + mendixmodelsdk):

- Entity creation with all attribute types ✅
- Association creation (Reference type) ✅
- Microflow creation (Start → LogMessage → End) ✅

All widget patterns **compile-tested** with mendix@11.5.0:

- 9 widget types ✅
- 8 React hooks ✅
- Filter builder types ✅

---

## [2.1.0] - 2025-12-07

### Added

- **Fuzzy Search**: Levenshtein distance matching for typo tolerance (e.g., "micorflow" → "microflow")
- **Analytics Tracking**: Hit rate, response times, top search terms, missed queries
- **Auto-Maintenance Scheduler**: Periodic validation, staleness checks, cache cleanup
- **Web Suggestions**: Suggests Mendix docs URLs when queries miss
- **Staleness Detection**: Identifies knowledge entries older than 90 days
- **Knowledge Validation**: Comprehensive validation with errors, warnings, suggestions
- **8 MCP Resources**: knowledge, stats, search, projects, validation, analytics, staleness, maintenance

### Changed

- Increased fuzzy match distance to 2 for words 6+ characters
- Improved synonym mappings (26 total Mendix-specific)
- Enhanced stemming rules (7 suffix patterns)

### Performance

- 92% hit rate
- 2ms average response time
- 177 knowledge entries indexed
- 3,157 unique terms in search index

---

## [2.0.0] - 2025-11-15

### Added

- TF-IDF search engine with inverted index
- Stemming support for better recall
- Synonym expansion (MF→microflow, DM→domain model, etc.)
- Phrase boost (+20% for exact matches)
- Field boost (+15% for title/category matches)
- Source weighting (official docs prioritized)
- Cache manager with TTL support
- Quality scoring for search results

### Changed

- Complete rewrite from v1.x architecture
- Migrated to ESM modules
- New knowledge base JSON format

---

## [1.0.0] - 2025-10-01

### Added

- Initial MCP server implementation
- Basic keyword search
- Knowledge base structure
- Project analysis tools

---

[Unreleased]: https://github.com/jordnlvr/mendix-mcp-server/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/jordnlvr/mendix-mcp-server/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/jordnlvr/mendix-mcp-server/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/jordnlvr/mendix-mcp-server/releases/tag/v1.0.0
