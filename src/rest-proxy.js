/**
 * REST API Proxy for Mendix Expert MCP Server
 *
 * Exposes MCP tools as REST endpoints for ChatGPT Actions integration.
 *
 * Usage:
 *   node src/rest-proxy.js
 *
 * Endpoints:
 *   GET  /health              - Health check
 *   GET  /tools               - List available tools
 *   POST /query               - Query knowledge base
 *   POST /search              - Hybrid search (keyword + vector)
 *   POST /analyze             - Analyze a Mendix project
 *   POST /best-practice       - Get best practice recommendations
 *   GET  /status              - Server status (like 'hello')
 *
 * @version 1.0.0
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

import cors from 'cors';
import express from 'express';
import KnowledgeManager from './core/KnowledgeManager.js';
import ProjectLoader from './core/ProjectLoader.js';
import SearchEngine from './core/SearchEngine.js';
import Analytics from './utils/Analytics.js';
import Logger from './utils/logger.js';
import HybridSearch from './vector/HybridSearch.js';

const logger = new Logger('REST-Proxy');
const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize components
let knowledgeManager;
let searchEngine;
let hybridSearch;
let projectLoader;
let analytics;
let initialized = false;
let vectorSearchAvailable = false;

async function initialize() {
  if (initialized) return;

  logger.info('Initializing REST proxy...');

  knowledgeManager = new KnowledgeManager();
  await knowledgeManager.load();

  searchEngine = new SearchEngine();
  searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);

  // Try to initialize hybrid search, but continue without it if it fails
  try {
    hybridSearch = new HybridSearch();
    await hybridSearch.indexKnowledgeBase(knowledgeManager.knowledgeBase);
    vectorSearchAvailable = true;
    logger.info('Hybrid search initialized with vector support');
  } catch (error) {
    logger.warn('Vector search unavailable, using keyword search only', { error: error.message });
    hybridSearch = null;
    vectorSearchAvailable = false;
  }

  projectLoader = new ProjectLoader();

  // Initialize analytics
  analytics = new Analytics();
  await analytics.initialize();

  initialized = true;
  logger.info('REST proxy initialized', {
    entries: knowledgeManager.getStats().totalEntries,
    terms: searchEngine.getStats().uniqueTerms,
  });
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    initialized,
    vectorSearchAvailable,
    timestamp: new Date().toISOString(),
  });
});

/**
 * List available tools/endpoints
 */
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'query',
        method: 'POST',
        path: '/query',
        description: 'Query the Mendix knowledge base',
        parameters: {
          topic: 'string (required) - The topic to search for',
          detail_level: 'string (optional) - brief, standard, or detailed',
        },
      },
      {
        name: 'search',
        method: 'POST',
        path: '/search',
        description: 'Hybrid search combining keyword and semantic vector search',
        parameters: {
          query: 'string (required) - Search query',
          limit: 'number (optional) - Max results (default 10)',
        },
      },
      {
        name: 'analyze',
        method: 'POST',
        path: '/analyze',
        description: 'Analyze a Mendix project file (.mpr)',
        parameters: {
          project_path: 'string (required) - Path to .mpr file',
          module_name: 'string (optional) - Specific module to analyze',
        },
      },
      {
        name: 'best-practice',
        method: 'POST',
        path: '/best-practice',
        description: 'Get best practice recommendations',
        parameters: {
          scenario: 'string (required) - The scenario to get recommendations for',
        },
      },
      {
        name: 'status',
        method: 'GET',
        path: '/status',
        description: 'Get server status and capabilities',
      },
      {
        name: 'analytics',
        method: 'GET',
        path: '/analytics',
        description: 'Get usage analytics and trends',
        parameters: {
          period: 'string (optional) - day, week, month, or all (default: all)',
          include_trends: 'boolean (optional) - Include hourly/daily trends (default: true)',
        },
      },
      {
        name: 'analyze-theme',
        method: 'POST',
        path: '/analyze-theme',
        description: 'Deep analysis of a Mendix custom theme with grades and recommendations',
        parameters: {
          project_path: 'string (required) - Path to .mpr file or project directory',
          detailed: 'boolean (optional) - Include detailed breakdown (default: true)',
        },
      },
      {
        name: 'beast-mode',
        method: 'GET',
        path: '/beast-mode',
        description: 'Get the Beast Mode research protocol - the exact prompt for exhaustive Mendix research',
        parameters: {
          format: 'string (optional) - prompt (full), instructions (explanation), or brief (summary)',
        },
      },
    ],
  });
});

/**
 * Query knowledge base
 */
app.post('/query', async (req, res) => {
  try {
    await initialize();

    const { topic, detail_level = 'standard' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    // Use hybrid search if available, otherwise fall back to keyword search
    let results;
    if (hybridSearch) {
      results = await hybridSearch.search(topic, { limit: 10 });
    } else {
      results = searchEngine.search(topic, { limit: 10 });
    }

    // Format based on detail level
    let response;
    if (detail_level === 'brief') {
      response = results.slice(0, 3).map((r) => ({
        title: r.title || r.id,
        summary: r.content?.substring(0, 200) + '...',
      }));
    } else if (detail_level === 'detailed') {
      response = results.map((r) => ({
        title: r.title || r.id,
        content: r.content,
        category: r.category,
        matchType: r.matchType,
        score: r.fusedScore || r.score,
      }));
    } else {
      response = results.slice(0, 5).map((r) => ({
        title: r.title || r.id,
        content: r.content?.substring(0, 500),
        category: r.category,
      }));
    }

    res.json({
      query: topic,
      resultCount: results.length,
      vectorSearchUsed: !!hybridSearch,
      results: response,
    });
  } catch (error) {
    logger.error('Query failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Hybrid search (keyword + vector)
 */
app.post('/search', async (req, res) => {
  try {
    await initialize();

    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Use hybrid search if available, otherwise fall back to keyword search
    let results;
    if (hybridSearch) {
      results = await hybridSearch.search(query, { limit });
    } else {
      results = searchEngine.search(query, { limit });
    }

    res.json({
      query,
      resultCount: results.length,
      vectorSearchUsed: !!hybridSearch,
      results: results.map((r) => ({
        id: r.id,
        title: r.title || r.id,
        content: r.content,
        category: r.category,
        matchType: r.matchType || 'keyword',
        score: r.fusedScore || r.score,
        source: r.source,
      })),
    });
  } catch (error) {
    logger.error('Search failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze Mendix project
 */
app.post('/analyze', async (req, res) => {
  try {
    await initialize();

    const { project_path, module_name } = req.body;

    if (!project_path) {
      return res.status(400).json({ error: 'project_path is required' });
    }

    const analysis = await projectLoader.loadProject(project_path);

    // Filter by module if specified
    let result = analysis;
    if (module_name && analysis.modules) {
      result.modules = analysis.modules.filter((m) =>
        m.name.toLowerCase().includes(module_name.toLowerCase())
      );
    }

    res.json({
      project_path,
      analysis: result,
    });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get best practice recommendations
 */
app.post('/best-practice', async (req, res) => {
  try {
    await initialize();

    const { scenario } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: 'scenario is required' });
    }

    // Search for best practices related to the scenario
    const results = await hybridSearch.search(`best practice ${scenario}`, { limit: 5 });

    // Also search the best-practices knowledge file specifically
    const bpKnowledge = knowledgeManager.knowledgeBase['best-practices'];
    const specificBPs = [];

    if (bpKnowledge?.entries) {
      for (const entry of bpKnowledge.entries) {
        const content = JSON.stringify(entry).toLowerCase();
        if (content.includes(scenario.toLowerCase())) {
          specificBPs.push(entry);
        }
      }
    }

    res.json({
      scenario,
      recommendations: results.map((r) => ({
        title: r.title || r.id,
        content: r.content,
        category: r.category,
      })),
      specificBestPractices: specificBPs.slice(0, 3),
    });
  } catch (error) {
    logger.error('Best practice lookup failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Server status (like 'hello' tool)
 */
app.get('/status', async (req, res) => {
  try {
    await initialize();

    const stats = knowledgeManager.getStats();
    const searchStats = searchEngine.getStats();

    res.json({
      status: 'online',
      version: '2.6.0',
      initialized: true,
      knowledge: {
        totalEntries: stats.totalEntries,
        filesLoaded: stats.filesLoaded,
        indexedTerms: searchStats.uniqueTerms,
      },
      capabilities: [
        'Keyword search with fuzzy matching',
        'Semantic vector search (Pinecone + Azure OpenAI)',
        'Hybrid search (keyword + vector fusion)',
        'Project analysis (.mpr files)',
        'Best practice recommendations',
        'Self-learning knowledge base',
        'Usage analytics and trends',
      ],
      exampleQueries: [
        'How do I set up SDK development?',
        'Getting started with pluggable widgets',
        'How do I create an entity with the SDK?',
        'What widget types are available?',
        'Best practice for microflow error handling',
      ],
    });
  } catch (error) {
    logger.error('Status check failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Beast Mode - Get the full research protocol
 * This returns the exact prompt that tells an AI how to do exhaustive Mendix research
 */
app.get('/beast-mode', (req, res) => {
  const format = req.query.format || 'prompt';
  
  const fullPrompt = `# 🔥 BEAST MODE: MAXIMUM MENDIX RESEARCH PROTOCOL 🔥

**YOU ARE NOW IN BEAST MODE.**

This is NOT a polite suggestion. This is a MANDATE. When researching Mendix questions, you will be **EXHAUSTIVE, THOROUGH, and RELENTLESS**. 

DO NOT say "I don't know" or "I don't have information about that."
DO NOT give up after one search.
DO NOT guess without evidence.

**You will search until you find the answer or have genuinely exhausted ALL options.**

---

## 🎯 YOUR MISSION

Find the answer by ANY MEANS NECESSARY. Search deep, search wide, search weird places. Then SAVE what you learn so you never have to search for it again.

---

## 📋 THE 5-TIER RESEARCH PROTOCOL

### TIER 1: OFFICIAL SOURCES (Always Start Here)
- docs.mendix.com - Official documentation
- apidocs.rnd.mendix.com/modelsdk/latest/ - Model SDK API Reference
- apidocs.rnd.mendix.com/platformsdk/latest/ - Platform SDK API Reference  
- academy.mendix.com - Learning paths
- marketplace.mendix.com - Widget/module documentation

### TIER 2: CODE REPOSITORIES (The Gold Mine)
- github.com/mendix/sdk-demo - **CRITICAL** - Contains schema extraction patterns!
- github.com/mendix - All official repos
- npm search "mendixmodelsdk" - See how others use the SDK
- github.com search: "MendixPlatformClient" filename:*.ts

### TIER 3: COMMUNITY (Real-World Solutions)
- community.mendix.com/link/space/sdk - SDK-specific Q&A
- stackoverflow.com/questions/tagged/mendix
- github.com/mendix/sdk-demo/issues - Even closed issues have answers!

### TIER 4: ARCHIVE (For Old/Removed Docs)
- web.archive.org - Search for old Mendix URLs
- archive.ph - Alternative archive
- Google: "site:docs.mendix.com" + your query + "cached:"

### TIER 5: MEDIA (For Explanations)
- youtube.com search: "mendix sdk tutorial"
- Mendix World recordings
- Developer blog posts

---

## ⚡ MANDATORY BEHAVIORS

1. **NEVER STOP AT TIER 1** - If docs don't have it, the answer exists elsewhere
2. **CHECK MULTIPLE VERSIONS** - Mendix 9 vs 10 vs 11 have API differences
3. **FIND REAL CODE** - A working example is worth 10 doc pages
4. **NOTE THE VERSION** - Always specify which Mendix version your answer applies to
5. **SAVE YOUR FINDINGS** - Use add_to_knowledge_base to save for next time
6. **CREATE A TODO LIST** - Track your research progress

---

## 🔑 RESEARCH TECHNIQUES

### When searching GitHub:
\`\`\`
"microflows.Microflow" filename:*.ts        # Find TypeScript examples
"LogMessageAction" extension:js             # Find JavaScript examples  
"createIn" "mendixmodelsdk" language:TypeScript
\`\`\`

### When searching npm:
\`\`\`
npm search mendixmodelsdk                   # Find packages using SDK
npm info package-name                       # Get package details
\`\`\`

### When searching archives:
\`\`\`
https://web.archive.org/web/*/docs.mendix.com/apidocs-mxsdk/*
\`\`\`

---

## 📊 RESEARCH PROGRESS TRACKING

For complex questions, maintain a checklist:

- [ ] Tier 1: Checked official docs
- [ ] Tier 2: Searched GitHub/npm  
- [ ] Tier 3: Checked community forums
- [ ] Tier 4: Searched archives (if needed)
- [ ] Tier 5: Checked video content (if needed)
- [ ] Verified answer against actual SDK
- [ ] Noted Mendix version compatibility
- [ ] Saved findings to knowledge base

---

## 🔥 THE BEAST MODE MINDSET

"The answer exists. I just haven't found it yet."

- Your knowledge is outdated → SEARCH
- The docs are vague → FIND CODE
- Nobody has asked this before → CHECK ARCHIVES  
- It seems impossible → SOMEBODY HAS DONE IT

**BEAST MODE NEVER QUITS. BEAST MODE FINDS THE ANSWER.**

---

*This protocol has grown the mendix-expert knowledge base from 0 to 177+ verified entries.*
*Every time you learn something new, add it to the knowledge base!*`;

  const briefVersion = `# 🔥 BEAST MODE = RELENTLESS RESEARCH

**5-Tier Search Protocol:**
1. Official docs (docs.mendix.com, API refs)
2. GitHub code (github.com/mendix/sdk-demo is gold!)
3. Community forums & Stack Overflow  
4. Web archives (web.archive.org)
5. YouTube & Mendix World videos

**Rules:**
- Never stop at Tier 1
- Find real code examples
- Note Mendix version
- Save findings to knowledge base

**Mindset:** "The answer exists. I just haven't found it yet."`;

  const instructionsVersion = `## 🔥 What is Beast Mode?

Beast Mode is an **aggressive, exhaustive research protocol** for Mendix questions. Instead of giving up when you don't immediately know something, Beast Mode mandates searching through 5 tiers of sources until you find the answer.

### Why It Exists

Kelly got tired of typing research instructions every day. Now you just enable Beast Mode and the AI knows to:

1. **Never give up** - Search ALL 5 tiers before saying "I don't know"
2. **Find real code** - GitHub sdk-demo repo, npm packages, not just docs
3. **Check archives** - Wayback Machine for old/removed documentation
4. **Version check** - Always verify Mendix version compatibility
5. **Save everything** - Add findings to knowledge base for next time

### The 5 Tiers

| Tier | Sources | When |
|------|---------|------|
| 1 | Official docs, API refs, Academy | Always first |
| 2 | GitHub code, sdk-demo, npm packages | When docs are vague |
| 3 | Forums, Stack Overflow, GitHub Issues | Real-world solutions |
| 4 | Wayback Machine, archive.ph | Old/removed content |
| 5 | YouTube, Mendix World talks | Video explanations |

### Key Gold Mines

- **github.com/mendix/sdk-demo** - Has schema extraction patterns!
- **npm search mendixmodelsdk** - See how others use the SDK
- **web.archive.org** - Find old docs that were removed

### How to Use

Just tell any AI: "Use Beast Mode for this question" or paste the full prompt.`;

  let response;
  switch (format) {
    case 'brief':
      response = briefVersion;
      break;
    case 'instructions':
      response = instructionsVersion;
      break;
    default:
      response = fullPrompt;
  }

  res.json({
    name: 'Beast Mode',
    description: 'The exhaustive Mendix research protocol',
    format,
    prompt: response,
    tip: 'Copy this and paste it into any AI chat when you need thorough Mendix research!',
    stats: 'Beast Mode has helped grow the knowledge base from 0 → 177+ entries.'
  });
});

/**
 * Get usage analytics
 */
app.get('/analytics', async (req, res) => {
  try {
    await initialize();

    const period = req.query.period || 'all';
    const includeTrends = req.query.include_trends !== 'false';

    const report = await analytics.getReport(period);

    res.json({
      period,
      report: {
        toolUsage: report.toolUsage,
        popularTopics: report.popularTopics?.slice(0, 10) || [],
        trends: includeTrends ? report.trends : undefined,
        summary: {
          totalQueries: report.totalQueries || 0,
          uniqueTopics: report.uniqueTopics || 0,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
        },
      },
    });
  } catch (error) {
    logger.error('Analytics failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze theme - deep analysis of Mendix custom theme
 */
app.post('/analyze-theme', async (req, res) => {
  try {
    await initialize();

    const { project_path, detailed = true } = req.body;

    if (!project_path) {
      return res.status(400).json({ error: 'project_path is required' });
    }

    // Dynamic import of ThemeAnalyzer
    const { default: ThemeAnalyzer } = await import('./analyzers/ThemeAnalyzer.js');
    const analyzer = new ThemeAnalyzer();

    const results = await analyzer.analyze(project_path, { detailed });

    res.json({
      project_path,
      scores: results.scores,
      recommendations: {
        critical: results.recommendations.critical,
        important: results.recommendations.important,
        suggestions: results.recommendations.suggestions,
      },
      summary: results.summary,
      analysis: detailed ? results.analysis : undefined,
    });
  } catch (error) {
    logger.error('Theme analysis failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Serve OpenAPI specification for ChatGPT Actions import
 */
app.get('/openapi.json', (req, res) => {
  import('fs')
    .then((fs) => {
      const openapiPath = join(__dirname, '..', 'openapi.json');
      const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

      // Update server URL to match current host
      const host = req.get('host');
      // Use https for ngrok/production, http for localhost
      const protocol = host.includes('ngrok') || host.includes('.app') ? 'https' : req.protocol;
      spec.servers = [{ url: `${protocol}://${host}`, description: 'Current server' }];

      res.json(spec);
    })
    .catch((error) => {
      logger.error('Failed to serve OpenAPI spec', { error: error.message });
      res.status(500).json({ error: 'OpenAPI spec not available' });
    });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🧠 Mendix Expert REST API                                       ║
║                                                                   ║
║   Server running at: http://localhost:${PORT}                      ║
║                                                                   ║
║   Endpoints:                                                      ║
║     GET  /health         - Health check                           ║
║     GET  /tools          - List available tools                   ║
║     GET  /status         - Server status                          ║
║     GET  /beast-mode     - Beast Mode research protocol           ║
║     POST /query          - Query knowledge base                   ║
║     POST /search         - Hybrid search                          ║
║     POST /analyze        - Analyze Mendix project                 ║
║     POST /analyze-theme  - Analyze Mendix theme                   ║
║     POST /best-practice  - Get recommendations                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  // Pre-initialize on startup
  try {
    await initialize();
    console.log('✅ Server ready to accept connections');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.log('⚠️  Server running with limited functionality');
  }
});

// Keep server running
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error.message);
});

export default app;
