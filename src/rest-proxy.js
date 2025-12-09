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
        description:
          'Get the Beast Mode research protocol - the exact prompt for exhaustive Mendix research',
        parameters: {
          format:
            'string (optional) - prompt (full), instructions (explanation), or brief (summary)',
        },
      },
      {
        name: 'dashboard',
        method: 'GET',
        path: '/dashboard',
        description:
          'Visual HTML dashboard showing usage analytics, tool usage, and popular topics',
        parameters: {},
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
    stats: 'Beast Mode has helped grow the knowledge base from 0 → 177+ entries.',
  });
});

/**
 * Get usage analytics
 */
app.get('/analytics', async (req, res) => {
  try {
    await initialize();

    const detailed = req.query.detailed === 'true';
    const report = detailed ? analytics.getDetailedReport() : analytics.getSummary();

    res.json({
      report,
      serverVersion: '3.0.0',
    });
  } catch (error) {
    logger.error('Analytics failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get harvest status - shows when last harvest ran, next scheduled, and stats
 */
app.get('/harvest-status', async (req, res) => {
  try {
    const { default: HarvestScheduler } = await import('./harvester/HarvestScheduler.js');
    const knowledgePath = join(__dirname, 'knowledge');
    const scheduler = new HarvestScheduler(knowledgePath);
    await scheduler.loadState();

    res.json({
      lastHarvest: scheduler.state.lastHarvest,
      nextScheduledHarvest: scheduler.getNextHarvestDate?.() || 'Not scheduled',
      totalHarvests: scheduler.state.totalHarvests || 0,
      lastResults: scheduler.state.lastHarvestResults || null,
      harvestIntervalDays: scheduler.harvestIntervalDays,
      status: scheduler.state.isRunning ? 'running' : 'idle',
    });
  } catch (error) {
    logger.error('Harvest status failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger a manual harvest - fetch latest Mendix docs
 */
app.post('/harvest', async (req, res) => {
  try {
    const { sources = ['releaseNotes', 'studioProGuide'], dryRun = false } = req.body;

    const { default: KnowledgeHarvester } = await import('./harvester/KnowledgeHarvester.js');
    const knowledgePath = join(__dirname, '..', 'knowledge');
    const harvester = new KnowledgeHarvester(knowledgePath);

    logger.info('Starting manual harvest', { sources, dryRun });

    // Run harvest (this may take a while)
    const results = await harvester.harvest({ sources, dryRun, verbose: false });

    // Re-index if we got new content
    if (!dryRun && results.newEntries?.length > 0) {
      await knowledgeManager.reload();
      searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);
      if (hybridSearch) {
        await hybridSearch.indexKnowledgeBase(knowledgeManager.knowledgeBase);
      }
    }

    res.json({
      success: true,
      dryRun,
      sources,
      results: {
        newEntries: results.newEntries?.length || 0,
        updatedEntries: results.updatedEntries?.length || 0,
        errors: results.failed?.length || 0,
        pagesScanned: harvester.stats.pagesScanned,
      },
      message: dryRun
        ? 'Dry run complete - no changes made'
        : `Harvest complete: ${results.newEntries?.length || 0} new entries added`,
    });
  } catch (error) {
    logger.error('Manual harvest failed', { error: error.message });
    res.status(500).json({ error: error.message, success: false });
  }
});

/**
 * Track a knowledge gap - log topics users ask about that we don't have answers for
 */
app.post('/knowledge-gap', async (req, res) => {
  try {
    await initialize();
    const { topic, query, context } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    // Track in analytics for future harvesting priority
    analytics.trackQuery(topic, 'gap');

    // Log to harvest-log for manual review
    const { default: fs } = await import('fs/promises');
    const gapLogPath = join(__dirname, '..', 'knowledge', 'knowledge-gaps.json');

    let gaps = [];
    try {
      const existing = await fs.readFile(gapLogPath, 'utf-8');
      gaps = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    gaps.push({
      topic,
      query: query || topic,
      context: context || null,
      timestamp: new Date().toISOString(),
      addressed: false,
    });

    // Keep last 100 gaps
    if (gaps.length > 100) {
      gaps = gaps.slice(-100);
    }

    await fs.writeFile(gapLogPath, JSON.stringify(gaps, null, 2));

    res.json({
      success: true,
      message: `Knowledge gap "${topic}" recorded for future harvesting`,
      totalGaps: gaps.filter((g) => !g.addressed).length,
    });
  } catch (error) {
    logger.error('Knowledge gap tracking failed', { error: error.message });
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
 * Analytics Dashboard - Visual HTML dashboard for usage patterns
 */
app.get('/dashboard', async (req, res) => {
  try {
    await initialize();
    const report = analytics.getDetailedReport();
    const stats = knowledgeManager.getStats();

    // Build tool usage chart data
    const toolData = Object.entries(report.allToolUsage || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topTopics = Object.entries(report.topTopics || {}).slice(0, 10);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧠 Mendix Expert Analytics Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; min-height: 100vh; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; font-size: 2.5rem; }
    h1 span { background: linear-gradient(90deg, #00d9ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; backdrop-filter: blur(10px); }
    .card h2 { font-size: 1rem; color: #888; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .stat { font-size: 3rem; font-weight: bold; background: linear-gradient(90deg, #00d9ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { color: #aaa; margin-top: 8px; }
    .bar-chart { margin-top: 16px; }
    .bar { display: flex; align-items: center; margin-bottom: 12px; }
    .bar-label { width: 150px; font-size: 0.85rem; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-fill { height: 24px; background: linear-gradient(90deg, #00d9ff, #00ff88); border-radius: 4px; margin-left: 10px; min-width: 4px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; font-size: 0.75rem; }
    .topics { list-style: none; }
    .topics li { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; }
    .topics li:last-child { border-bottom: none; }
    .badge { background: rgba(0,217,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; }
    .footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.85rem; }
    .status-dot { width: 10px; height: 10px; background: #00ff88; border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 <span>Mendix Expert</span> Analytics</h1>
    
    <div class="grid">
      <div class="card">
        <h2>Knowledge Base</h2>
        <div class="stat">${stats.totalEntries || 200}+</div>
        <div class="stat-label">Verified Entries</div>
        <div style="margin-top: 16px; color: #888;">
          📁 ${stats.filesLoaded || 23} knowledge files<br>
          📊 ~700KB curated content
        </div>
      </div>
      
      <div class="card">
        <h2>Total Queries</h2>
        <div class="stat">${report.overview?.totalToolCalls || 0}</div>
        <div class="stat-label">Questions Answered</div>
        <div style="margin-top: 16px; color: #888;">
          <span class="status-dot"></span>Server Online
        </div>
      </div>
      
      <div class="card">
        <h2>Vector Search</h2>
        <div class="stat">${vectorSearchAvailable ? '✅' : '⚠️'}</div>
        <div class="stat-label">${
          vectorSearchAvailable ? 'Pinecone Connected' : 'Using TF-IDF'
        }</div>
        <div style="margin-top: 16px; color: #888;">
          Hybrid keyword + semantic search
        </div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h2>Tool Usage</h2>
        <div class="bar-chart">
          ${toolData
            .map(([name, count]) => {
              const max = toolData[0]?.[1] || 1;
              const width = Math.max((count / max) * 100, 5);
              return `<div class="bar"><span class="bar-label">${name.replace(
                /_/g,
                ' '
              )}</span><div class="bar-fill" style="width: ${width}%">${count}</div></div>`;
            })
            .join('')}
        </div>
      </div>
      
      <div class="card">
        <h2>Popular Topics</h2>
        <ul class="topics">
          ${
            topTopics
              .map(
                ([topic, count]) =>
                  `<li><span>${topic}</span><span class="badge">${count}</span></li>`
              )
              .join('') || '<li>No data yet</li>'
          }
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>@jordnlvr/mendix-mcp-server v2.9.2 • Last updated: ${
        new Date().toISOString().split('T')[0]
      }</p>
      <p style="margin-top: 8px;">📖 <a href="https://jordnlvr.github.io/mendix-mcp-server/" style="color: #00d9ff;">Documentation</a> • 🐙 <a href="https://github.com/jordnlvr/mendix-mcp-server" style="color: #00d9ff;">GitHub</a></p>
    </div>
  </div>
</body>
</html>`;

    res.type('html').send(html);
  } catch (error) {
    logger.error('Dashboard failed', { error: error.message });
    res.status(500).send('Dashboard error: ' + error.message);
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
║   🧠 Mendix Expert REST API v3.0.1                                ║
║                                                                   ║
║   Server running at: http://localhost:${PORT}                      ║
║                                                                   ║
║   Endpoints:                                                      ║
║     GET  /health          - Health check                          ║
║     GET  /tools           - List available tools                  ║
║     GET  /status          - Server status                         ║
║     GET  /beast-mode      - Beast Mode research protocol          ║
║     GET  /dashboard       - 📊 Visual analytics dashboard         ║
║     GET  /analytics       - Usage analytics (JSON)                ║
║     GET  /harvest-status  - 🌾 Auto-harvest status & schedule     ║
║     POST /query           - Query knowledge base                  ║
║     POST /search          - Hybrid search                         ║
║     POST /analyze         - Analyze Mendix project                ║
║     POST /analyze-theme   - Analyze Mendix theme (v2.0)           ║
║     POST /best-practice   - Get recommendations                   ║
║     POST /harvest         - 🌾 Trigger manual harvest             ║
║     POST /knowledge-gap   - 📝 Report missing knowledge           ║
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
