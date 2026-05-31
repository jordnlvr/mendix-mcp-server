---
layout: default
title: Maintenance
nav_order: 8
---

# Maintenance

How to keep the Mendix Expert server running optimally.

## Quick Reference: npm Scripts

```bash
# Start the MCP server
npm start

# Start REST API for ChatGPT
npm run rest

# Run automated maintenance
npm run maintenance

# Reindex vectors (after knowledge updates)
npm run reindex
npm run reindex:force    # Clear and rebuild all vectors

# Check vector store status
npm run vector-status

# Harvest new knowledge from Mendix docs
npm run harvest

# Run tests
npm test
```

## Automatic Maintenance

The server handles most maintenance automatically:

| Task                  | Frequency     | What Happens                              |
| --------------------- | ------------- | ----------------------------------------- |
| **Knowledge Harvest** | Weekly        | Crawls docs.mendix.com for new content    |
| **Vector Re-index**   | After changes | Updates embeddings when knowledge changes |
| **Validation**        | Daily         | Checks for errors, staleness              |
| **Cache Cleanup**     | On restart    | Clears stale caches                       |
| **Usage Tracking**    | Continuous    | Records which entries are used            |

## Manual Maintenance Tasks

### 1. Trigger Manual Harvest

When you want fresh content immediately:

```
@mendix-expert harvest
```

Or via npm:

```bash
npm run harvest
```

For specific sources only:

```
@mendix-expert harvest sources=["releaseNotes", "mxsdk"]
```

### 2. Re-index Vectors

If search results seem off, use the reindex script:

```bash
# Standard reindex (upserts changes)
npm run reindex

# Force full reindex (clears and rebuilds)
npm run reindex:force

# Reindex specific file only
node scripts/reindex-vectors.js --file=theme-analysis.json

# Preview what would be indexed
node scripts/reindex-vectors.js --dry-run
```

This:

- Clears all existing vectors (with --force)
- Re-generates embeddings for all knowledge
- Takes ~30 seconds for 300+ entries

### 3. Check System Status

```
@mendix-expert hello
```

Shows:

- Knowledge base size
- Vector index status
- Cache hit rate
- Recent activity

### 4. View Harvest Status

```
@mendix-expert harvest_status
```

Shows:

- Last harvest date
- Next scheduled harvest
- Total harvests run
- Available sources

### 5. Sync with GitHub

If running on multiple machines:

```
# Pull latest knowledge
@mendix-expert sync_mcp_server action="pull"

# Push your changes
@mendix-expert sync_mcp_server action="push"

# Check sync status
@mendix-expert sync_mcp_server action="status"
```

## Monitoring Health

### Key Metrics to Watch

| Metric             | Healthy | Warning  | Action                 |
| ------------------ | ------- | -------- | ---------------------- |
| **Hit Rate**       | >90%    | <80%     | Check knowledge gaps   |
| **Vector Count**   | ~300+   | <200     | Run reindex_vectors    |
| **Cache Hit Rate** | >30%    | <10%     | Normal for new queries |
| **Last Harvest**   | <7 days | >14 days | Run harvest            |

### Check via API

```
@mendix-expert vector_status
```

Returns:

```json
{
  "status": "ready",
  "vectors": 318,
  "dimension": 1536,
  "embeddingMode": "azure-openai",
  "queryCache": {
    "size": 45,
    "maxSize": 500,
    "hits": 120,
    "misses": 80,
    "hitRate": "60.0%"
  }
}
```

## Troubleshooting

### Vector Search Not Working

**Symptoms:**

- `vector_status` shows "not_initialized"
- Hybrid search returns only keyword results

**Solutions:**

1. Check Pinecone API key:

   ```
   # In .env file
   PINECONE_API_KEY=your_key_here
   ```

2. Verify index exists:

   - Log into Pinecone console
   - Check for `mendix-knowledge` index
   - Ensure 1536 dimensions

3. Re-initialize:
   ```
   @mendix-expert reindex_vectors
   ```

### Embeddings Slow

**Symptoms:**

- Searches take >1 second
- `embeddingMode` shows "openai" not "azure-openai"

**Solutions:**

1. Configure Azure OpenAI (3x faster):

   ```
   AZURE_OPENAI_API_KEY=your_key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT=embed3s
   ```

2. Check cache hit rate - repeated queries should be instant

### Harvest Failing

**Symptoms:**

- `harvest_status` shows errors
- New content not appearing

**Solutions:**

1. Check network connectivity to docs.mendix.com

2. Run with verbose output:

   ```
   @mendix-expert harvest verbose=true
   ```

3. Try individual sources:
   ```
   @mendix-expert harvest sources=["mxsdk"] dryRun=true
   ```

### Knowledge Not Found

**Symptoms:**

- Queries return no results
- Known topics not matching

**Solutions:**

1. Check if indexed:

   ```
   @mendix-expert query_mendix_knowledge topic="[exact term]"
   ```

2. Try hybrid search (includes semantic):

   ```
   @mendix-expert hybrid_search query="[your query]"
   ```

3. Check for typos in query

4. Re-index if recently added:
   ```
   @mendix-expert reindex_vectors
   ```

## Backup & Recovery

### Backup Knowledge Base

The knowledge base is in `knowledge/*.json`:

```bash
# Simple backup
cp -r knowledge/ knowledge-backup-$(date +%Y%m%d)/

# Or commit to Git
git add knowledge/
git commit -m "Knowledge backup $(date)"
git push
```

### Restore from Backup

```bash
# From local backup
cp -r knowledge-backup-20240115/* knowledge/

# From Git
git checkout HEAD~1 -- knowledge/

# Then re-index
@mendix-expert reindex_vectors
```

### Sync Across Machines

```bash
# Machine A: Push changes
git add knowledge/
git commit -m "Knowledge updates"
git push

# Machine B: Pull changes
git pull
# Server auto-reloads on restart
```

## Performance Tuning

### Query Cache Size

Default: 500 queries

To adjust (in `VectorStore.js`):

```javascript
this.queryCache = new EmbeddingCache(500); // Increase for heavy usage
```

### Harvest Interval

Default: 7 days

To adjust (in `HarvestScheduler.js`):

```javascript
this.harvestIntervalDays = 7; // Decrease for more frequent updates
```

### Search Weights

Default: 40% keyword, 60% vector

To adjust (in `HybridSearch.js`):

```javascript
this.keywordWeight = 0.4;
this.vectorWeight = 0.6;
```

## Logs

Server logs go to stdout. Key log messages:

```
[INFO] [VectorStore] Using Azure OpenAI embeddings
[INFO] [HybridSearch] HybridSearch created {keywordWeight: 0.4, vectorWeight: 0.6}
[INFO] [HarvestScheduler] Next harvest: 2024-01-22
[WARN] [VectorStore] Cloud query embedding failed, using local
[ERROR] [KnowledgeManager] Failed to load knowledge file
```

### Enable Debug Logging

Set environment variable:

```
LOG_LEVEL=debug
```

## Scheduled Tasks

| Task            | Schedule      | Code Location         |
| --------------- | ------------- | --------------------- |
| Harvest         | Every 7 days  | `HarvestScheduler.js` |
| Validation      | On startup    | `KnowledgeManager.js` |
| Cache cleanup   | On restart    | `CacheManager.js`     |
| Staleness check | On validation | `QualityScorer.js`    |

---

[← Back to Beast Mode](beast-mode) | [Back to Home →](/)
