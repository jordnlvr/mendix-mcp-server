---
layout: default
title: Beast Mode
---

# 🔥 Beast Mode

Beast Mode is an **exhaustive research protocol** that ensures AI assistants never give up when searching for Mendix answers.

## What Is Beast Mode?

When enabled, Beast Mode mandates a 6-tier exhaustive search before the AI says "I don't know":

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEAST MODE RESEARCH PROTOCOL                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIER 1: Official Documentation                                      │
│  ├── docs.mendix.com (reference guide, how-to)                      │
│  ├── API references                                                  │
│  └── Release notes                                                   │
│                                                                      │
│  TIER 2: GitHub Code Search                                         │
│  ├── mendix/sdk-demo (THE GOLD MINE!)                               │
│  ├── mendixlabs/* repositories                                      │
│  └── Public implementations                                          │
│                                                                      │
│  TIER 3: npm Package Analysis                                       │
│  ├── Packages depending on mendixmodelsdk                           │
│  ├── Real-world implementations                                      │
│  └── Published tools and utilities                                   │
│                                                                      │
│  TIER 4: Community Sources                                          │
│  ├── community.mendix.com                                           │
│  ├── Stack Overflow [mendix] tag                                    │
│  └── Mendix World presentations                                      │
│                                                                      │
│  TIER 5: Archives & History                                         │
│  ├── web.archive.org/web/*/docs.mendix.com/*                        │
│  ├── Old documentation versions                                      │
│  └── Deprecated but still useful patterns                           │
│                                                                      │
│  TIER 6: Obscure Sources                                            │
│  ├── Gist searches                                                   │
│  ├── Blog posts                                                      │
│  └── YouTube tutorials (transcripts)                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Activating Beast Mode

### Method 1: Get the Full Prompt

```
@mendix-expert beast_mode format="full"
```

This returns a copy-paste ready prompt you can use in **any** AI chat:

```markdown
# 🔥 BEAST MODE: Exhaustive Mendix Research Protocol

You are now in BEAST MODE for Mendix SDK research...
[Full protocol with specific URLs, search patterns, etc.]
```

### Method 2: Brief Summary

```
@mendix-expert beast_mode format="brief"
```

Returns a condensed version for quick reference.

### Method 3: Instructions Only

```
@mendix-expert beast_mode format="instructions"
```

Explains what Beast Mode is without the full prompt.

## Key Gold Mine Sources

These are the most valuable sources Beast Mode searches:

### 🥇 mendix/sdk-demo Repository

```
github.com/mendix/sdk-demo
```

**Why it's gold:**

- Official Mendix examples
- Schema extraction patterns
- Real working code
- Up-to-date with SDK changes

**Search pattern:**

```
site:github.com/mendix/sdk-demo [your topic]
```

### 🥈 npm Package Search

```
npm search mendixmodelsdk
```

**Why it's valuable:**

- Real-world implementations
- Published, tested code
- Often includes documentation

### 🥉 Web Archive

```
web.archive.org/web/*/docs.mendix.com/*
```

**Why it matters:**

- Old documentation often removed
- Migration patterns
- Historical context

## Beast Mode Rules

When Beast Mode is active, the AI follows these rules:

### 1. Never Give Up Early

❌ "I couldn't find information about that"

✅ "After searching Tier 1-3, I found partial information. Let me check Tier 4-6..."

### 2. Version Awareness

Always verify Mendix version compatibility:

- 7.x - Legacy patterns
- 8.x - Modern but dated
- 9.x - Workflow introduction
- 10.x - Page variables, Maia
- 11.x - Current, latest patterns

### 3. Auto-Learning

After discovering information:

```
Found the answer! Let me save this to the knowledge base...
@mendix-expert add_to_knowledge_base ...
```

### 4. Source Attribution

Always cite where information came from:

```
Source: github.com/mendix/sdk-demo/blob/main/...
Verified working with Mendix 11.x
```

## Beast Mode Search Patterns

### For SDK Questions

```
# GitHub
site:github.com mendixmodelsdk [your topic]
site:github.com/mendix/sdk-demo [your topic]

# npm
npm search mendix [topic]
npm info [package-name]

# Docs
site:docs.mendix.com/apidocs-mxsdk [topic]
```

### For Studio Pro Questions

```
# Official docs
site:docs.mendix.com/refguide [topic]
site:docs.mendix.com/howto [topic]

# Community
site:community.mendix.com [topic]
site:stackoverflow.com/questions/tagged/mendix [topic]
```

### For Widget Questions

```
# Marketplace
site:marketplace.mendix.com [widget type]

# GitHub
site:github.com pluggable widget mendix [topic]
site:github.com/mendix/widgets [topic]
```

## Example Beast Mode Session

````
User: How do I create a custom Java action parameter type in the SDK?

AI: [Beast Mode Activated]

    TIER 1 - Official Docs:
    Searching docs.mendix.com/apidocs-mxsdk...
    Found: General Java action docs, but no parameter type details.

    TIER 2 - GitHub:
    Searching github.com/mendix/sdk-demo...
    Found: java-action-example.ts with parameter patterns!

    ```typescript
    const param = javaActions.JavaActionParameter.createIn(action);
    param.type = javaActions.createJavaActionParameterType(model);
    param.type.type = javaActions.JavaActionParameterTypeEnum.Entity;
    ```

    TIER 3 - npm:
    Checking packages using mendixmodelsdk...
    Found: mendix-cli has similar patterns.

    ✅ Answer found in Tier 2!

    Saving to knowledge base...
    @mendix-expert add_to_knowledge_base knowledge_file="model-sdk" ...
````

## When to Use Beast Mode

### Perfect For:

- SDK programming questions
- Obscure or advanced features
- Version-specific behaviors
- Error messages with no obvious solution
- "How do they do X in the SDK?" questions

### Overkill For:

- Basic "what is" questions
- Well-documented features
- Questions already in knowledge base

## Beast Mode vs Regular Search

| Aspect     | Regular Search      | Beast Mode               |
| ---------- | ------------------- | ------------------------ |
| Speed      | Fast (~500ms)       | Thorough (minutes)       |
| Depth      | Knowledge base only | 6 external tiers         |
| Auto-learn | On add only         | Always saves discoveries |
| Best for   | Known topics        | Unknown/complex topics   |

---

[← Back to Self-Learning](self-learning) | [Next: Maintenance →](maintenance)
