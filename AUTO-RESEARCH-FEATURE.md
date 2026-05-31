# Auto-Research Feature 🧠✨

## Overview

The mendix-expert MCP server now features **FULLY AUTOMATED** knowledge base growth! When you ask about a topic that's not in the knowledge base, the AI will:

1. ✅ Check the knowledge base first
2. 🔍 Perform deep research from official Mendix sources
3. 💾 **AUTOMATICALLY ADD** the researched knowledge to the appropriate file
4. 📚 Provide you the answer

**No manual JSON editing required!** The knowledge base grows itself with every gap discovered.

## How It Works

### The Workflow

```
User Question
    ↓
┌───────────────────────────────────┐
│ STEP 1: Query Knowledge Base     │
│ Tools: query_mendix_knowledge     │
│        get_best_practice          │
└───────────────┬───────────────────┘
                ↓
        ┌───────────────┐
        │ Found Good    │
        │ Information?  │
        └───┬───────┬───┘
            │       │
         YES│       │NO
            ↓       ↓
    ┌───────────────────────────────┐
    │ Use KB Info                   │
    │ + Answer User                 │
    └───────────────────────────────┘

            ┌───────────────────────────────┐
            │ STEP 2: Deep Research         │
            │ Sources: docs.mendix.com      │
            │          Mendix Forum         │
            │          Mendix Academy       │
            │          Expert blogs/videos  │
            └───────────┬───────────────────┘
                        ↓
            ┌───────────────────────────────┐
            │ STEP 3: Auto-Add to KB        │
            │ Tool: add_to_knowledge_base   │
            │ - Choose appropriate file     │
            │ - Specify category            │
            │ - Add structured content      │
            │ - Include source URLs         │
            └───────────┬───────────────────┘
                        ↓
            ┌───────────────────────────────┐
            │ KB Reloaded Automatically     │
            │ + Answer User                 │
            └───────────────────────────────┘
```

### The New Tool: `add_to_knowledge_base`

**Purpose**: Programmatically add researched knowledge to JSON files

**Parameters**:

- `knowledge_file` (required): Which file to update
  - Options: `best-practices`, `studio-pro`, `model-sdk`, `platform-sdk`, `troubleshooting`, `advanced-patterns`, `performance-guide`, `security-guide`
- `category` (optional): Category within the file (e.g., "microflows", "domain_modeling")
- `content` (required): Structured JSON object with the knowledge
- `source` (required): Source URL or reference

**What It Does**:

1. Reads the current JSON file
2. Adds your content to the appropriate category (or creates it if needed)
3. Includes metadata: timestamp, source, added_by
4. Writes back to file with proper formatting
5. **Reloads the entire knowledge base** so new info is immediately available
6. Returns success confirmation

**Example Call**:

```json
{
  "knowledge_file": "best-practices",
  "category": "scheduled_events",
  "content": {
    "practice": "Use cluster-aware scheduling",
    "rationale": "Prevents duplicate execution in multi-instance environments",
    "implementation": "Enable 'Only run on one instance' in scheduled event settings",
    "impact": "Avoids data conflicts and performance issues"
  },
  "source": "https://docs.mendix.com/refguide/scheduled-events/"
}
```

## Testing the Feature

### Test Scenario 1: Topic NOT in Knowledge Base

**Try asking**:

```
"Use the mendix-expert MCP server to explain Mendix scheduled events best practices"
```

**Expected AI Behavior**:

1. Queries knowledge base → finds no/insufficient info
2. Acknowledges gap: "The knowledge base doesn't have detailed info on scheduled events yet"
3. Researches from docs.mendix.com and Mendix Forum
4. **Calls `add_to_knowledge_base`** with structured content
5. Confirms: "✅ Knowledge Base Updated - Added scheduled events best practices"
6. Provides comprehensive answer

**Result**: Next time someone asks about scheduled events, the info will be in the knowledge base!

### Test Scenario 2: Topic ALREADY in Knowledge Base

**Try asking**:

```
"Use mendix-expert to explain microflow error handling best practices"
```

**Expected AI Behavior**:

1. Queries knowledge base → finds comprehensive info
2. Uses existing knowledge to answer
3. No research needed, no additions made
4. Provides answer with KB citations

### Test Scenario 3: Partial Information

**Try asking**:

```
"Use mendix-expert to explain offline-first mobile app patterns"
```

**Expected AI Behavior**:

1. Queries knowledge base → finds some general mobile patterns
2. Recognizes gaps in offline-first specifics
3. Researches offline-first details from Mendix Academy
4. **Calls `add_to_knowledge_base`** to supplement existing mobile patterns
5. Provides comprehensive answer combining KB + research

## File Structure After Auto-Add

When the AI adds knowledge, it includes metadata:

```json
{
  "categories": {
    "scheduled_events": [
      {
        "practice": "Use cluster-aware scheduling",
        "rationale": "Prevents duplicate execution",
        "implementation": "Enable 'Only run on one instance'",
        "impact": "Avoids data conflicts",
        "_metadata": {
          "added_at": "2025-06-15T14:30:00.000Z",
          "source": "https://docs.mendix.com/refguide/scheduled-events/",
          "added_by": "mendix-expert-mcp"
        }
      }
    ]
  }
}
```

**Benefits**:

- Track when knowledge was added
- Know the original source for verification
- Identify auto-added vs manually-curated content

## Knowledge Base Growth Tracking

### Before Auto-Research Feature

- **Total Size**: 196.85 KB
- **Categories**: 8 main categories (domain modeling, microflows, pages, security, performance, architecture, testing, deployment)
- **Best Practices**: 50+ practices
- **Expert Tips**: 50+ tips
- **Case Studies**: 25+ case studies

### Monitor Growth

```powershell
# Check file sizes
Get-ChildItem "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge" |
  Select-Object Name, @{N='Size (KB)';E={[math]::Round($_.Length/1KB,2)}} |
  Format-Table -AutoSize

# Search for auto-added content
Get-ChildItem "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge\*.json" |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw | ConvertFrom-Json
    Write-Host "File: $($_.Name)"
    # Count items with _metadata (auto-added)
  }
```

## Quality Control

### Reviewing Auto-Added Knowledge

Since knowledge is now added automatically, periodic review is recommended:

1. **Weekly Review**: Check `_metadata.added_at` timestamps from last 7 days
2. **Source Verification**: Ensure `_metadata.source` points to official docs
3. **Structure Validation**: Verify JSON structure matches file format
4. **Content Quality**: Review for accuracy and completeness

### Manual Refinement

After auto-add, you can manually refine:

```json
{
  "practice": "Use cluster-aware scheduling",
  "rationale": "Prevents duplicate execution...",
  "good_example": "✅ Add specific code example here",
  "bad_example": "❌ Add anti-pattern here",
  "_metadata": {
    "added_at": "2025-06-15T14:30:00.000Z",
    "source": "https://docs.mendix.com/refguide/scheduled-events/",
    "added_by": "mendix-expert-mcp",
    "manually_refined": true
  }
}
```

## Troubleshooting

### "Failed to add knowledge" Error

**Possible Causes**:

1. JSON structure doesn't match file format
2. File permissions issue
3. Invalid category name

**Solution**:

- Check the error message for specifics
- Verify the AI is using correct structure for that file
- Ensure mendix-mcp-server has write access to knowledge/

### Knowledge Added But Not Appearing in Queries

**Cause**: Knowledge base not reloaded

**Solution**: The tool automatically reloads after successful add. If issues persist:

```powershell
# Restart VS Code
# Restart Claude Desktop
```

### Too Much Auto-Added Content

**Symptom**: Files becoming too large

**Solution**:

1. Archive old knowledge periodically
2. Consolidate related items
3. Add file size monitoring to server.js

## Best Practices for Auto-Research

### When to Use

✅ **Use Auto-Research When**:

- Topic not covered in knowledge base
- Existing info is outdated (Mendix version specific)
- User asks about edge cases or advanced patterns
- Official docs have new information

❌ **Don't Use Auto-Research When**:

- Knowledge base already has comprehensive info
- User asking clarifying questions about existing KB content
- Topic is too broad (break down into specific questions)

### Research Quality Guidelines

The AI should research from **ALL AVAILABLE SOURCES** including:

**Official Sources** (Start here):

1. **docs.mendix.com** - Official documentation
2. **Mendix Academy** - Training materials, courses
3. **Mendix Forum** - Community discussions, verified solutions
4. **Mendix Marketplace** - Module documentation, examples
5. **Mendix Blog** - Official articles, announcements
6. **Mendix GitHub** - Official repos, code examples

**Community & Expert Sources** (Deep dive): 7. **Medium** - Expert tutorials, case studies 8. **Dev.to** - Developer stories, practical tips 9. **Stack Overflow** - Community Q&A, problem solving 10. **YouTube** - Tutorials, conference talks, demos 11. **LinkedIn** - Expert insights, MVPs, thought leaders 12. **Twitter/X** - Latest discussions, trends (#mendix) 13. **Reddit r/mendix** - Community help, discussions

**Expert Blogs & Sites**: 14. MVP personal blogs and consulting firm resources 15. Company tech blogs using Mendix in production 16. Academic papers and research on low-code platforms

**Additional Sources**: 17. **Mendix World** conference recordings 18. **Webinars and workshops** 19. **SlideShare** presentations 20. **GitHub Gists** with Mendix snippets 21. **CodePen/JSFiddle** examples for custom widgets 22. **Gartner/Forrester** reports for context

**Search Strategy**: Use multiple search engines, various keyword combinations, verify from multiple sources, prioritize Mendix 10.23+/11.x versions

## Future Enhancements

### Potential Additions

- [ ] **Version tracking**: Tag knowledge with Mendix version (10.x, 11.x)
- [ ] **Confidence scoring**: AI rates confidence in auto-added content
- [ ] **Duplicate detection**: Prevent adding similar knowledge twice
- [ ] **Knowledge merging**: Combine related auto-added items
- [ ] **Usage analytics**: Track which KB items are queried most
- [ ] **Expiration dates**: Flag knowledge that may be outdated
- [ ] **Community contributions**: Accept manual additions with approval workflow

## Summary

🎉 **The mendix-expert MCP server now grows automatically!**

- ✅ No more manual JSON editing for new knowledge
- ✅ AI researches gaps and adds knowledge programmatically
- ✅ Knowledge base reloads instantly after additions
- ✅ Metadata tracks when, where, and how knowledge was added
- ✅ Quality control through source attribution and timestamps

**Result**: Every question that reveals a gap in knowledge becomes an opportunity for the knowledge base to grow. The more you use it, the smarter it gets! 🚀
