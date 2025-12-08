# 🚀 Mendix MCP Server - User Guide

## 🎯 How to Use Your Mendix Expert MCP Server

> **NEW!** 🧠 The MCP server now features **AUTO-RESEARCH**! When you ask about topics not in the knowledge base, the AI will automatically research from official sources, add the knowledge to the appropriate file, and answer your question. The knowledge base grows itself! See [AUTO-RESEARCH-FEATURE.md](AUTO-RESEARCH-FEATURE.md) for details.

### Method 1: Direct Access via Copilot Chat (Recommended)

1. **Open Copilot Chat**

   - Press `Ctrl+Shift+P`
   - Type "GitHub Copilot: Open Chat"
   - Press Enter

2. **Invoke the MCP Server**

   ```
   Use the mendix-expert MCP server to [your question]
   ```

3. **Example Questions:**

   ```
   Use the mendix-expert MCP server to explain how to implement
   a many-to-many relationship in Mendix

   Use the mendix-expert MCP server to analyze the Request entity
   from OneTech's RequestHub module

   Use the mendix-expert MCP server to show me best practices
   for microflow error handling

   Use the mendix-expert MCP server to explain the differences
   between Mendix 10.23 and 11

   Use the mendix-expert MCP server to explain scheduled events
   best practices
   (⚡ This will trigger auto-research if not in KB!)
   ```

### Method 2: Configure in VS Code Settings

Add this to your VS Code `settings.json`:

```json
{
  "mcp-servers": {
    "mendix-expert": {
      "command": "node",
      "args": ["D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\mendix-mcp-server\\server.js"],
      "env": {
        "MENDIX_PROJECT_PATH": "D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr",
        "MENDIX_SDK_TOOLKIT_PATH": "D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\Mendix-SDK-Toolkit"
      }
    }
  }
}
```

Then Copilot will automatically have access to the MCP server.

---

## 📚 What Your MCP Server Knows

### 1. Official Mendix Knowledge

- Studio Pro 10.23+ and 11+ features
- Mendix Model SDK complete API
- Platform SDK capabilities
- Official best practices
- Security patterns
- Performance optimization

### 2. OneTech Project Context

- **RequestHub Module**
  - 12 entities (Request, RequestSpecialty, etc.)
  - 74 attributes
  - 14 associations
  - Cross-module references to MainModule and System
- **MainModule**
  - 7 entities (Account_Siemens, Contact_Siemens, Activity, etc.)
  - 47 attributes
  - Internal associations
  - References to RequestHub

### 3. Real-World Patterns

- Many-to-many relationships (RequestHub uses this extensively)
- Audit trail implementation
- Entity inheritance patterns
- Cross-module associations

---

## 🔄 Keeping It Up-to-Date

### Weekly Updates (5-10 minutes)

**1. Add New Learnings from Your Work**

When you discover something useful:

```bash
# Open the knowledge base
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge

# Edit the relevant file
code best-practices.json
```

Add your discovery in this format:

```json
{
  "scenario": "Your specific scenario",
  "solution": "What worked",
  "why": "Why it's a best practice",
  "example": "Code or pattern",
  "date_added": "2025-11-12",
  "source": "OneTech project" or "Mendix docs" or "Your experience"
}
```

**2. Quick Research Boost**

Tell Copilot:

```
Research the latest Mendix [topic] and add findings to the
mendix-expert MCP knowledge base at
D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge\
```

### Monthly Deep Updates (30 minutes)

**1. Extract New OneTech Data**

If you've modified OneTech's domain model:

```bash
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\Mendix-SDK-Toolkit
npx ts-node src/index.ts
```

The MCP server automatically loads fresh data on restart.

**2. Research New Mendix Releases**

When Mendix releases a new version:

```
You are a Mendix research AI. Mendix just released version [X.X].
Research ALL new features, breaking changes, and enhancements.
Update the mendix-expert MCP knowledge base with:
- New features in studio-pro.json
- SDK changes in model-sdk.json
- New best practices in best-practices.json
- Version-specific guidance

Save everything to:
D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge\
```

**3. Community Discoveries**

Search for recent insights:

```
Search Mendix Forum for discussions from the last month about
[topic]. Extract best practices and expert tips. Add to the
mendix-expert MCP knowledge base.
```

### Quarterly Comprehensive Updates (1-2 hours)

**Run the FULL Research Prompt Again**

1. Open `RESEARCH-PROMPT.md`
2. Copy the entire prompt
3. Paste into Copilot Chat
4. Add this at the end:
   ```
   Focus on topics added or changed since the last research session.
   Check release notes from the last 3 months.
   ```

---

## 🎯 Pro Tips for Maximum Value

### 1. Teach It Your Patterns

After solving a problem in OneTech:

```
Add this pattern to the mendix-expert MCP knowledge base:

Problem: [What you were trying to do]
Solution: [How you solved it]
Code: [Your implementation]
Lessons: [What you learned]
```

### 2. Extract Project Insights

Regularly analyze your OneTech project:

```
Use the mendix-expert MCP to analyze the OneTech RequestHub
module and suggest 3 improvements based on Mendix best practices.
```

### 3. Create Custom Queries

Build reusable query patterns:

```
# Save common queries in a file
echo "Use mendix-expert MCP to explain [topic]" > quick-queries.txt
```

### 4. Version-Specific Research

When upgrading Mendix:

```
Use mendix-expert MCP to compare Mendix [old version] vs [new version]
and list migration considerations for the OneTech project.
```

---

## 🔧 Maintenance Commands

### Test the MCP Server

```bash
cd D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server
npm test
```

### Update Dependencies

```bash
npm update
```

### Backup Knowledge Base

```bash
# Run monthly
$date = Get-Date -Format "yyyy-MM-dd"
Copy-Item knowledge knowledge-backup-$date -Recurse
```

### Restore from Backup

```bash
Copy-Item knowledge-backup-[date] knowledge -Recurse -Force
```

---

## 📊 Growth Strategy

### Phase 1: Foundation (Complete! ✅)

- [x] Basic knowledge structure
- [x] OneTech integration
- [x] Official docs coverage
- [x] MCP server working

### Phase 2: Enrichment (Ongoing)

- [ ] Add 10+ real-world patterns from OneTech work
- [ ] Document 20+ common solutions
- [ ] Create troubleshooting database (50+ issues)
- [ ] Add performance benchmarks

### Phase 3: Advanced (Next Quarter)

- [ ] Video tutorial parsing and summarization
- [ ] Automated Mendix release note monitoring
- [ ] Community pattern library integration
- [ ] Security vulnerability tracking
- [ ] Performance optimization database

### Phase 4: Expert (Future)

- [ ] Real-time API integration with Mendix
- [ ] Automated code review suggestions
- [ ] Project health scanning
- [ ] Migration planning tools

---

## 🎓 Learning from Usage

The MCP server learns as you use it:

### Automatic Learning (Already Configured)

- Analyzes OneTech project structure
- Tracks domain model changes
- Identifies patterns in your code
- References your Mendix SDK Toolkit data

### Manual Enrichment

After each major OneTech change:

1. Document what you learned
2. Add to knowledge base
3. Test with Copilot query
4. Refine if needed

---

## 💡 Example Workflows

### Daily Development

```
Morning:
- "Use mendix-expert MCP to review today's tasks
   and suggest best approaches"

During Work:
- "Use mendix-expert MCP to help with [current problem]"

End of Day:
- "Add today's learnings to mendix-expert MCP knowledge base"
```

### Problem Solving

```
1. "Use mendix-expert MCP to explain [problem]"
2. Get solution with examples
3. Implement in OneTech
4. "Add this solution to mendix-expert MCP for future reference"
```

### Code Review

```
"Use mendix-expert MCP to review this microflow against
Mendix best practices: [paste code]"
```

---

## 🚀 Quick Reference

### Access MCP Server

```
Use the mendix-expert MCP server to [question]
```

### Update Knowledge

```
Add to mendix-expert MCP knowledge base: [new information]
```

### Query OneTech Data

```
Use mendix-expert MCP to analyze the [entity/module]
from OneTech project
```

### Research New Topics

```
Research [topic] and update mendix-expert MCP knowledge base
```

---

## 📍 File Locations

**MCP Server:**
`D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\`

**Knowledge Base:**
`D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\knowledge\`

**OneTech Data:**
`D:\Users\kelly.seale\VSCode-Dream-Workspace\Mendix-SDK-Toolkit\extracted-data\`

**Research Prompt:**
`D:\Users\kelly.seale\VSCode-Dream-Workspace\mendix-mcp-server\RESEARCH-PROMPT.md`

---

## 🎉 You Now Have:

✅ A **permanent** Mendix expert that never forgets  
✅ **Instant access** to OneTech project knowledge  
✅ **Growing intelligence** that improves with use  
✅ **Offline capability** - works without internet  
✅ **Version control ready** - commit knowledge to Git

**Your Mendix MCP server is a living, growing knowledge base that gets smarter every day you use it!** 🚀
