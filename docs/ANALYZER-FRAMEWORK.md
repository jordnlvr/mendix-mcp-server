# Mendix Analyzer Framework

Build custom analysis tools for the Mendix MCP Server.

## Overview

The analyzer framework allows you to create deep analysis tools that:

- Examine specific aspects of Mendix projects
- Score against best practices with weighted categories
- Return letter grades (A+ to F) with actionable recommendations
- Integrate with both MCP tools and REST API

## Architecture

```
src/analyzers/
├── ThemeAnalyzer.js       # Reference implementation
├── [YourAnalyzer].js      # Your custom analyzer
└── index.js               # Exports all analyzers

knowledge/
├── theme-analysis.json    # Theme best practices
└── [your-topic].json      # Your analyzer's knowledge base
```

## Creating an Analyzer

### Step 1: Define Your Analysis Categories

Every analyzer needs weighted scoring categories. Example from ThemeAnalyzer:

```javascript
const CATEGORY_WEIGHTS = {
  fileStructure: 0.15, // 15% - Proper organization
  naming: 0.2, // 20% - BEM, prefixes, consistency
  variables: 0.2, // 20% - Design tokens, SCSS vars
  theming: 0.15, // 15% - Atlas UI integration
  maintainability: 0.15, // 15% - Documentation, modularity
  performance: 0.15, // 15% - Selector efficiency
};
// Weights must sum to 1.0
```

### Step 2: Create the Analyzer Class

```javascript
// src/analyzers/MicroflowAnalyzer.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load knowledge base
const knowledgePath = path.join(__dirname, '../../knowledge/microflow-analysis.json');
const BEST_PRACTICES = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));

const CATEGORY_WEIGHTS = {
  complexity: 0.2,
  naming: 0.2,
  errorHandling: 0.2,
  performance: 0.15,
  security: 0.15,
  documentation: 0.1,
};

export class MicroflowAnalyzer {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.mendixVersion = options.mendixVersion || this.detectVersion();
    this.issues = [];
    this.scores = {};
  }

  detectVersion() {
    // Check .mpr file or project settings for version
    // Return '10' or '11'
    return '11';
  }

  async analyze() {
    // Initialize scores
    for (const category of Object.keys(CATEGORY_WEIGHTS)) {
      this.scores[category] = 100; // Start perfect, deduct points
    }

    // Run analysis methods
    await this.analyzeComplexity();
    await this.analyzeNaming();
    await this.analyzeErrorHandling();
    await this.analyzePerformance();
    await this.analyzeSecurity();
    await this.analyzeDocumentation();

    // Calculate final score
    return this.buildReport();
  }

  async analyzeComplexity() {
    // Example: Check microflow action counts
    const microflows = await this.findMicroflows();

    for (const mf of microflows) {
      const actionCount = mf.actions?.length || 0;

      if (actionCount > 50) {
        this.addIssue(
          'critical',
          'complexity',
          `Microflow "${mf.name}" has ${actionCount} actions - consider splitting`,
          mf.file,
          null,
          'Break into sub-microflows for maintainability'
        );
        this.scores.complexity -= 10;
      } else if (actionCount > 25) {
        this.addIssue(
          'warning',
          'complexity',
          `Microflow "${mf.name}" is getting complex (${actionCount} actions)`,
          mf.file,
          null,
          'Consider extracting reusable sub-microflows'
        );
        this.scores.complexity -= 5;
      }
    }
  }

  // ... implement other analysis methods ...

  addIssue(severity, category, message, file, line, suggestion) {
    this.issues.push({ severity, category, message, file, line, suggestion });
  }

  calculateFinalGrade() {
    let totalScore = 0;
    for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
      const score = Math.max(0, Math.min(100, this.scores[category]));
      totalScore += score * weight;
    }

    const score = Math.round(totalScore);

    // Grade mapping
    if (score >= 97) return { grade: 'A+', score };
    if (score >= 93) return { grade: 'A', score };
    if (score >= 90) return { grade: 'A-', score };
    if (score >= 87) return { grade: 'B+', score };
    if (score >= 83) return { grade: 'B', score };
    if (score >= 80) return { grade: 'B-', score };
    if (score >= 77) return { grade: 'C+', score };
    if (score >= 73) return { grade: 'C', score };
    if (score >= 70) return { grade: 'C-', score };
    if (score >= 67) return { grade: 'D+', score };
    if (score >= 63) return { grade: 'D', score };
    if (score >= 60) return { grade: 'D-', score };
    return { grade: 'F', score };
  }

  buildReport() {
    const { grade, score } = this.calculateFinalGrade();

    return {
      grade,
      score,
      categoryScores: { ...this.scores },
      issues: this.issues,
      recommendations: this.generateRecommendations(),
      mendixVersion: this.mendixVersion,
      itemsAnalyzed: this.itemsAnalyzed || 0,
    };
  }

  generateRecommendations() {
    const recs = [];

    // Priority order: critical issues first
    const criticalCount = this.issues.filter((i) => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recs.push(`🚨 Address ${criticalCount} critical issues first`);
    }

    // Category-specific recommendations
    if (this.scores.complexity < 80) {
      recs.push('Consider microflow decomposition patterns');
    }
    if (this.scores.errorHandling < 80) {
      recs.push('Add try-catch blocks and custom error pages');
    }

    return recs;
  }
}
```

### Step 3: Create the Knowledge Base

```json
// knowledge/microflow-analysis.json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2025-01-15",
    "description": "Best practices for Mendix microflow development"
  },
  "rules": {
    "complexity": {
      "maxActions": 25,
      "warningThreshold": 20,
      "description": "Microflows should be focused and single-purpose"
    },
    "naming": {
      "prefixes": {
        "ACT_": "User action microflows",
        "DS_": "Data source microflows",
        "SUB_": "Sub-microflows",
        "VAL_": "Validation microflows",
        "BCO_": "Before commit microflows",
        "ACO_": "After commit microflows",
        "ASU_": "After startup microflows"
      }
    },
    "errorHandling": {
      "requiresCatchBlock": ["integration calls", "file operations"],
      "customErrorPage": true
    }
  },
  "versionSpecific": {
    "10": {
      "features": ["workflow integration", "ML model calls"]
    },
    "11": {
      "features": ["enhanced parallel execution", "improved logging"]
    }
  }
}
```

### Step 4: Add MCP Tool

In `src/index.js`, add the tool definition:

```javascript
import { MicroflowAnalyzer } from './analyzers/MicroflowAnalyzer.js';

// In the tools array:
{
  name: 'analyze_microflows',
  description: 'Analyze Mendix microflows for complexity, naming, error handling, and best practices',
  inputSchema: {
    type: 'object',
    properties: {
      project_path: {
        type: 'string',
        description: 'Path to Mendix project directory',
      },
      mendix_version: {
        type: 'string',
        enum: ['10', '11'],
        description: 'Mendix version (auto-detected if not specified)',
      },
      module_name: {
        type: 'string',
        description: 'Specific module to analyze (optional)',
      },
    },
    required: ['project_path'],
  },
}

// In the tool handler:
case 'analyze_microflows': {
  const analyzer = new MicroflowAnalyzer(args.project_path, {
    mendixVersion: args.mendix_version,
    moduleName: args.module_name,
  });

  const result = await analyzer.analyze();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2),
    }],
  };
}
```

### Step 5: Add REST Endpoint

In `src/rest-proxy.js`:

```javascript
import { MicroflowAnalyzer } from './analyzers/MicroflowAnalyzer.js';

// Add to tools list
{
  name: 'analyze-microflows',
  method: 'POST',
  path: '/analyze-microflows',
  description: 'Analyze microflows for best practices',
  parameters: {
    project_path: 'string (required)',
    mendix_version: 'string (optional)',
    module_name: 'string (optional)',
  },
}

// Add endpoint
app.post('/analyze-microflows', async (req, res) => {
  try {
    const { project_path, mendix_version, module_name } = req.body;

    if (!project_path) {
      return res.status(400).json({ error: 'project_path is required' });
    }

    const analyzer = new MicroflowAnalyzer(project_path, {
      mendixVersion: mendix_version,
      moduleName: module_name,
    });

    const result = await analyzer.analyze();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 6: Update OpenAPI Spec

Add the endpoint to `openapi.json` for ChatGPT integration.

## Analyzer Ideas

| Analyzer                | Categories                                                              | What It Checks                                                            |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **MicroflowAnalyzer**   | complexity, naming, errorHandling, performance, security, documentation | Action count, naming conventions, try-catch usage, N+1 queries, XSS risks |
| **SecurityAnalyzer**    | authentication, authorization, dataAccess, inputValidation, encryption  | Access rules, XPath constraints, entity access, password policies         |
| **PageAnalyzer**        | structure, responsiveness, accessibility, performance, usability        | Widget nesting, mobile optimization, ARIA labels, lazy loading            |
| **DomainModelAnalyzer** | normalization, associations, inheritance, indexes, naming               | Redundant data, association types, calculated attributes, index coverage  |
| **IntegrationAnalyzer** | restConfig, errorHandling, security, performance, versioning            | Timeout settings, retry logic, API key handling, rate limiting            |
| **PerformanceAnalyzer** | queries, microflows, pages, caching, indexes                            | Large retrievals, synchronous calls, widget count, cache headers          |

## Best Practices for Analyzers

### 1. Start with 100, Deduct Points

```javascript
this.scores[category] = 100;
// Deduct for issues found
this.scores[category] -= severityPoints[issue.severity];
```

### 2. Use Severity Levels Consistently

- **critical** (-10 points): Security vulnerabilities, data loss risks
- **warning** (-5 points): Performance issues, maintainability concerns
- **info** (-1 point): Style suggestions, minor improvements

### 3. Always Provide Actionable Suggestions

```javascript
this.addIssue(
  'warning',
  'naming',
  'Microflow "DoStuff" lacks prefix',
  'Module/DoStuff',
  null,
  'Rename to ACT_DoStuff or SUB_DoStuff based on usage'
);
```

### 4. Support Version-Specific Rules

```javascript
if (this.mendixVersion === '11') {
  // Check for Mendix 11-specific patterns
} else {
  // Mendix 10 patterns
}
```

### 5. Load Best Practices from JSON

Keep rules in knowledge files so they can be updated without code changes.

## Testing Your Analyzer

```javascript
// test/MicroflowAnalyzer.test.js
import { MicroflowAnalyzer } from '../src/analyzers/MicroflowAnalyzer.js';

describe('MicroflowAnalyzer', () => {
  it('should detect complex microflows', async () => {
    const analyzer = new MicroflowAnalyzer('./test/fixtures/complex-project');
    const result = await analyzer.analyze();

    expect(result.grade).toBeDefined();
    expect(result.issues.some((i) => i.category === 'complexity')).toBe(true);
  });
});
```

## Contributing

1. Create your analyzer in `src/analyzers/`
2. Add knowledge base in `knowledge/`
3. Add MCP tool in `src/index.js`
4. Add REST endpoint in `src/rest-proxy.js`
5. Update OpenAPI spec
6. Add tests
7. Submit PR!

---

_Reference implementation: `src/analyzers/ThemeAnalyzer.js`_
