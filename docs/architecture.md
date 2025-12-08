---
layout: default
title: Architecture
---

# 🏗️ Architecture

## System Overview

The Mendix Expert MCP Server is built as a modular, self-improving system with several interconnected components.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MCP SERVER (index.js)                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           Tool Handlers                               │  │
│  │  query_mendix_knowledge │ analyze_project │ add_to_knowledge_base    │  │
│  │  hybrid_search │ vector_search │ harvest │ beast_mode │ etc.         │  │
│  └─────────────────────────────────┬────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┼────────────────────────────────────┐  │
│  │                          CORE LAYER                                   │  │
│  │                                 │                                     │  │
│  │  ┌─────────────┐  ┌─────────────┴───────────┐  ┌─────────────────┐   │  │
│  │  │ Knowledge   │  │     Hybrid Search       │  │    Project      │   │  │
│  │  │ Manager     │  │  ┌───────┐ ┌─────────┐  │  │    Loader       │   │  │
│  │  │             │  │  │Keyword│ │ Vector  │  │  │                 │   │  │
│  │  │ • Load/Save │  │  │Engine │ │ Store   │  │  │ • .mpr parsing  │   │  │
│  │  │ • Validate  │  │  │ 40%   │ │ 60%     │  │  │ • Module disc.  │   │  │
│  │  │ • Record    │  │  └───────┘ └────┬────┘  │  │ • Entity anal.  │   │  │
│  │  └──────┬──────┘  └─────────────────┼──────┘  └─────────────────┘   │  │
│  │         │                           │                                │  │
│  │         ▼                           ▼                                │  │
│  │  ┌─────────────┐           ┌─────────────────┐                      │  │
│  │  │ knowledge/  │           │    Pinecone     │                      │  │
│  │  │ *.json      │           │  (Cloud Vector  │                      │  │
│  │  │             │           │   Database)     │                      │  │
│  │  │ 300+ entries│           │  318 vectors    │                      │  │
│  │  └─────────────┘           └─────────────────┘                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        AUTOMATION LAYER                               │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │ Knowledge       │  │  Maintenance    │  │    Web Fetcher      │   │  │
│  │  │ Harvester       │  │  Scheduler      │  │                     │   │  │
│  │  │                 │  │                 │  │  • docs.mendix.com  │   │  │
│  │  │ • Weekly crawls │  │ • Validation    │  │  • GitHub repos     │   │  │
│  │  │ • Priority      │  │ • Staleness     │  │  • Community forums │   │  │
│  │  │   topics        │  │ • Cache cleanup │  │  • npm packages     │   │  │
│  │  └────────┬────────┘  └─────────────────┘  └─────────────────────┘   │  │
│  │           │                                                           │  │
│  │           └──────► Auto re-indexes vectors after harvest             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Knowledge Manager (`src/core/KnowledgeManager.js`)

Manages the JSON knowledge base files:

| Function | Purpose |
|----------|---------|
| `load()` | Load all knowledge files from `/knowledge` |
| `add()` | Add new knowledge with quality scoring |
| `validate()` | Check for errors, staleness, duplicates |
| `recordUsage()` | Track which entries are actually used |

**Knowledge Files:**
- `best-practices.json` - Coding patterns and guidelines
- `studio-pro.json` - Studio Pro features and usage
- `model-sdk.json` - SDK programming patterns
- `platform-sdk.json` - Platform SDK operations
- `troubleshooting.json` - Common issues and fixes
- `harvested-*.json` - Auto-crawled content

### 2. Hybrid Search (`src/vector/HybridSearch.js`)

Combines two search strategies:

```
Query: "how to loop through entities"
        │
        ├─► Keyword Search (40% weight)
        │   • TF-IDF with stemming
        │   • Fuzzy matching (typos OK)
        │   • Mendix term expansion
        │   
        └─► Vector Search (60% weight)
            • Azure OpenAI embeddings
            • Semantic understanding
            • Finds related concepts
        │
        └─► Reciprocal Rank Fusion
            • Merges both result sets
            • Deduplicates near-matches
            • Returns best combined results
```

**Query Expansion:**
The system automatically expands Mendix acronyms:
- `SDK` → `software development kit, platform sdk, model sdk`
- `MF` → `microflow, microflows`
- `NP` → `non-persistent, transient`
- 25+ Mendix-specific mappings

### 3. Vector Store (`src/vector/VectorStore.js`)

Semantic search using Pinecone:

| Feature | Value |
|---------|-------|
| **Embedding Model** | Azure OpenAI `text-embedding-3-small` |
| **Dimensions** | 1536 |
| **Index** | `mendix-knowledge` |
| **Vectors** | ~318 |
| **Query Cache** | LRU cache (500 entries) |

**Embedding Priority:**
1. Azure OpenAI (355ms, recommended)
2. Standard OpenAI (971ms, fallback)
3. Local TF-IDF (instant, no API needed)

### 4. Knowledge Harvester (`src/harvester/KnowledgeHarvester.js`)

Automated documentation crawler:

**Sources Crawled:**
- Studio Pro Release Notes (10.x, 11.x)
- Reference Guide (pages, domain model, microflows)
- How-To Guides
- SDK Documentation
- API Documentation

**Priority Topics:**
- Maia AI Assistant
- Page Variables (10.0+)
- Workflows 2.0
- Design Tokens / Atlas UI 3
- Pluggable Widgets API
- Platform & Model SDK

**Schedule:** Every 7 days (configurable)

### 5. Project Loader (`src/core/ProjectLoader.js`)

Analyzes Mendix `.mpr` files:

```javascript
// Usage
await projectLoader.loadProject("D:/MyApp/MyApp.mpr");

// Returns
{
  name: "MyApp",
  modules: [
    {
      name: "MainModule",
      entities: [...],
      microflows: [...],
      pages: [...]
    }
  ]
}
```

## Data Flow

### Query Flow

```
1. User Query
   │
2. Tool Handler (index.js)
   │
3. Hybrid Search
   ├── Keyword Search (synchronous)
   └── Vector Search (async, cached)
   │
4. Result Fusion + Deduplication
   │
5. Response with sources
```

### Self-Learning Flow

```
1. AI discovers new information
   │
2. add_to_knowledge_base tool
   │
3. Quality scoring (0-100%)
   │
4. Duplicate detection
   │
5. Save to knowledge/*.json
   │
6. Re-index keyword search
   │
7. Re-index vector search ← NEW in v2.4.1
   │
8. Available immediately
```

### Harvest Flow

```
1. HarvestScheduler triggers (weekly)
   │
2. KnowledgeHarvester crawls sources
   │
3. Parse HTML → Extract content
   │
4. Save to harvested-*.json
   │
5. Re-index vectors ← NEW in v2.4.1
   │
6. Update harvest state
```

## File Structure

```
mendix-mcp-server/
├── src/
│   ├── index.js              # Main MCP server, tool definitions
│   ├── core/
│   │   ├── KnowledgeManager.js
│   │   ├── SearchEngine.js   # TF-IDF keyword search
│   │   ├── ProjectLoader.js
│   │   ├── CacheManager.js
│   │   └── QualityScorer.js
│   ├── vector/
│   │   ├── VectorStore.js    # Pinecone + embeddings
│   │   └── HybridSearch.js   # Fusion algorithm
│   ├── harvester/
│   │   ├── KnowledgeHarvester.js
│   │   ├── HarvestScheduler.js
│   │   └── index.js
│   └── utils/
│       ├── Logger.js
│       ├── WebFetcher.js
│       └── MaintenanceScheduler.js
├── knowledge/                 # JSON knowledge base
│   ├── best-practices.json
│   ├── studio-pro.json
│   ├── model-sdk.json
│   ├── platform-sdk.json
│   ├── troubleshooting.json
│   └── harvested-*.json
├── config/
│   └── default.json          # Server configuration
└── docs/                     # This documentation
```

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Keyword search | <10ms | In-memory TF-IDF |
| Vector search (cached) | <50ms | Cache hit |
| Vector search (miss) | ~400ms | Azure OpenAI + Pinecone |
| Full hybrid search | ~450ms | Parallel execution |
| Re-index vectors | ~30s | 300+ documents |
| Harvest all sources | ~5min | Rate-limited |

---

[← Back to Home](/) | [Next: Tools Reference →](tools)
