# Migration Guide: v1.0 → v2.0

## Overview

Mendix Expert MCP Server v2.0 is a complete architectural rewrite focusing on:

- **Modularity**: Clean separation of concerns
- **Scalability**: Efficient caching and indexing
- **Intelligence**: Quality scoring and relevance ranking
- **Flexibility**: Dynamic project loading (no hard-coded paths)
- **Self-learning**: Automatic knowledge improvement

## Breaking Changes

### 1. Tool Name Changes

| v1.0 Tool                | v2.0 Tool         | Migration Action                     |
| ------------------------ | ----------------- | ------------------------------------ |
| `analyze_onetech_entity` | `analyze_project` | **BREAKING** - Update all references |

### 2. Tool Parameter Changes

#### `analyze_project` (replaces `analyze_onetech_entity`)

**OLD (v1.0):**

```json
{
  "module": "RequestHub | MainModule",
  "entity_name": "ServiceRequest"
}
```

**NEW (v2.0):**

```json
{
  "project_path": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
  "module_name": "RequestHub",
  "entity_name": "ServiceRequest"
}
```

**Key Changes:**

- ✅ **Added:** `project_path` parameter (required) - can be any .mpr file or extracted directory
- ❌ **Removed:** Enum restriction on `module` - now accepts any module name
- ✅ **Benefit:** Works with ANY Mendix project, not just OneTech

#### `query_mendix_knowledge` (enhanced)

**OLD (v1.0):**

```json
{
  "topic": "domain model relationships"
}
```

**NEW (v2.0):**

```json
{
  "topic": "domain model relationships",
  "detail_level": "detailed", // NEW: optional
  "max_results": 10 // NEW: optional
}
```

**Key Changes:**

- ✅ **Added:** `detail_level` parameter (brief/detailed/comprehensive)
- ✅ **Added:** `max_results` parameter (control result count)
- ✅ **Enhanced:** Returns relevance scores and quality metrics
- ✅ **Benefit:** More control over search depth and result quality

#### `add_to_knowledge_base` (enhanced)

**OLD (v1.0):**

```json
{
  "knowledge_file": "best-practices",
  "category": "domain-model",
  "content": { ... }
}
```

**NEW (v2.0):**

```json
{
  "knowledge_file": "best-practices",
  "category": "domain-model",
  "content": { ... },
  "source": "https://docs.mendix.com/...",  // NEW: required
  "verified": true                           // NEW: optional
}
```

**Key Changes:**

- ✅ **Added:** `source` parameter (required) - URL for quality scoring
- ✅ **Added:** `verified` parameter (optional) - mark as verified
- ✅ **Enhanced:** Automatic duplicate detection and merging
- ✅ **Enhanced:** Quality scoring based on source reliability
- ✅ **Benefit:** Prevents duplicate knowledge, maintains high quality

### 3. Configuration Changes

**OLD (v1.0):**
Configuration was hard-coded in `server.js`

**NEW (v2.0):**
Centralized configuration in `config/default.json`

```json
{
  "server": {
    "name": "mendix-expert",
    "version": "2.0.0"
  },
  "paths": {
    "knowledgeBase": "./knowledge",
    "projects": {
      "onetech": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr"
    }
  },
  "cache": {
    "strategy": "lru",
    "maxSize": 100,
    "defaultTTL": 1800000
  }
  // ... see config/default.json for full reference
}
```

**Migration:**

1. Review `config/default.json`
2. Override settings via environment variables if needed:
   ```bash
   MENDIX_MCP_SERVER_NAME="my-server" node src/index.js
   ```

### 4. Entry Point Change

**OLD (v1.0):**

```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

**NEW (v2.0):**

```json
{
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "legacy": "node server.js" // v1.0 still available
  }
}
```

**Migration:**

- Update VS Code settings.json MCP configuration to use new entry point
- Or continue using `npm run legacy` for v1.0 behavior

## Migration Steps

### Step 1: Backup Current Configuration

```powershell
# Backup your knowledge base
Copy-Item -Recurse knowledge knowledge-backup-$(Get-Date -Format 'yyyyMMdd')

# Backup VS Code settings
Copy-Item "$env:APPDATA\Code - Insiders\User\settings.json" "settings-backup-$(Get-Date -Format 'yyyyMMdd').json"
```

### Step 2: Install Dependencies

```powershell
cd mendix-mcp-server
npm install
```

**New dependency:**

- `uuid` v11.0.3 - For unique knowledge entry IDs

### Step 3: Update VS Code Settings

**OLD (v1.0):**

```json
{
  "github.copilot.chat.mcp": {
    "enabled": true,
    "servers": {
      "mendix-expert": {
        "command": "node",
        "args": ["D:\\path\\to\\mendix-mcp-server\\server.js"]
      }
    }
  }
}
```

**NEW (v2.0):**

```json
{
  "github.copilot.chat.mcp": {
    "enabled": true,
    "servers": {
      "mendix-expert": {
        "command": "node",
        "args": ["D:\\path\\to\\mendix-mcp-server\\src\\index.js"]
      }
    }
  }
}
```

### Step 4: Update Tool Calls in Your Workflows

If you have saved prompts or workflows that use `analyze_onetech_entity`, update them:

**Before:**

```
@mendix-expert analyze_onetech_entity module=RequestHub entity_name=ServiceRequest
```

**After:**

```
@mendix-expert analyze_project project_path="D:\kelly.seale\CodeBase\OneTech-main\OneTech.mpr" module_name=RequestHub entity_name=ServiceRequest
```

### Step 5: Test the Migration

1. **Restart VS Code** to reload MCP server
2. **Test knowledge query:**
   ```
   @mendix-expert What are best practices for domain model design?
   ```
3. **Test project analysis:**
   ```
   @mendix-expert Analyze the ServiceRequest entity in OneTech RequestHub module
   ```
4. **Verify resources work:**
   ```
   @mendix-expert Show knowledge base statistics
   ```

### Step 6: Configure for Your Environment

Edit `config/default.json`:

```json
{
  "paths": {
    "projects": {
      "onetech": "YOUR_ACTUAL_PATH_TO_ONETECH.mpr",
      "project2": "PATH_TO_ANOTHER_PROJECT.mpr"
    }
  }
}
```

Or use environment variables:

```powershell
$env:MENDIX_MCP_PATHS_PROJECTS_ONETECH="D:\your\path\OneTech.mpr"
```

## New Features in v2.0

### 1. Multi-Project Support

Analyze ANY Mendix project dynamically:

```javascript
// Load and analyze Project A
analyze_project({
  project_path: 'C:\\Projects\\ProjectA\\ProjectA.mpr',
  module_name: 'MainModule',
  entity_name: 'Customer',
});

// Load and analyze Project B
analyze_project({
  project_path: 'D:\\Work\\ProjectB\\extracted\\model',
  module_name: 'Sales',
  entity_name: 'Order',
});
```

### 2. Quality Scoring

Every knowledge entry now has a quality score:

```json
{
  "id": "uuid-here",
  "content": { ... },
  "metadata": {
    "qualityScore": 0.92,
    "sourceReliability": 1.0,
    "recencyScore": 0.95,
    "usageScore": 0.80,
    "verified": true
  }
}
```

**Quality Tiers:**

- **Excellent** (90-100%): Highly reliable, official docs, verified
- **Good** (70-89%): Reliable, may need verification
- **Fair** (50-69%): Use with caution
- **Poor** (<50%): Needs improvement or removal

### 3. Intelligent Search

Search now returns relevance-scored results:

```json
{
  "results": [
    {
      "content": { ... },
      "relevance": 0.94,
      "quality": 0.92,
      "source": "https://docs.mendix.com/...",
      "category": "domain-model"
    }
  ],
  "suggestions": ["related topic 1", "related topic 2"]
}
```

### 4. Automatic Duplicate Detection

When adding knowledge, system automatically:

- Detects duplicates (>80% similarity)
- Merges if appropriate
- Preserves highest quality version
- Tracks version history

### 5. Smart Caching

Performance improvements through:

- **LRU/LFU cache** for frequently accessed data
- **Project caching** - load once, use many times
- **Search index caching** - instant results
- **Automatic cleanup** - manages memory

### 6. Enhanced Resources

New MCP resources available:

| Resource      | URI                        | Description             |
| ------------- | -------------------------- | ----------------------- |
| All Knowledge | `mendix://knowledge/all`   | Complete knowledge base |
| KB Statistics | `mendix://stats/knowledge` | Knowledge metrics       |
| Search Stats  | `mendix://stats/search`    | Search performance      |
| Project Stats | `mendix://stats/projects`  | Loaded projects info    |

## Rollback Plan

If you need to revert to v1.0:

### Option 1: Use Legacy Script

```powershell
npm run legacy
```

### Option 2: Revert VS Code Settings

Update `settings.json`:

```json
{
  "github.copilot.chat.mcp": {
    "enabled": true,
    "servers": {
      "mendix-expert": {
        "command": "node",
        "args": ["D:\\path\\to\\mendix-mcp-server\\server.js"]
      }
    }
  }
}
```

### Option 3: Git Revert (if using version control)

```powershell
git checkout v1.0-tag
npm install
```

## Troubleshooting

### Issue: "Unknown tool: analyze_onetech_entity"

**Cause:** Using old tool name with v2.0 server

**Solution:** Update to `analyze_project` with `project_path` parameter

### Issue: "Module not found" errors

**Cause:** Missing dependencies

**Solution:**

```powershell
npm install
```

### Issue: Poor search results

**Cause:** Search index not built

**Solution:** Restart server - index builds automatically on startup

### Issue: Server won't start

**Cause:** Invalid configuration

**Solution:** Check logs for validation errors:

```powershell
node src/index.js 2>&1 | Select-String -Pattern "ERROR"
```

### Issue: High memory usage

**Cause:** Cache size too large

**Solution:** Adjust in `config/default.json`:

```json
{
  "cache": {
    "maxSize": 50 // Reduce from 100
  }
}
```

## Support

For issues or questions:

1. Check logs in VS Code Output panel (MCP section)
2. Review `config/default.json` for configuration options
3. Test with legacy v1.0 to isolate issues: `npm run legacy`
4. Refer to `ARCHITECTURE.md` for component details

## What's Next?

After successful migration:

1. ✅ **Add your projects** to `config/default.json`
2. ✅ **Contribute knowledge** using enhanced `add_to_knowledge_base`
3. ✅ **Monitor quality** using `mendix://stats/knowledge` resource
4. ✅ **Customize caching** based on your usage patterns
5. ✅ **Explore multi-project** analysis capabilities

---

**Migration Checklist:**

- [ ] Backed up knowledge base
- [ ] Backed up VS Code settings
- [ ] Installed dependencies (`npm install`)
- [ ] Updated VS Code settings.json
- [ ] Updated tool calls in saved workflows
- [ ] Configured project paths in config/default.json
- [ ] Tested knowledge query
- [ ] Tested project analysis
- [ ] Verified resources work
- [ ] Reviewed quality scores
- [ ] Documented any custom changes

Welcome to v2.0! 🚀
