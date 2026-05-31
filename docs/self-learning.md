---
layout: default
title: Self-Learning
nav_order: 6
---

# Self-Learning

The Mendix Expert server is designed to grow smarter with every interaction. **As of v3.5.1, ALL clients (GitHub Copilot, Claude, ChatGPT, n8n, etc.) participate in the learning loop automatically.**

## Universal Self-Learning Architecture (v3.5.1)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL SELF-LEARNING ARCHITECTURE                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │  GitHub Copilot │    │  Claude Desktop │    │     Cursor      │           │
│  │  (VS Code)      │    │  (macOS/Win)    │    │    (Editor)     │           │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘           │
│           │                      │                      │                     │
│           └──────────────────────┼──────────────────────┘                     │
│                                  │                                            │
│                         ┌────────▼────────┐                                   │
│                         │   MCP Protocol  │                                   │
│                         │   (stdio/JSONRPC)│                                  │
│                         │                  │                                  │
│                         │  Tools:          │                                  │
│                         │  • query_mendix_knowledge                           │
│                         │  • add_to_knowledge_base                            │
│                         │  • get_best_practice                                │
│                         └────────┬────────┘                                   │
│                                  │                                            │
│  ┌───────────────────────────────┼───────────────────────────────┐           │
│  │                               │                               │           │
│  │        ┌──────────────────────▼──────────────────────┐       │           │
│  │        │          MENDIX-EXPERT MCP SERVER           │       │           │
│  │        │                  v3.5.1                     │       │           │
│  │        ├─────────────────────────────────────────────┤       │           │
│  │        │  assessAnswerQuality() ◀── SHARED LOGIC     │       │           │
│  │        │  getSelfLearningInstructions() ◀── SHARED   │       │           │
│  │        └──────────────────────┬──────────────────────┘       │           │
│  │                               │                               │           │
│  │           ┌───────────────────┴───────────────────┐          │           │
│  │           │                                       │          │           │
│  │   ┌───────▼───────┐                     ┌─────────▼────────┐ │           │
│  │   │   Supabase    │                     │    Pinecone      │ │           │
│  │   │  PostgreSQL   │                     │   Vector DB      │ │           │
│  │   │  242+ entries │                     │  253 vectors     │ │           │
│  │   │  (primary)    │                     │  1536 dims       │ │           │
│  │   └───────────────┘                     └──────────────────┘ │           │
│  │                                                               │           │
│  └───────────────────────────────┼───────────────────────────────┘           │
│                                  │                                            │
│                         ┌────────▼────────┐                                   │
│                         │   REST API      │                                   │
│                         │   (HTTP/JSON)   │                                   │
│                         │                  │                                  │
│                         │  Endpoints:      │                                  │
│                         │  • POST /search  │                                  │
│                         │  • POST /learn   │                                  │
│                         └────────┬────────┘                                   │
│                                  │                                            │
│           ┌──────────────────────┼──────────────────────┐                     │
│           │                      │                      │                     │
│  ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐           │
│  │    ChatGPT      │    │      n8n        │    │  Make/Zapier/   │           │
│  │  (Custom GPT)   │    │  (Automation)   │    │  Custom Apps    │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## How Self-Learning Works

### 1. Quality Assessment

Every search (MCP or REST) now returns quality signals:

```json
{
  "query": "quantum computing integration",
  "resultCount": 5,
  "answerQuality": "partial",     // none | weak | partial | good | strong
  "beastModeNeeded": true,        // Should AI do web research?
  "beastModeInstructions": "...", // What to do next
  "results": [...]
}
```

### 2. The Learning Loop

```
User asks question
       ↓
AI calls search (MCP tool or REST /search)
       ↓
Response includes:
  • results (knowledge found)
  • answerQuality (how good?)
  • beastModeNeeded (should research more?)
       ↓
IF beastModeNeeded: true
  → AI does web research (docs, GitHub, forums)
  → AI calls add tool:
      - MCP: add_to_knowledge_base
      - REST: POST /learn
  → Knowledge stored in Supabase
  → Auto-indexed in Pinecone
       ↓
Future queries find it automatically! 🧠
```

### 3. Two Ways to Add Knowledge

**MCP Tool (for Copilot, Claude, Cursor):**

```javascript
add_to_knowledge_base({
  knowledge_file: 'best-practices',
  content: '{"practice": "...", "description": "..."}',
  source: 'docs.mendix.com',
  verified: true,
});
```

**REST API (for ChatGPT, n8n, automation):**

```bash
POST /learn
{
  "title": "AggregateListAction Pattern",
  "content": "Use AggregateListAction for counting...",
  "category": "sdk-patterns",
  "source": "docs.mendix.com"
}
```

## Storage Architecture (v3.4.0+)

```
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SUPABASE (PostgreSQL)                  │   │
│  │                   PRIMARY STORAGE                   │   │
│  │                                                     │   │
│  │  • 242+ knowledge entries                          │   │
│  │  • Full-text search indexes                        │   │
│  │  • Metadata (source, version, quality score)       │   │
│  │  • Survives Railway container restarts!            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼ (auto-sync)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                PINECONE (Vector DB)                 │   │
│  │                 SEMANTIC SEARCH                     │   │
│  │                                                     │   │
│  │  • 253 vectors indexed                             │   │
│  │  • OpenAI text-embedding-3-small (1536 dims)       │   │
│  │  • Auto-indexed when knowledge added               │   │
│  │  • Finds related concepts, not just keywords       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Client-Specific Behavior

| Client             | Interface | Search Tool              | Add Tool                | Quality Signals |
| ------------------ | --------- | ------------------------ | ----------------------- | --------------- |
| **GitHub Copilot** | MCP       | `query_mendix_knowledge` | `add_to_knowledge_base` | ✅ v3.5.1       |
| **Claude Desktop** | MCP       | `query_mendix_knowledge` | `add_to_knowledge_base` | ✅ v3.5.1       |
| **Cursor**         | MCP       | `query_mendix_knowledge` | `add_to_knowledge_base` | ✅ v3.5.1       |
| **ChatGPT**        | REST      | `POST /search`           | `POST /learn`           | ✅ v3.5.0       |
| **n8n**            | REST      | `POST /search`           | `POST /learn`           | ✅ v3.5.0       |
| **Make/Zapier**    | REST      | `POST /search`           | `POST /learn`           | ✅ v3.5.0       |

## Knowledge Quality Maintenance

### Automatic Validation

The system runs daily validation checking for:

- Stale entries (>6 months old)
- Missing required fields
- Invalid JSON
- Duplicate content

### Usage Tracking

Every search hit is recorded:

```javascript
// In KnowledgeManager
recordUsage(file, entryId) {
  // Tracks which entries are actually helpful
  // Low-usage entries may be candidates for removal
}
```

### Staleness Detection

Entries are flagged as stale based on:

1. `last_updated` > 6 months ago
2. `mendix_version` is outdated (e.g., "9.x" when 11.x is current)
3. Referenced URLs return 404

## Best Practices for Self-Learning

### DO:

✅ Save discoveries with detailed context
✅ Include code examples when possible
✅ Specify Mendix version compatibility
✅ Note the source (URL, repo, etc.)
✅ Let Beast Mode auto-save after research

### DON'T:

❌ Save unverified or speculative information
❌ Save personal project-specific details
❌ Duplicate existing entries
❌ Save without source attribution

## Monitoring Learning

```
@mendix-expert hello
```

Shows:

- Total knowledge entries
- Recent additions
- Hit rate (how often queries find results)
- Knowledge gaps (missed queries)

---

[← Back to Knowledge Base](knowledge-base) | [Next: Beast Mode →](beast-mode)
