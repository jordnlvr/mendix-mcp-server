/**
 * SSE-Enabled MCP Server for Fly.io/Cloud Deployment
 * 
 * This server exposes the full MCP protocol over Server-Sent Events (SSE)
 * allowing remote clients like Claude Code to connect over HTTPS.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Core components
import KnowledgeManager from './core/KnowledgeManager.js';
import SupabaseKnowledgeManager from './core/SupabaseKnowledgeManager.js';
import SearchEngine from './core/SearchEngine.js';
import HybridSearch from './vector/HybridSearch.js';
import Logger from './utils/logger.js';
import Analytics from './utils/Analytics.js';
import { formatWithQualityAssessment, createCitations } from './utils/SourceFormatter.js';

const logger = new Logger('SSE-Server');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize components
let knowledgeManager;
let searchEngine;
let hybridSearch;
let analytics;
let initialized = false;

const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

async function initialize() {
  if (initialized) return;

  logger.info('Initializing SSE MCP Server...');

  if (useSupabase) {
    logger.info('Using Supabase for knowledge storage');
    knowledgeManager = new SupabaseKnowledgeManager();
  } else {
    logger.info('Using local JSON for knowledge storage');
    knowledgeManager = new KnowledgeManager();
  }

  await knowledgeManager.load();

  searchEngine = new SearchEngine();
  searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);

  try {
    hybridSearch = new HybridSearch();
    await hybridSearch.indexKnowledgeBase(knowledgeManager.knowledgeBase);
    
    if (useSupabase && hybridSearch.getVectorStore()) {
      knowledgeManager.setVectorStore(hybridSearch.getVectorStore());
      logger.info('VectorStore attached for auto-indexing');
    }
    
    logger.info('Hybrid search initialized');
  } catch (error) {
    logger.warn('Vector search unavailable, using keyword search only');
    hybridSearch = null;
  }

  analytics = new Analytics();
  await analytics.initialize();

  initialized = true;
  logger.info('SSE MCP Server initialized', {
    entries: knowledgeManager.getStats().totalEntries,
    storage: useSupabase ? 'supabase' : 'json',
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    initialized,
    storage: useSupabase ? 'supabase' : 'json',
    entries: initialized ? knowledgeManager.getStats().totalEntries : 0,
  });
});

// MCP over SSE endpoint
app.get('/sse', async (req, res) => {
  logger.info('New SSE connection established');
  
  await initialize();

  // Create MCP server instance for this connection
  const server = new McpServer({
    name: 'mendix-expert',
    version: '3.5.4',
  });

  // Register all MCP tools here (simplified version - you'd import from tools/)
  server.tool(
    'query_mendix_knowledge',
    'Search the Mendix knowledge base with source attribution',
    {
      topic: { type: 'string', description: 'Topic to search for' },
      detail_level: { type: 'string', description: 'basic, detailed, or expert', default: 'basic' },
    },
    async ({ topic, detail_level = 'basic' }) => {
      const limit = detail_level === 'expert' ? 10 : (detail_level === 'detailed' ? 5 : 3);
      const searchType = hybridSearch ? 'hybrid (keyword + semantic)' : 'keyword only';
      
      const results = hybridSearch 
        ? await hybridSearch.search(topic, { limit })
        : searchEngine.search(topic, { limit });

      // Format with source attribution
      const formatted = formatWithQualityAssessment(results, topic, searchType);

      return {
        content: [{
          type: 'text',
          text: formatted.answer,
        }],
        isError: false,
        _meta: formatted.metadata
      };
    }
  );

  server.tool(
    'search_knowledge',
    'Hybrid keyword + semantic search with quality assessment',
    {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', description: 'Max results', default: 10 },
    },
    async ({ query, limit = 10 }) => {
      const searchType = hybridSearch ? 'hybrid (keyword + semantic)' : 'keyword only';
      
      const results = hybridSearch
        ? await hybridSearch.search(query, { limit })
        : searchEngine.search(query, { limit });

      // Format with full source attribution and quality
      const formatted = formatWithQualityAssessment(results, query, searchType);

      return {
        content: [{
          type: 'text',
          text: formatted.answer,
        }],
        isError: false,
        _meta: formatted.metadata
      };
    }
  );

  server.tool(
    'add_to_knowledge_base',
    'Add new knowledge to make the system smarter',
    {
      title: { type: 'string', description: 'Title for the knowledge entry' },
      content: { type: 'string', description: 'The knowledge content (min 50 chars)' },
      category: { type: 'string', description: 'Category', default: 'general' },
      source: { type: 'string', description: 'Source of information', default: 'api-learned' },
    },
    async ({ title, content, category = 'general', source = 'api-learned' }) => {
      if (content.length < 50) {
        throw new Error('Content too short (min 50 chars)');
      }

      const result = await knowledgeManager.add(
        category,
        category,
        { title, content },
        source,
        { learnedFrom: 'mcp-sse-endpoint' }
      );

      return {
        content: [{
          type: 'text',
          text: `✅ Knowledge added: ${title}\nID: ${result.id}\nVector indexed: ${result.vectorIndexed}`,
        }],
      };
    }
  );

  // Create SSE transport
  const transport = new SSEServerTransport('/message', res);
  await server.connect(transport);
  
  logger.info('MCP server connected via SSE');
});

// POST endpoint for MCP messages
app.post('/message', async (req, res) => {
  // This is handled by the SSE transport
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🧠 Mendix Expert MCP Server (SSE Mode)                          ║
║                                                                   ║
║   Server running at: http://localhost:${PORT}                      ║
║   SSE endpoint: http://localhost:${PORT}/sse                       ║
║                                                                   ║
║   Ready for remote MCP connections!                               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  await initialize();
  logger.info('SSE MCP Server ready for connections');
});

export default app;
