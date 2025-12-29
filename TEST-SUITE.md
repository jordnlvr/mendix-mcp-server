# 🧪 Mendix Expert MCP Server - Test Suite

**Comprehensive tests to verify everything works!**

---

## 🎯 TEST 1: Source Attribution Test

**What:** Verify sources are shown in responses

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to explain domain model associations - show me where this info comes from"
```

**Expected:**
- ✅ Quality assessment banner (EXCELLENT/GOOD/FAIR/POOR)
- ✅ Multiple source entries with categories
- ✅ Relevance scores (e.g., 85.3%)
- ✅ Source URLs (docs.mendix.com, etc.)
- ✅ Mendix version info
- ✅ Search metadata at bottom

---

## 🧠 TEST 2: Quality Assessment Test

**What:** See how the system rates answer quality

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to find information about quantum computing in Mendix"
```

**Expected:**
- ❌ Quality: NO_RESULTS or POOR
- ⚠️ Recommendation to use Beast Mode
- 📊 Low relevance scores (if any results)

This proves the quality system works - it knows when it doesn't have good info!

---

## 🔍 TEST 3: Semantic Search Test

**What:** Test vector/semantic search capabilities

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to search for 'workflows that execute business logic automatically'"
```

**Expected:**
- ✅ Should find "microflow" content
- ✅ Even though you didn't say "microflow"!
- ✅ Semantic search understands meaning
- 📊 Shows search method: "hybrid (keyword + semantic)"

---

## 🎨 TEST 4: Best Practices Query

**What:** Get specific best practice recommendations

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to get best practices for handling errors in microflows"
```

**Expected:**
- ✅ Specific error handling patterns
- ✅ Multiple sources with examples
- ✅ Category: best-practices
- 📊 High relevance scores (70%+)

---

## 🏗️ TEST 5: Architecture Question

**What:** Ask about system architecture

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to explain the difference between persistable and non-persistable entities"
```

**Expected:**
- ✅ Clear explanation with sources
- ✅ Technical depth
- ✅ Version-specific info if applicable
- 📚 Multiple knowledge entries cited

---

## 🔧 TEST 6: Integration Question

**What:** Ask about external integrations

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to find how to consume REST APIs in Mendix"
```

**Expected:**
- ✅ REST integration patterns
- ✅ Call REST Service action info
- ✅ JSON handling
- 🔗 Source references to official docs

---

## 📊 TEST 7: Version-Specific Query

**What:** Ask about version-specific features

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to search for Studio Pro 10 new features"
```

**Expected:**
- ✅ Results tagged with Mendix Version: 10.x
- ✅ Version-aware responses
- 📅 Date Added shown for currency

---

## 🌐 TEST 8: Railway REST API Test

**What:** Test the Railway HTTP API directly

**PowerShell:**
```powershell
$body = @{
    topic = "microflow performance"
    detail_level = "detailed"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mendix-mcp-server-production.up.railway.app/query" -Method Post -Body $body -ContentType "application/json"
```

**Expected:**
- ✅ JSON response with results
- ✅ Same source attribution as MCP
- ✅ Quality assessment included

---

## 🚀 TEST 9: Fly.io Health Check

**What:** Verify Fly.io deployment is healthy

**PowerShell:**
```powershell
Invoke-RestMethod https://mendix-mcp-server.fly.dev/health
```

**Expected:**
```json
{
  "status": "healthy",
  "initialized": true,
  "storage": "supabase",
  "entries": 321
}
```

---

## 🔄 TEST 10: Railway Health Check

**What:** Verify Railway deployment is healthy

**PowerShell:**
```powershell
Invoke-RestMethod https://mendix-mcp-server-production.up.railway.app/health
```

**Expected:**
```json
{
  "status": "healthy",
  "initialized": true,
  "vectorSearchAvailable": true,
  "storage": "supabase",
  "entries": 321
}
```

---

## 🎭 TEST 11: Edge Case - Empty Query

**What:** How does it handle bad input?

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to search for 'asdfghjkl'"
```

**Expected:**
- ⚠️ Quality: POOR or NO_RESULTS
- 💡 Helpful message about trying different terms
- 🔍 Search metadata still shown

---

## 📱 TEST 12: Complex Multi-Part Query

**What:** Test with complex, multi-faceted question

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to explain how to implement a custom widget that connects to an external API and updates data in the domain model with proper error handling"
```

**Expected:**
- ✅ Multiple relevant sources
- ✅ Each covering different aspects (widgets, APIs, domain model, error handling)
- ✅ High quality assessment (should find multiple matches)
- 📊 Search metadata shows comprehensive results

---

## 🔬 TEST 13: Search Method Comparison

**What:** See which search method was used

**Test A - Should trigger semantic search:**
```powershell
claude "Use @mendix-expert to find information about forms that collect user input"
```

**Test B - Should trigger keyword search:**
```powershell
claude "Use @mendix-expert to find information about microflows"
```

**Expected:**
- ✅ Both show search method in metadata
- 🔍 "hybrid (keyword + semantic)" for both
- 📊 Different relevance scores based on match type

---

## 💾 TEST 14: Knowledge Base Stats

**What:** Get current knowledge base statistics

**Claude Code CLI:**
```powershell
claude "Use @mendix-expert to show current server status and knowledge base statistics"
```

**Expected:**
- ✅ Total entries (321+)
- ✅ Storage type (Supabase)
- ✅ Vector search status
- 📊 Server health info

---

## 🎓 TEST 15: Learning/Teaching Test

**What:** Ask it to learn something new (if using REST API with /learn endpoint)

**PowerShell (Railway only):**
```powershell
$body = @{
    title = "Test Entry - Custom Styling"
    content = "Always use design tokens instead of hardcoded colors in custom widgets."
    category = "best-practices"
    source = "Manual test entry"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://mendix-mcp-server-production.up.railway.app/learn" -Method Post -Body $body -ContentType "application/json"
```

**Expected:**
- ✅ Success message
- ✅ Entry ID returned
- ✅ Now searchable immediately

**Verify it learned:**
```powershell
claude "Use @mendix-expert to search for 'design tokens in custom widgets'"
```

Should find the entry you just added!

---

## 🏆 SUCCESS CRITERIA

**For each test, verify:**
- [ ] Response is formatted (not raw JSON)
- [ ] Sources are clearly shown
- [ ] Quality assessment is present
- [ ] Relevance scores are displayed
- [ ] Search metadata is at bottom
- [ ] Information is accurate
- [ ] Response time < 5 seconds

---

## 🎯 RECOMMENDED TEST ORDER

**Quick Smoke Test (5 minutes):**
1. TEST 9 - Fly.io health
2. TEST 10 - Railway health
3. TEST 1 - Source attribution
4. TEST 3 - Semantic search

**Comprehensive Test (15 minutes):**
1. All health checks (9, 10)
2. Quality tests (1, 2, 11)
3. Feature tests (3, 4, 5)
4. Edge cases (6, 7, 12)

**Full Validation (30 minutes):**
- Run all 15 tests
- Document any failures
- Verify deployments after changes

---

## 📝 TEST RESULTS TEMPLATE

```
Date: [DATE]
Tester: [NAME]

TEST 1 - Source Attribution: ✅ PASS / ❌ FAIL
  - Sources shown: Yes/No
  - Quality rating: [RATING]
  - Notes: [NOTES]

TEST 2 - Quality Assessment: ✅ PASS / ❌ FAIL
  - Correct low quality detected: Yes/No
  - Beast Mode suggested: Yes/No
  - Notes: [NOTES]

[etc...]

Overall: ✅ ALL PASS / ⚠️ SOME ISSUES / ❌ CRITICAL FAILURES
```

---

**Created:** December 29, 2025  
**Purpose:** Comprehensive validation of MCP server functionality  
**Frequency:** Run after each deployment or major change
