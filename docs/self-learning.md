---
layout: default
title: Self-Learning
---

# 🧠 Self-Learning

The Mendix Expert server is designed to grow smarter with every interaction. Here's how the self-learning system works.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    DISCOVERY SOURCES                        │
├─────────────────────────────────────────────────────────────┤
│  🔍 Beast Mode Research  │  User discovers new patterns    │
│  🌾 Auto-Harvest         │  Weekly doc crawls              │
│  💬 User Contributions   │  Manual additions               │
│  🐛 Problem Solving      │  Solutions to issues            │
└────────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  add_to_knowledge_base                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Parse JSON  │→ │ Quality     │→ │ Duplicate Detection │ │
│  │             │  │ Scoring     │  │                     │ │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘ │
└───────────────────────────────────────────────┼─────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE                              │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ knowledge/*.json│  │ Pinecone (vector embeddings)    │  │
│  │ (source of truth)│  │ (semantic search index)         │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│               IMMEDIATELY SEARCHABLE                        │
│  • Keyword search (TF-IDF re-indexed)                      │
│  • Vector search (embeddings generated)                     │
│  • Hybrid search (both combined)                           │
└─────────────────────────────────────────────────────────────┘
```

## The Learning Loop

### 1. Discovery

Knowledge is discovered through:

- **Beast Mode Research** - AI exhaustively searches official docs, GitHub, forums
- **Auto-Harvest** - Weekly crawls of docs.mendix.com
- **Problem Solving** - When fixing issues, solutions are saved
- **User Contributions** - Manual additions via tool

### 2. Quality Assessment

Every entry is automatically scored:

```javascript
QualityScore = weighted_sum(
  completeness, // Has required fields?
  source_quality, // Official docs = higher
  verification, // Manually verified?
  content_depth, // Detailed explanation?
  examples // Has code examples?
);
```

Low-quality entries are flagged for review.

### 3. Duplicate Detection

Before adding, the system checks:

- Exact title matches
- Semantic similarity (if vectors enabled)
- Content overlap

Duplicates are merged or rejected.

### 4. Persistence

New knowledge is saved to:

1. **JSON files** - `knowledge/*.json` (source of truth)
2. **Keyword index** - In-memory TF-IDF
3. **Vector index** - Pinecone embeddings

### 5. Immediate Availability

After adding knowledge:

```
✅ Successfully added knowledge to best-practices.json
📋 Entry ID: a1b2c3d4
⭐ Quality Score: 87%
🔄 Status: Knowledge base reloaded and re-indexed
🧠 Semantic: Vector embeddings updated ✓

The new information is now available for queries!
```

## Self-Learning in Action

### Example: Beast Mode Discovery

````
User: @mendix-expert How do I use AggregateListAction in the SDK?

AI: [Searches knowledge base - no specific results]
    [Enables Beast Mode research]
    [Searches docs.mendix.com]
    [Finds pattern in SDK demos on GitHub]

    Found it! Here's how to use AggregateListAction:

    ```javascript
    const aggregateAction = microflows.AggregateListAction.createIn(activity);
    aggregateAction.aggregateFunction = microflows.AggregateFunctionEnum.Count;
    // ... more details
    ```

    Let me save this to the knowledge base so I remember it next time...

    @mendix-expert add_to_knowledge_base
      knowledge_file="model-sdk"
      content='{"title": "AggregateListAction Pattern", ...}'
      source="github.com/mendix/sdk-demo"
````

### Example: Auto-Harvest

```
[Weekly harvest runs]

🌾 Starting Knowledge Harvest...
   Sources: releaseNotes, refGuide, mxsdk

📖 Harvesting: Studio Pro Release Notes...
   ✅ Harvested 15 entries from Studio Pro Release Notes

📖 Harvesting: Reference Guide...
   ✅ Harvested 8 entries from Reference Guide

🎯 Harvesting Priority Topics...
   ✅ Maia AI Assistant - 3 new entries
   ✅ Page Variables - 2 new entries

🧠 Updating semantic search vectors...
   ✅ Vector embeddings updated with new knowledge

📊 Harvest Complete!
   New entries: 28
   Updated entries: 5
```

### Example: Problem-Solution Learning

````
User: I'm getting "Cannot read property 'id' of undefined" when
      creating a microflow parameter

AI: [Researches the issue]

    Found the fix! You need to create the MicroflowParameterObject
    AFTER the entity is committed:

    ```javascript
    // Wrong - entity not committed yet
    const param = microflows.MicroflowParameterObject.createIn(mf);
    param.entityRef = entity;  // ❌ entity.id is undefined

    // Right - flush first
    await model.flushChanges();
    const param = microflows.MicroflowParameterObject.createIn(mf);
    param.entityRef = entity;  // ✅ entity now has id
    ```

    Saving this to troubleshooting...
````

## Configuring Self-Learning

### Enable/Disable Auto-Save

The server always supports self-learning, but you control when to save:

```
# AI automatically saves after research (default behavior when using Beast Mode)
# Or manually trigger:
@mendix-expert add_to_knowledge_base ...
```

### Harvest Schedule

Default: Every 7 days

To change (in code):

```javascript
// In HarvestScheduler.js
this.harvestIntervalDays = 7; // Change this value
```

### Manual Harvest

```
@mendix-expert harvest
# Runs full harvest now

@mendix-expert harvest sources=["mxsdk"] dryRun=true
# Preview what would be harvested from SDK docs only
```

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
