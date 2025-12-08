# 🗺️ Mendix Expert MCP Server - Enhancement Roadmap

## Current State: Phase 1 Complete ✅

The server currently uses:
- **JSON files** for knowledge storage
- **TF-IDF** for text search with fuzzy matching
- **Auto-harvester** for keeping docs up-to-date

---

## Phase 1: Knowledge Harvester ✅ COMPLETE

**Goal:** Automatically fetch and index Mendix documentation

### Features Implemented:
- [x] `KnowledgeHarvester` class - crawls Mendix docs
- [x] `HarvestScheduler` - runs weekly auto-harvests
- [x] Release notes parser (Studio Pro 10, 11)
- [x] Reference guide parser
- [x] How-to guide parser
- [x] Priority topic harvester (page variables, Maia, themes, etc.)
- [x] `harvest` MCP tool for manual triggering
- [x] `harvest_status` MCP tool for monitoring

### Sources Indexed:
- Studio Pro Release Notes (10.x, 11.x)
- Reference Guide sections
- How-To Guides
- API Documentation
- SDK Documentation

### Priority Topics Auto-Harvested:
- Page Variables (new in 10.0+)
- Workflows 2.0
- Maia AI Assistant
- Atlas UI 3.x / Design Tokens
- Pluggable Widgets API
- Studio Pro Extensions
- Platform & Model SDK patterns

---

## Phase 2: Vector Search Upgrade 🔮 PLANNED

**Goal:** Add semantic search using embeddings and Pinecone

### Status: Ready to implement when needed
- Pinecone API key stored in `.env`
- Free tier sufficient (100K vectors)
- Architecture designed

### Planned Features:
- [ ] Pinecone integration for vector storage
- [ ] Embedding generation (OpenAI or local model)
- [ ] Hybrid search (vector + keyword)
- [ ] Semantic query understanding
- [ ] Related content suggestions

### Implementation Plan:
```javascript
// src/vector/VectorStore.js (Phase 2)
import { Pinecone } from '@pinecone-database/pinecone';

class VectorStore {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    this.index = this.pinecone.index('mendix-knowledge');
  }

  async embed(text) {
    // Use OpenAI or local embedding model
  }

  async search(query, topK = 10) {
    const embedding = await this.embed(query);
    return this.index.query({ vector: embedding, topK });
  }
}
```

### When to Upgrade:
- When knowledge base exceeds ~500 entries
- When semantic search becomes important ("how do I loop" should find "iteration")
- When you want related content suggestions

### Cost Estimate:
- **Pinecone Free Tier:** 100K vectors, 1 index = $0
- **OpenAI Embeddings:** ~$0.0001 per 1K tokens ≈ $0.10 for entire knowledge base
- **Total for single user:** Essentially free

---

## Phase 3: RAG Integration 🚀 FUTURE

**Goal:** Use retrieved knowledge to generate contextual answers

### Concept:
```
User Query → Retrieve Relevant Docs → LLM Generates Answer with Context
```

### Potential Features:
- [ ] Claude/GPT integration for answer generation
- [ ] Source citation in responses
- [ ] Conversation memory
- [ ] Code generation with context

### When to Consider:
- When you want generated answers, not just retrieved docs
- When building a user-facing product
- When accuracy and citations matter

---

## Quick Reference: Current Capabilities

| Capability | Status | Description |
|------------|--------|-------------|
| Keyword Search | ✅ | TF-IDF with stemming |
| Fuzzy Matching | ✅ | Handles typos |
| Auto-Harvest | ✅ | Weekly doc updates |
| Manual Harvest | ✅ | `@mendix-expert harvest` |
| Self-Learning | ✅ | Saves new knowledge |
| Vector Search | 🔮 | Phase 2 |
| RAG Answers | 🚀 | Phase 3 |

---

## TODO Reminders in Code

The following files contain Phase 2 TODOs:

1. `src/index.js` - Main server with Phase 2 integration points
2. `src/search/SearchEngine.js` - Hybrid search placeholder
3. `.env` - Pinecone credentials ready

Search for `PHASE_2_TODO` in the codebase to find all upgrade points.

---

## How to Trigger Phase 2

When you're ready:

```bash
# Install Pinecone SDK
npm install @pinecone-database/pinecone

# Run upgrade script (to be created)
node scripts/upgrade-to-vector.js
```

Or ask: "@mendix-expert upgrade to phase 2"

---

*Last Updated: December 7, 2025*
*By: Kai SDK*
