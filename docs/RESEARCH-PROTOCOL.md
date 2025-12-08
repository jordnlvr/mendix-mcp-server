# 🔬 Mendix Expert Research Protocol

> **CRITICAL**: This document defines how AI assistants should research Mendix topics when the knowledge base doesn't have answers. This protocol should be followed EVERY TIME a query returns no results or low-confidence results.

---

## 📅 Version Awareness

**Current Date Context**: Always be aware of today's date. Mendix evolves rapidly.

| Mendix Version  | Release Date | Key Changes                      |
| --------------- | ------------ | -------------------------------- |
| Studio Pro 10.x | 2023-2024    | Major SDK changes, new APIs      |
| Studio Pro 11.x | 2024-2025    | Current version, latest patterns |

**ALWAYS verify information is for the correct Mendix version!**

---

## 🔍 Research Sources (In Priority Order)

### Tier 1: Official Sources (ALWAYS CHECK FIRST)

| Source               | URL                                                          | What to Find                      |
| -------------------- | ------------------------------------------------------------ | --------------------------------- |
| **Mendix Docs**      | https://docs.mendix.com/                                     | Official guides, API references   |
| **Model SDK API**    | https://apidocs.rnd.mendix.com/modelsdk/latest/index.html    | TypeScript interfaces, methods    |
| **Platform SDK API** | https://apidocs.rnd.mendix.com/platformsdk/latest/index.html | Working copies, commits, branches |
| **Mendix GitHub**    | https://github.com/mendix                                    | Official repos, examples          |

### Tier 2: Expert Sources

| Source                      | URL                           | What to Find                       |
| --------------------------- | ----------------------------- | ---------------------------------- |
| **Mendix Community**        | https://community.mendix.com/ | Expert answers, edge cases         |
| **Mendix Forum**            | https://forum.mendix.com/     | Troubleshooting, real-world issues |
| **Mendix Blog**             | https://www.mendix.com/blog/  | Best practices, announcements      |
| **LinkedIn Mendix Experts** | Search for Mendix MVPs        | Expert insights, patterns          |

### Tier 3: Code Sources (GOLD MINE!)

| Source                 | How to Search                        | What to Find                |
| ---------------------- | ------------------------------------ | --------------------------- |
| **GitHub Code Search** | `mendixmodelsdk language:typescript` | Real implementations        |
| **GitHub SDK Demo**    | https://github.com/mendix/sdk-demo   | Schema extraction patterns! |
| **npm dependents**     | `npm search mendixmodelsdk`          | Packages using the SDK      |
| **GitHub Topics**      | `topic:mendix`                       | Community projects          |

### Tier 4: Archive Sources (For Older Versions)

| Source              | URL                      | When to Use               |
| ------------------- | ------------------------ | ------------------------- |
| **Wayback Machine** | https://web.archive.org/ | Old docs, removed content |
| **Archive.ph**      | https://archive.ph/      | Preserved blog posts      |
| **Google Cache**    | `cache:url`              | Recently changed pages    |

### Tier 5: Video & Tutorial Sources

| Source             | How to Search               | What to Find        |
| ------------------ | --------------------------- | ------------------- |
| **YouTube**        | "Mendix SDK tutorial"       | Visual walkthroughs |
| **Mendix Academy** | https://academy.mendix.com/ | Official training   |
| **Udemy/Coursera** | Search "Mendix"             | Deep dives          |

---

## 🧠 Research Protocol Steps

### Step 1: Identify the Gap

```
Query: "How do I create a loop in a microflow with the SDK?"
Knowledge Base Result: No matches or low confidence

→ TRIGGER RESEARCH PROTOCOL
```

### Step 2: Formulate Search Queries

Create multiple search variations:

```
1. "mendix sdk microflow loop"
2. "mendixmodelsdk LoopedActivity"
3. "mendix platform sdk iterate list microflow"
4. "site:docs.mendix.com microflow loop sdk"
5. "site:github.com mendix sdk loop example"
```

### Step 3: Search All Tiers

Start with Tier 1, work down. For each source:

- Check date/version relevance
- Verify with official docs
- Cross-reference multiple sources

### Step 4: Validate Information

Before using any found information:

- [ ] Is it for the correct Mendix version?
- [ ] Does it match official API signatures?
- [ ] Has it been verified by multiple sources?
- [ ] Is the source credible?

### Step 5: Add to Knowledge Base

**ALWAYS** add validated findings:

```javascript
// Use the add_to_knowledge_base tool
{
  "knowledge_file": "model-sdk",  // or appropriate file
  "title": "Creating Loops in Microflows with SDK",
  "category": "microflows",
  "content": "Detailed explanation with code examples...",
  "keywords": ["loop", "iterate", "microflow", "LoopedActivity"],
  "source": "official",  // or "community" or "experience"
  "references": [
    "https://docs.mendix.com/...",
    "https://github.com/mendix/sdk-demo/..."
  ]
}
```

---

## 🎯 Key Research Patterns

### Pattern 1: SDK Class Discovery

When you don't know the right class:

```
1. Search Model SDK API docs for keywords
2. Check GitHub SDK Demo for examples
3. Search npm packages for usage patterns
4. Look at TypeScript definitions
```

### Pattern 2: Version Migration

When code doesn't work:

```
1. Check if API changed between versions
2. Search for deprecation notices
3. Look at CHANGELOG files
4. Check Wayback Machine for old docs
```

### Pattern 3: Real-World Examples

When docs are unclear:

```
1. Search GitHub for "mendixmodelsdk [class name]"
2. Look at test files in official repos
3. Check community forum for working examples
4. Search Stack Overflow
```

---

## 🚨 Critical SDK Knowledge Sources

### The SDK Demo Repository

**URL**: https://github.com/mendix/sdk-demo

This repo contains:

- Schema extraction patterns
- Working copy management
- Model traversal examples
- Real commit workflows

**ALWAYS CHECK THIS FIRST FOR SDK QUESTIONS!**

### NPM Package Analysis

```bash
# Find packages that use the Mendix SDK
npm search mendixmodelsdk
npm search mendixplatformsdk

# Check their source code for patterns
```

### GitHub Code Search Queries

```
# Find microflow creation examples
"new microflows.Microflow" language:typescript

# Find domain model patterns
"domainmodels.Entity" language:typescript

# Find commit patterns
"workingCopy.commit" language:typescript
```

---

## 📝 Research Result Template

When documenting research findings:

```markdown
## Research: [Topic]

**Date**: YYYY-MM-DD
**Mendix Version**: X.X.X
**Confidence**: High/Medium/Low

### Question

[Original query]

### Findings

[Detailed answer with code examples]

### Sources

1. [Source 1 with URL]
2. [Source 2 with URL]

### Verification

- [ ] Tested in Studio Pro
- [ ] Matches API docs
- [ ] Multiple source confirmation

### Added to Knowledge Base

- File: [knowledge file]
- Entry ID: [id]
```

---

## 🤖 For AI Assistants

When using this MCP server, if you receive:

- **No results** → Trigger full research protocol
- **Low confidence results** → Verify and supplement with research
- **Outdated information** → Research current best practices

**Your job is to make this knowledge base GROW with every interaction!**

### Auto-Learning Checklist

After every research session:

- [ ] Did I find new information?
- [ ] Did I add it to the knowledge base?
- [ ] Did I cite my sources?
- [ ] Is it tagged with the correct version?
- [ ] Will it help the next person with this question?

---

## 🔗 Quick Reference Links

```
OFFICIAL DOCS:       https://docs.mendix.com/
MODEL SDK API:       https://apidocs.rnd.mendix.com/modelsdk/latest/
PLATFORM SDK API:    https://apidocs.rnd.mendix.com/platformsdk/latest/
SDK DEMO REPO:       https://github.com/mendix/sdk-demo
COMMUNITY FORUM:     https://community.mendix.com/
GITHUB MENDIX:       https://github.com/mendix
NPM SEARCH:          https://www.npmjs.com/search?q=mendix
WAYBACK MACHINE:     https://web.archive.org/
```

---

_This protocol ensures the mendix-expert knowledge base continuously improves through rigorous, validated research._
