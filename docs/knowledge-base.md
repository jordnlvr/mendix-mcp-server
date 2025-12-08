---
layout: default
title: Knowledge Base
nav_order: 5
---

# Knowledge Base

The knowledge base is the "brain" of the Mendix Expert server. It contains curated, structured information about Mendix development.

## Structure

```
knowledge/
├── best-practices.json      # Coding patterns, guidelines
├── studio-pro.json          # Studio Pro features, UI
├── model-sdk.json           # Model SDK programming
├── platform-sdk.json        # Platform SDK operations
├── troubleshooting.json     # Common issues, solutions
├── advanced-patterns.json   # Complex techniques
├── performance-guide.json   # Optimization strategies
├── security-guide.json      # Security best practices
└── harvested-*.json         # Auto-crawled content
```

## Entry Format

Every knowledge entry follows this structure:

```json
{
  "title": "Loop Pattern for Microflows",
  "description": "How to iterate over lists in microflows",
  "content": "Detailed explanation...",
  "when_to_use": "When you need to process items one by one",
  "best_practices": ["Use IterableList on loopSource", "Avoid deprecated loopVariableName"],
  "examples": [
    {
      "description": "Basic loop",
      "code": "loopAction.loopSource = new microflows.IterableList(...);"
    }
  ],
  "related_topics": ["microflows", "lists", "iteration"],
  "mendix_version": "10.0+",
  "_metadata": {
    "id": "abc123",
    "added": "2024-01-15T10:30:00Z",
    "source": "docs.mendix.com",
    "quality_score": 0.95,
    "verified": true
  }
}
```

## Content Categories

### Best Practices (`best-practices.json`)

Coding patterns and guidelines:

- Microflow design patterns
- Error handling strategies
- Naming conventions
- Performance optimization
- Code organization

### Studio Pro (`studio-pro.json`)

Studio Pro features and usage:

- UI element configuration
- Modeling techniques
- Version-specific features
- Keyboard shortcuts
- Pro tips

### Model SDK (`model-sdk.json`)

SDK programming patterns:

- Creating/modifying elements
- Navigation patterns
- Working with transactions
- Common pitfalls
- Real-world examples

### Platform SDK (`platform-sdk.json`)

Platform operations:

- Creating apps
- Working copies
- Branch management
- Deployment operations
- Team Server integration

### Troubleshooting (`troubleshooting.json`)

Common issues and fixes:

- Error messages explained
- Known bugs/workarounds
- Migration issues
- Performance problems

### Harvested Content (`harvested-*.json`)

Auto-crawled from official sources:

- Release notes (10.x, 11.x)
- Documentation updates
- New feature announcements
- API changes

## Quality Scoring

Every entry is automatically scored on:

| Factor         | Weight | Description                 |
| -------------- | ------ | --------------------------- |
| Completeness   | 30%    | Has all relevant fields     |
| Source quality | 25%    | Official docs score higher  |
| Verification   | 20%    | Manually verified entries   |
| Freshness      | 15%    | Recent updates preferred    |
| Usage          | 10%    | Frequently accessed entries |

**Thresholds:**

- `>= 0.8` - High quality, trusted
- `0.5 - 0.8` - Good quality
- `< 0.5` - May need review

## Coverage Statistics

Current knowledge base metrics:

| Category        | Entries | Coverage          |
| --------------- | ------- | ----------------- |
| Best Practices  | ~50     | Core patterns     |
| Studio Pro      | ~40     | Major features    |
| Model SDK       | ~60     | Common operations |
| Platform SDK    | ~30     | Key operations    |
| Troubleshooting | ~25     | Common issues     |
| Harvested       | ~100+   | Auto-updated      |

**Total:** 300+ curated entries + 318 vector embeddings

## Knowledge Gaps

The system tracks "missed queries" - searches that returned no results. These indicate knowledge gaps to fill.

View gaps:

```
@mendix-expert hello
# Shows recent missed queries in analytics
```

Common gaps are automatically added to the harvest priority list.

## Validation

The knowledge base is automatically validated:

- **Syntax errors** - Invalid JSON
- **Missing required fields** - No title or description
- **Staleness** - Not updated in 6+ months
- **Duplicates** - Similar entries detected
- **Broken references** - Invalid cross-references

Run manual validation:

```
@mendix-expert Check the knowledge validation report
# Returns mendix://validation/report
```

## Adding Knowledge

### Manual Addition

```
@mendix-expert add_to_knowledge_base
  knowledge_file="best-practices"
  category="microflows"
  content='{
    "title": "My Pattern",
    "description": "How to do X",
    "when_to_use": "When you need Y"
  }'
  source="discovered through research"
```

### Auto-Learning

When Beast Mode research discovers new information, the AI is instructed to save it:

```
I found this pattern in the SDK demos:
[Pattern details]

Let me save this to the knowledge base...
@mendix-expert add_to_knowledge_base ...
```

### Harvesting

Weekly automatic harvests add fresh content from:

- docs.mendix.com
- Release notes
- API documentation

## Keeping It Current

| Mechanism       | Frequency     | What It Does         |
| --------------- | ------------- | -------------------- |
| Auto-Harvest    | Weekly        | Crawls official docs |
| Self-Learning   | On-demand     | Saves discoveries    |
| Validation      | Daily         | Flags issues         |
| Vector Re-index | After changes | Updates embeddings   |

---

[← Back to Tools](tools) | [Next: Self-Learning →](self-learning)
