---
layout: default
title: Architecture
nav_order: 3
---

# Architecture

## System Overview (v3.5.1)

The Mendix Expert MCP Server is built as a modular, self-improving system with Supabase as the primary storage and Pinecone for semantic search. **As of v3.5.1, all clients (MCP and REST) participate in universal self-learning.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MCP SERVER (index.js)                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           Tool Handlers                               │  │
│  │  query_mendix_knowledge │ analyze_project │ add_to_knowledge_base    │  │
│  │  get_best_practice │ beast_mode │ harvest │ analyze_theme            │  │
│  └─────────────────────────────────┬────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┼────────────────────────────────────┐  │
│  │                    QUALITY ASSESSMENT LAYER (v3.5.1)                  │  │
│  │                                 │                                     │  │
│  │  ┌──────────────────────────────┴──────────────────────────────────┐ │  │
│  │  │  assessAnswerQuality()  │  getSelfLearningInstructions()        │ │  │
│  │  │  Shared logic for MCP + REST - consistent behavior everywhere   │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────┼────────────────────────────────────┐  │
│  │                          CORE LAYER                                   │  │
│  │                                 │                                     │  │
│  │  ┌─────────────┐  ┌─────────────┴───────────┐  ┌─────────────────┐   │  │
│  │  │ Supabase    │  │     Hybrid Search       │  │    Project      │   │  │
│  │  │ Knowledge   │  │  ┌───────┐ ┌─────────┐  │  │    Loader       │   │  │
│  │  │ Manager     │  │  │Keyword│ │ Vector  │  │  │                 │   │  │
│  │  │             │  │  │Engine │ │ Store   │  │  │ • .mpr parsing  │   │  │
│  │  │ • Load/Save │  │  │ 40%   │ │ 60%     │  │  │ • Module disc.  │   │  │
│  │  │ • Validate  │  │  └───────┘ └────┬────┘  │  │ • Entity anal.  │   │  │
│  │  └──────┬──────┘  └─────────────────┼──────┘  └─────────────────┘   │  │
│  │         │                           │                                │  │
│  │         ▼                           ▼                                │  │
│  │  ┌─────────────────┐       ┌─────────────────────┐                  │  │
│  │  │    Supabase     │       │      Pinecone       │                  │  │
│  │  │   PostgreSQL    │       │    (Cloud Vector    │                  │  │
│  │  │                 │       │     Database)       │                  │  │
│  │  │  242+ entries   │       │    253 vectors      │                  │  │
│  │  │  PRIMARY STORE  │       │    1536 dimensions  │                  │  │
│  │  └─────────────────┘       └─────────────────────┘                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         REST API LAYER                                │  │
│  │                       (rest-proxy.js)                                 │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │ POST /search    │  │ POST /learn     │  │   GET /health       │   │  │
│  │  │                 │  │   (v3.5.0)      │  │   GET /dashboard    │   │  │
│  │  │ • Hybrid search │  │ • Add knowledge │  │   POST /analyze     │   │  │
│  │  │ • Quality assess│  │ • Auto-index    │  │   POST /best-practice│  │  │
│  │  │ • beastModeNeed │  │ • To Supabase   │  │   GET /analytics    │   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RAILWAY CLOUD DEPLOYMENT                             │
│                                                                             │
│  URL: https://mendix-mcp-server-production.up.railway.app                   │
│  Auto-deploy: Push to GitHub main → Railway builds automatically            │
│  Environment: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, PINECONE_*       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Supabase Knowledge Manager (`src/core/SupabaseKnowledgeManager.js`)

**PRIMARY STORAGE** (v3.4.0+) - All knowledge lives in PostgreSQL:

| Function        | Purpose                                    |
| --------------- | ------------------------------------------ |
| `getAllKnowledge()` | Load all entries from Supabase |
| `addKnowledge()` | Add new knowledge with quality scoring |
| `searchByCategory()` | Find entries by category |
| `recordUsage()` | Track which entries are actually used |

**Database Schema:**
```sql
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  source TEXT,
  source_url TEXT,
  mendix_version TEXT,
  tags TEXT[],
  quality_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Pinecone Vector Store (`src/vector/VectorStore.js`)

**253 vectors** with OpenAI text-embedding-3-small (1536 dimensions):

| Function        | Purpose                                    |
| --------------- | ------------------------------------------ |
| `search()` | Semantic search for related concepts |
| `indexDocuments()` | Batch index all knowledge |
| `indexSingleDocument()` | Auto-index new entries (v3.4.1) |

**Auto-indexing**: When knowledge is added via `add_to_knowledge_base` or `/learn`, it's automatically indexed to Pinecone.

### 3. Quality Assessment (`assessAnswerQuality()`)

**Shared logic** (v3.5.1) used by both MCP and REST:

```javascript
function assessAnswerQuality(results, query) {
  if (!results || results.length === 0) {
    return { answerQuality: 'none', beastModeNeeded: true };
  }
  
  const topScore = results[0]?.score || 0;
  const avgScore = results.slice(0, 5).reduce(...) / 5;
  
  if (topScore < 0.1)  return { answerQuality: 'weak', beastModeNeeded: true };
  if (topScore < 0.3)  return { answerQuality: 'partial', beastModeNeeded: true };
  if (topScore > 0.6)  return { answerQuality: 'strong', beastModeNeeded: false };
  return { answerQuality: 'good', beastModeNeeded: false };
}
```

### 4. Hybrid Search (`src/vector/HybridSearch.js`)

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
            • OpenAI text-embedding-3-small
            • Semantic understanding
            • Finds related concepts
        │
        └─► Reciprocal Rank Fusion
            • Merges both result sets
            • De-duplicates
            • Returns unified scores
```
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

| Feature             | Value                                 |
| ------------------- | ------------------------------------- |
| **Embedding Model** | Azure OpenAI `text-embedding-3-small` |
| **Dimensions**      | 1536                                  |
| **Index**           | `mendix-knowledge`                    |
| **Vectors**         | ~318                                  |
| **Query Cache**     | LRU cache (500 entries)               |

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

| Operation              | Latency | Notes                   |
| ---------------------- | ------- | ----------------------- |
| Keyword search         | <10ms   | In-memory TF-IDF        |
| Vector search (cached) | <50ms   | Cache hit               |
| Vector search (miss)   | ~400ms  | Azure OpenAI + Pinecone |
| Full hybrid search     | ~450ms  | Parallel execution      |
| Re-index vectors       | ~30s    | 300+ documents          |
| Harvest all sources    | ~5min   | Rate-limited            |

---

[← Back to Home](/) | [Next: Tools Reference →](tools)
