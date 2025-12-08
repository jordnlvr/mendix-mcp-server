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
      version: '2.5.2',
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
║     POST /query          - Query knowledge base                   ║
║     POST /search         - Hybrid search                          ║
║     POST /analyze        - Analyze Mendix project                 ║
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
