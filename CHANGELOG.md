# Changelog

All notable changes to the **mendix-expert MCP Server** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **🚀 Desktop Launcher Scripts**
  - `START-SERVER.cmd` - One-click launcher (main entry point)
  - `Start-MendixServer.ps1` - PowerShell launcher with status feedback
  - `START-SERVER.vbs` - VBScript fallback for systems where .cmd opens in Notepad
  - `start-rest-server.bat` - Simple batch launcher
  - `start-ngrok-tunnel.bat` - ngrok tunnel for ChatGPT integration
  - `start-all.bat` - Combined server + ngrok launcher
  - `check-server-status.bat` - Quick health check script

### Planned

- Design Properties Gap Analysis - suggest where design properties would benefit widgets

---

## [3.2.0] - 2025-12-09

### Added

- **🧩 Studio Pro Extensions Complete Guide**
  - New knowledge file: `studio-pro-extensions-complete.json` with 56 entries
  - **COMPLETE_WORKING_EXAMPLE** - All files (csproj, cs, manifest) in one entry for first-time success
  - Quick start guide: Create a working extension in 10 minutes
  - Verified manifest format: `{ "mx_extensions": ["Name.dll"] }` - NOT schema-based
  - Extension types: MenuExtension, DockablePaneExtension, ContextMenuExtension, WebServerExtension
  - HTTP bridge pattern for MCP server integration
  - Common troubleshooting with verified solutions
  - API reference for IModel, IProject, IModule, IEntity, services

- **🔄 Embedding Provider Fallback Chain**
  - Azure OpenAI → OpenAI → Local TF-IDF automatic fallback
  - Graceful degradation when primary provider fails
  - Added OpenAI API key support as fallback

### Fixed

- **🔧 Vector Reindex Script**
  - Fixed JSON comment stripping - try direct JSON.parse before comment stripping
  - Fixed method call: `indexKnowledge` → `indexDocuments` to match VectorStore API
  - Script now parses all knowledge files correctly
  - Azure OpenAI key updated and verified working

### Changed

- **📖 README & Feature Tables**
  - Added Studio Pro Extensions to features list
  - Updated features table with new entry

---

## [3.1.1] - 2025-12-09

### Added

- **📝 Mandatory Documentation Update Rule**
  - Explicit rule in copilot-instructions.md requiring ALL docs updated on ANY change
  - Checklist: README, CHANGELOG, AI-SESSION-CONTEXT, openapi.json, docs/\*
  - Also added to AI-SESSION-CONTEXT.md for persistence

### Changed

- **🔬 Expanded Beast Mode Research Sources**
  - Community: Added Dev.to, Medium, LinkedIn to Tier 3
  - Archives: Added archive.today aliases (archive.is), Bing Cache to Tier 4
  - Clarified Reddit includes r/lowcode subreddit
- **📖 README Research Protocol Section Overhauled**
  - Now shows full 5-tier structure with detailed sources
  - Added version grading explanation (Exact/Close/Relevant/Legacy)
  - Clarified that vector embeddings ARE updated on knowledge add

### Clarified

- Auto-reindex vectors ALREADY works (verified code at lines 869-879)
- Vector embeddings update automatically when `add_to_knowledge_base` is called
- README now accurately reflects Beast Mode's full capabilities

---

## [3.1.0] - 2025-12-09

### Added

- **🌾 Automated Weekly Harvesting (GitHub Action)**

  - New `.github/workflows/weekly-harvest.yml` workflow
  - Runs every Monday at 3AM UTC via cron
  - Manual dispatch with source selection and dry-run option
  - Harvests `releaseNotes`, `studioProGuide`, `refGuide` from docs.mendix.com
  - Auto-commits knowledge updates to repository
  - Creates GitHub summary report after each run

- **🚀 Disk-Cached Embeddings**
  - EmbeddingCache now persists to `data/embedding-cache.json`
  - Server restarts 3-5x faster with warm cache
  - Graceful shutdown saves cache automatically (SIGINT/SIGTERM)
  - LRU eviction with configurable max size (default 500 entries)

### Changed

- VectorStore version bumped to 3.1.0 with disk persistence support
- REST API banner updated with v3.1.0 and new feature highlights
- Shutdown handlers now properly save embedding cache before exit

### Technical

- `EmbeddingCache` class enhanced with:
  - `loadFromDisk()` - Load cache on startup
  - `saveToDisk()` - Save cache (auto every 50 entries + on shutdown)
  - `shutdown()` - Graceful cleanup method
- `VectorStore.shutdown()` added for graceful cache persistence
- Added `fs`, `path`, `url` imports to VectorStore for disk I/O

---

## [3.0.1] - 2025-12-09

### Added

- **🌾 Auto-Learning & Harvesting Improvements**
  - `GET /harvest-status` - View harvest schedule, last run, and stats
  - `POST /harvest` - Trigger manual knowledge harvest from Mendix docs
  - `POST /knowledge-gap` - Report missing knowledge for future harvesting
  - Knowledge gaps tracked in `knowledge/knowledge-gaps.json`
- **Validator Fix** - Knowledge files with `entries`, `verified_patterns`, or `rules` now validate correctly

### Changed

- REST API now has 15 endpoints (was 12)
- Server banner updated to v3.0.1 with new endpoints listed

---

## [3.0.0] - 2025-12-09

### Added

- **📊 Analytics Dashboard** - Visual HTML dashboard at `GET /dashboard`
  - Beautiful dark theme with gradient styling
  - Live tool usage charts
  - Popular topics list
  - Knowledge base stats
  - Server health indicators

### Changed

- **Comprehensive quality improvements across all categories**
  - Updated README with accurate v3.0 feature descriptions
  - 700KB+ knowledge base (was listed as 300+)
  - All marketing numbers updated to reflect current state
  - REST API endpoints table expanded with all endpoints

### Documentation

- Updated feature list to include Theme Analyzer v2.0, Beast Mode, Analytics Dashboard
- Corrected "6-tier" to "5-tier" research protocol
- Added Zero Config as key feature (built-in Pinecone)
- REST endpoint table now includes `/dashboard` and `/beast-mode`

---

## [2.9.2] - 2025-12-09

### Added

- **Beast Mode REST Endpoint** - `GET /beast-mode` now available for ChatGPT and REST clients
  - Returns the full Beast Mode research protocol
  - Supports `format` param: `prompt` (default), `instructions`, `brief`
  - ChatGPT custom GPTs can now properly access Beast Mode
  - Updated OpenAPI spec to v2.9.2

### Fixed

- ChatGPT integration: Beast Mode was only available via MCP, now accessible via REST API

---

## [2.9.1] - 2025-12-09

### Fixed

- **ThemeAnalyzer now follows @import statements** - Resolves actual variable files
- **CSS custom properties recognized** - `--brand-primary` not just `$brand-primary`
- Supports "Company Design System" pattern (themesource modules with variables)
- SmartHub theme analysis: 93 → 96 score (all verdicts PASS)

---

## [2.9.0] - 2025-12-08

### Changed

- **ThemeAnalyzer v2.0 - Complete Rewrite** - Focused on actionable, Mendix-best-practices analysis!

  - **Removed** irrelevant checks:

    - Native theme analysis (not useful for web-focused teams)
    - Atlas_Core existence check (it's always in every project)
    - design-properties.json existence (always exists by default)

  - **Added** meaningful analysis categories:

    - **Structure Compliance**: Required files (custom-variables.scss, main.scss, exclusion-variables.scss, settings.json)
    - **Variable Usage Quality**: Hardcoded values vs SCSS tokens, brand/spacing/font variable usage
    - **Organization Assessment**: File separation, import structure, naming conventions, comments
    - **Modularity Analysis**: Theme module separation, UI resource module usage
    - **Performance Checks**: Selector complexity, nesting depth, CSS bundle size estimates
    - **Best Practices Audit**: Mendix theming standards, custom-variables usage, exclusion patterns

  - **Explicit PASS/FAIL/WARN verdicts** with actionable explanations
  - **Web-only focus** with clear disclaimer about native (skipped intentionally)
  - **Scoring** based on actual Mendix documentation standards

### Fixed

- ThemeAnalyzer no longer produces superficial "pseudo-arbitrary" verdicts
- AI agents now receive clear, actionable guidance from theme analysis

---

## [2.8.0] - 2025-12-08

### Added

- **Built-in Pinecone Connection** - Server now works out of the box with shared knowledge base!

  - No Pinecone API key required for users
  - Built-in obfuscated key connects to shared Mendix knowledge index
  - Users can still override with `PINECONE_API_KEY` for custom index

- **OpenAI + Azure OpenAI Support**:

  - Both embedding providers fully supported
  - Priority: Azure OpenAI → OpenAI → Local TF-IDF
  - `OPENAI_API_KEY` for standard OpenAI users
  - `AZURE_OPENAI_*` vars for enterprise/Siemens users
  - Graceful fallback to local TF-IDF if no API keys

- **ThemeAnalyzer Explicit Verdicts**:
  - Clear PASS/FAIL/WARN assessments for each check
  - Prevents AI misinterpretation of raw analysis data
  - 9 explicit verdict checks including:
    - Custom Theme Folder
    - Atlas_Core Location (correctly in themesource, not marketplace)
    - Theme Structure compliance
    - Scaffold Pattern (mirrors Atlas_Core)
    - design-properties.json presence
    - Web Theme quality
    - Native Theme quality
    - UI Resources Module
    - Overall Theme Health

### Changed

- **VectorStore** updated to v2.8.0 with built-in Pinecone
- **Documentation** updated throughout:
  - README.md - Zero configuration messaging
  - .env.example - Clarified all vars are optional
  - AI-SESSION-CONTEXT.md - Updated for v2.8.0

---

## [2.7.3] - 2025-12-08

### Added

- **Enhanced Font Configuration** (`theme-analysis.json` v1.4.0):

  - 4 new font rules: `FONT-006` through `FONT-009`
  - `font-display: swap` best practice
  - Weight optimization guidance (only include used weights)
  - Hardcoded URL detection warning
  - Network debugging checklist
  - 3 common font mistakes with symptoms and fixes
  - Detailed 4-step local font setup from official Mendix repo

- **Enhanced Design System Workflow** (`theme-analysis.json`):
  - Expanded to 8-step workflow (was 7)
  - New Step 3: UI Resources module ordering (critical!)
  - Detailed howTo instructions for each step
  - Building block and page template creation guides
  - 4 common design system mistakes with fixes

---

## [2.7.2] - 2025-12-08

### Added

- **Comprehensive Design Properties Documentation** (`theme-analysis.json` v1.3.0):

  - All 5 property types: Toggle, Dropdown, ColorPicker, ToggleButtonGroup, Spacing
  - 3 CRITICAL warnings: migration danger, reserved "Common" category, multiSelect issues
  - 7 IMPORTANT rules for CSS class validation, widget types, etc.
  - Real-world examples from Atlas repo (button sizes, container borders)
  - Common pitfalls section with 5 specific dangers

- **ThemeAnalyzer Enhancements** (`src/analyzers/ThemeAnalyzer.js`):
  - `analyzeDesignProperties()` method for deep validation
  - Property type validation against 5 valid types
  - Reserved "Common" category detection
  - CSS class existence validation (checks SCSS files)
  - Widget type validation
  - Duplicate class detection across properties
  - Automatic migration warning injection

---

## [2.7.1] - 2025-12-08

### Added

- **Scaffold Pattern Documentation** (`theme-analysis.json`):
  - Complete scaffold pattern with 5 rules (SCAFFOLD-001 through SCAFFOLD-005)
  - Real-world examples showing good vs bad approaches
  - Atlas_Core folder structure reference
  - Stubbed file templates with comment headers
  - Import order best practices

---

## [2.7.0] - 2025-12-08

### Added

- **ThemeAnalyzer** (`src/analyzers/ThemeAnalyzer.js`):

  - Complete analyzer framework for Mendix themes (50KB)
  - Deep structure analysis with nested file extraction
  - Custom variable detection (colors, fonts, spacing, etc.)
  - Design properties validation
  - Atlas compliance scoring
  - Scaffold pattern validation
  - Best practice recommendations
  - Integration with MCP tools

- **Theme Analysis Knowledge Base** (`knowledge/theme-analysis.json`):
  - Comprehensive SCSS best practices
  - Variable naming conventions
  - Import order rules
  - Design properties structure

---

## [2.6.0] - 2025-12-08

### Added

- **Usage Analytics** (`src/utils/Analytics.js`): Local telemetry tracking

  - Tool usage counts and patterns
  - Popular topics and query analysis
  - Daily/hourly usage trends
  - New `get_usage_analytics` MCP tool for insights
  - Data stored locally in `data/analytics.json`

- **Deep Mendix 10/11 Knowledge** (~140KB new content):

  - `harvested-mendix-10-11.json`: Comprehensive Mendix 10/11 features
  - `workflows-complete.json`: Complete workflow documentation
  - `mobile-complete.json`: Native mobile development patterns

- **Test Suite** (4 test files):

  - `tests/analytics.test.js`: Analytics tracking tests
  - `tests/knowledge-manager.test.js`: Knowledge base tests
  - `tests/search-engine.test.js`: Search functionality tests
  - `tests/quality-scorer.test.js`: Quality scoring tests

- **Harvest Scripts** (`scripts/harvest-mendix-docs.js`):
  - Automated Mendix documentation fetching
  - Extracts structured content from docs.mendix.com

### Changed

- Total knowledge base now **~700KB** across 20 JSON files
- Analytics integrated into all major tools (query, search, best-practice, analyze)

---

## [2.5.3] - 2025-12-08

### Added

- **ChatGPT Setup Guide** (`docs/CHATGPT-SETUP.md`): Complete guide for creating a Custom GPT
  - Recommended GPT name, description, and profile image
  - Full system prompt with tool usage instructions
  - Conversation starters
  - Step-by-step Actions import instructions
  - Troubleshooting guide
- **Health Check Script** (`check-api-status.ps1`): Diagnose REST server and ngrok tunnel
  - Checks local server status
  - Verifies ngrok tunnel
  - Tests public URL accessibility
  - Provides colored output and fix recommendations
- Updated `start-chatgpt-api.ps1` with improved UX

### Fixed

- REST proxy now loads environment variables correctly (dotenv fix)
- OpenAPI endpoint dynamically uses https:// for ngrok URLs

---

## [2.5.2] - 2025-01-07

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
