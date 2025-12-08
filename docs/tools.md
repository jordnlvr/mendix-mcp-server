---
layout: default
title: Tools Reference
---

# 🛠️ Tools Reference

All available MCP tools exposed by the Mendix Expert server.

## Search Tools

### `query_mendix_knowledge`

Search the curated knowledge base for Mendix topics.

```
@mendix-expert query_mendix_knowledge topic="microflow error handling" detail_level="detailed"
```

| Parameter      | Type   | Default  | Description                      |
| -------------- | ------ | -------- | -------------------------------- |
| `topic`        | string | required | The topic to search for          |
| `detail_level` | enum   | `basic`  | `basic`, `detailed`, or `expert` |

**Returns:** Ranked list of matching knowledge entries with relevance scores.

---

### `hybrid_search`

Combined keyword + semantic search for best results.

```
@mendix-expert hybrid_search query="iterate over list" limit=5
```

| Parameter     | Type    | Default  | Description           |
| ------------- | ------- | -------- | --------------------- |
| `query`       | string  | required | Search query          |
| `limit`       | number  | 10       | Max results to return |
| `keywordOnly` | boolean | false    | Skip vector search    |
| `vectorOnly`  | boolean | false    | Skip keyword search   |

**Returns:** Fused results with match type indicators (🎯 both, 📝 keyword, 🔮 vector).

---

### `vector_search`

Pure semantic search using embeddings.

```
@mendix-expert vector_search query="business logic automation"
```

| Parameter  | Type   | Default  | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `query`    | string | required | Semantic search query    |
| `topK`     | number | 10       | Number of results        |
| `minScore` | number | 0.3      | Minimum similarity score |

**Returns:** Semantically similar entries from Pinecone.

---

## Project Analysis

### `analyze_project`

Analyze a Mendix `.mpr` file or extracted project.

```
@mendix-expert analyze_project project_path="D:/Projects/MyApp.mpr"
```

| Parameter      | Type   | Default  | Description                            |
| -------------- | ------ | -------- | -------------------------------------- |
| `project_path` | string | required | Path to `.mpr` file                    |
| `module_name`  | string | optional | Specific module to analyze             |
| `entity_name`  | string | optional | Specific entity (requires module_name) |

**Returns:** Project structure with modules, entities, microflows, and pages.

---

## Knowledge Management

### `add_to_knowledge_base`

Add new knowledge to make the system smarter.

```
@mendix-expert add_to_knowledge_base knowledge_file="best-practices" category="microflows" content="{...}" source="docs.mendix.com"
```

| Parameter        | Type    | Default  | Description                    |
| ---------------- | ------- | -------- | ------------------------------ |
| `knowledge_file` | enum    | required | Target file (see below)        |
| `category`       | string  | optional | Category within file           |
| `content`        | string  | required | JSON string of knowledge entry |
| `source`         | string  | required | Where this info came from      |
| `verified`       | boolean | false    | Whether manually verified      |

**Knowledge Files:**

- `best-practices` - Patterns and guidelines
- `studio-pro` - Studio Pro features
- `model-sdk` - Model SDK programming
- `platform-sdk` - Platform SDK operations
- `troubleshooting` - Issues and solutions
- `advanced-patterns` - Complex techniques
- `performance-guide` - Optimization
- `security-guide` - Security practices

**Returns:** Entry ID, quality score, confirmation of re-indexing.

---

### `get_best_practice`

Get recommendations for specific scenarios.

```
@mendix-expert get_best_practice scenario="error handling in microflows"
```

| Parameter  | Type   | Default  | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `scenario` | string | required | The scenario to get advice for |

---

## Harvesting

### `harvest`

Crawl Mendix documentation for fresh knowledge.

```
@mendix-expert harvest sources=["releaseNotes", "mxsdk"] dryRun=false
```

| Parameter | Type    | Default | Description                 |
| --------- | ------- | ------- | --------------------------- |
| `sources` | array   | all     | Specific sources to harvest |
| `dryRun`  | boolean | false   | Preview without saving      |
| `verbose` | boolean | true    | Show detailed progress      |

**Available Sources:**

- `releaseNotes` - Studio Pro 10.x, 11.x release notes
- `refGuide` - Reference guide sections
- `howTo` - How-to guides
- `studioProGuide` - Studio Pro guide
- `apidocs` - API documentation
- `mxsdk` - SDK documentation

---

### `harvest_status`

Check harvest schedule and history.

```
@mendix-expert harvest_status
```

**Returns:** Last harvest date, next scheduled, total harvests, available sources.

---

## Vector Search Management

### `vector_status`

Check Pinecone index and embedding status.

```
@mendix-expert vector_status
```

**Returns:**

- Index status (ready/not initialized)
- Vector count
- Embedding mode (azure-openai/openai/local)
- Query cache stats (hit rate)

---

### `reindex_vectors`

Re-index all knowledge for vector search.

```
@mendix-expert reindex_vectors
```

Use this after:

- Major knowledge base updates
- Changing embedding provider
- Suspected index corruption

---

## Sync & Maintenance

### `sync_mcp_server`

Sync knowledge with GitHub repository.

```
@mendix-expert sync_mcp_server action="pull"
```

| Parameter | Type | Default | Description                 |
| --------- | ---- | ------- | --------------------------- |
| `action`  | enum | `pull`  | `pull`, `push`, or `status` |

---

## Research Mode

### `beast_mode`

Get the exhaustive research protocol prompt.

```
@mendix-expert beast_mode format="full"
```

| Parameter | Type | Default | Description                        |
| --------- | ---- | ------- | ---------------------------------- |
| `format`  | enum | `full`  | `full`, `brief`, or `instructions` |

**Returns:** Copy-paste ready prompt that enables aggressive research mode in any AI chat.

---

### `hello`

Welcome screen with status overview.

```
@mendix-expert hello
```

**Returns:** Server status, knowledge stats, vector status, quick examples.

---

## Tool Usage Patterns

### Finding Information

```
# Start broad, then narrow
@mendix-expert query_mendix_knowledge topic="security"
@mendix-expert hybrid_search query="user role xpath constraints"
```

### Learning Mode

```
# Research → Discover → Save
@mendix-expert beast_mode format="full"
# [Use prompt to research topic]
@mendix-expert add_to_knowledge_base knowledge_file="best-practices" ...
```

### Project Work

```
# Understand project structure
@mendix-expert analyze_project project_path="D:/MyApp.mpr"

# Find relevant patterns
@mendix-expert hybrid_search query="domain model for [your entities]"
```

---

[← Back to Architecture](architecture) | [Next: Knowledge Base →](knowledge-base)
