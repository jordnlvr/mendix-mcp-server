# 🚀 Quick Start: Auto-Research Feature

## What Is It?

Your Mendix MCP server now **grows itself automatically**! When you ask about topics not in the knowledge base, AI will research, add the knowledge, and answer you - all automatically.

## How to Use

### 1️⃣ Restart Your Tools (Important!)

```powershell
# Close VS Code completely (File → Exit)
# Reopen VS Code

# If using Claude Desktop:
# Close Claude Desktop completely
# Reopen Claude Desktop
```

### 2️⃣ Ask Your Question

**In Copilot Chat or Claude Desktop:**

```
Use the mendix-expert MCP server to explain [your topic]
```

### 3️⃣ Watch the Magic ✨

**Scenario A: Topic Already in Knowledge Base**

```
User: "Use mendix-expert to explain microflow error handling"

AI Response:
🔍 Knowledge Base Check: Found comprehensive information
📚 Answer: [Detailed answer from KB]
```

**Scenario B: Topic NOT in Knowledge Base** (Auto-Research Triggers!)

```
User: "Use mendix-expert to explain scheduled events best practices"

AI Response:
🔍 Knowledge Base Check: No detailed info on scheduled events found
🔬 Researching from **ALL sources**:
   - docs.mendix.com (official docs)
   - Mendix Forum (community solutions)
   - Medium/Dev.to (expert tutorials)
   - YouTube (video guides)
   - Stack Overflow (Q&A)
   - LinkedIn (MVP insights)
   - GitHub (code examples)
   - And more...
💾 Adding to knowledge base with source citations...
✅ Successfully added knowledge to best-practices.json
📚 Answer: [Comprehensive researched answer with multiple sources]
```

**Next time someone asks about scheduled events → instant answer!**

## Test Questions

Try these to trigger auto-research:

```
Use mendix-expert to explain scheduled events best practices

Use mendix-expert to explain offline-first mobile app patterns

Use mendix-expert to explain custom widget development workflow

Use mendix-expert to explain Mendix 11 new features

Use mendix-expert to explain advanced XPath for security rules
```

## What Gets Added?

**Auto-added knowledge includes:**

- 📄 **Content**: Structured information matching file format
- 🕒 **Timestamp**: When it was added
- 🔗 **Source**: URL to official docs
- 🏷️ **Tag**: `added_by: "mendix-expert-mcp"`

**Example** (in best-practices.json):

```json
{
  "practice": "Use cluster-aware scheduling",
  "rationale": "Prevents duplicate execution in multi-instance environments",
  "implementation": "Enable 'Only run on one instance' in scheduled event settings",
  "_metadata": {
    "added_at": "2025-06-15T14:30:00.000Z",
    "source": "https://docs.mendix.com/refguide/scheduled-events/",
    "added_by": "mendix-expert-mcp"
  }
}
```

## Knowledge Base Files

AI will automatically add to the appropriate file:

| File                     | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `best-practices.json`    | Development best practices, patterns      |
| `studio-pro.json`        | Studio Pro features, UI, workflows        |
| `model-sdk.json`         | Model SDK API reference, code gen         |
| `platform-sdk.json`      | Platform SDK, deployment, CI/CD           |
| `troubleshooting.json`   | Common issues, debugging, fixes           |
| `advanced-patterns.json` | Expert patterns, architectures            |
| `performance-guide.json` | Optimization, caching, profiling          |
| `security-guide.json`    | Authentication, authorization, compliance |

## Monitoring Growth

**Check knowledge base size:**

```powershell
Get-ChildItem "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge" |
  Select-Object Name, @{N='Size (KB)';E={[math]::Round($_.Length/1KB,2)}} |
  Format-Table -AutoSize
```

**Starting point**: 196.85 KB total

- best-practices: 22.80 KB
- studio-pro: 38.79 KB
- model-sdk: 23.88 KB
- platform-sdk: 23.16 KB
- security-guide: 23.87 KB
- advanced-patterns: 24.19 KB
- performance-guide: 20.55 KB
- troubleshooting: 20.19 KB

## Quality Control

### Reviewing Auto-Added Content

```powershell
# Search for auto-added items
cd "D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge"
Get-Content best-practices.json | Select-String -Pattern "mendix-expert-mcp" -Context 10
```

### Manual Refinement (Optional)

After AI adds knowledge, you can:

1. Open the JSON file
2. Find items with `_metadata.added_by: "mendix-expert-mcp"`
3. Add more examples, details, or corrections
4. Mark as `manually_refined: true` in metadata

## Troubleshooting

### "Failed to add knowledge" Error

✅ **Solution**: Check error details. Usually JSON structure mismatch or file permissions.

### Knowledge Added But Not Appearing

✅ **Solution**: Restart VS Code / Claude Desktop. (Tool should auto-reload, but restart ensures it.)

### AI Not Using Auto-Research

✅ **Solution**: Ensure you restarted tools after updating server.js. The new prompt instructions load at startup.

## Benefits

🎯 **Zero Maintenance**

- No manual JSON editing
- No copying suggested content
- No syntax errors

🧠 **Self-Improving**

- Learns from every gap
- Grows smarter with usage
- Knowledge accumulates naturally

📚 **Quality Tracked**

- Source URLs for verification
- Timestamps for auditing
- Easy to review and refine

## Full Documentation

- **AUTO-RESEARCH-FEATURE.md** - Complete technical guide
- **WHATS-NEW.md** - What changed in this update
- **USER-GUIDE.md** - How to use the MCP server
- **PROJECT-CONTEXT.md** - Overall project context

## Summary

✅ **Restart VS Code and Claude Desktop**
✅ **Ask questions normally using "Use mendix-expert..."**
✅ **AI automatically researches and adds missing knowledge**
✅ **Knowledge base grows itself**
✅ **No manual work required!**

🎉 **Your Mendix expert is now fully autonomous!** 🚀
