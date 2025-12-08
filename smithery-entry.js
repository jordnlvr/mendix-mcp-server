/**
 * Smithery Entry Point
 *
 * This file exports the createServer function required by Smithery
 * for marketplace deployment. The actual server logic is in src/index.js.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Core components - lazy loaded
let CacheManager, KnowledgeManager, ProjectLoader, QualityScorer, SearchEngine;
let Logger, WebFetcher, HybridSearch, VectorStore, HarvestScheduler;

// Configuration schema for Smithery session config
export const configSchema = z.object({
  pinecone_api_key: z
    .string()
    .optional()
    .describe('Pinecone API key for semantic vector search (optional - enhances search quality)'),
  pinecone_index: z.string().default('mendix-knowledge').describe('Pinecone index name'),
  azure_openai_key: z
    .string()
    .optional()
    .describe('Azure OpenAI API key for embeddings (optional)'),
  azure_openai_endpoint: z.string().optional().describe('Azure OpenAI endpoint URL'),
  enable_harvesting: z
    .boolean()
    .default(false)
    .describe('Enable automatic knowledge harvesting from docs.mendix.com'),
  debug: z.boolean().default(false).describe('Enable debug logging'),
});

/**
 * Create and configure the Mendix Expert MCP Server
 * Required export for Smithery deployment
 */
export default async function createServer({ config }) {
  // Dynamic imports for core modules
  const [
    { default: CacheManagerClass },
    { default: KnowledgeManagerClass },
    { default: ProjectLoaderClass },
    { default: QualityScoreClass },
    { default: SearchEngineClass },
    { default: LoggerClass },
    { default: WebFetcherClass },
    { default: HybridSearchClass },
    { default: VectorStoreClass },
    { HarvestScheduler: HarvestSchedulerClass },
  ] = await Promise.all([
    import('./src/core/CacheManager.js'),
    import('./src/core/KnowledgeManager.js'),
    import('./src/core/ProjectLoader.js'),
    import('./src/core/QualityScorer.js'),
    import('./src/core/SearchEngine.js'),
    import('./src/utils/logger.js'),
    import('./src/utils/WebFetcher.js'),
    import('./src/vector/HybridSearch.js'),
    import('./src/vector/VectorStore.js'),
    import('./src/harvester/index.js'),
  ]);

  const logger = new LoggerClass('SmitheryServer');
  const debug = config?.debug || false;

  if (debug) {
    logger.info('Creating Mendix Expert server with config', { config });
  }

  // Create MCP server
  const server = new McpServer({
    name: 'mendix-expert',
    version: '2.4.3',
  });

  // Initialize components
  const cacheManager = new CacheManagerClass();
  const projectLoader = new ProjectLoaderClass(cacheManager);
  const knowledgeManager = new KnowledgeManagerClass();
  const webFetcher = new WebFetcherClass({ enabled: true });
  const searchEngine = new SearchEngineClass();
  const qualityScorer = new QualityScoreClass();

  // Initialize vector search if Pinecone config provided
  let vectorStore = null;
  let hybridSearch = null;

  if (config?.pinecone_api_key) {
    try {
      process.env.PINECONE_API_KEY = config.pinecone_api_key;
      process.env.PINECONE_INDEX_NAME = config.pinecone_index || 'mendix-knowledge';

      if (config.azure_openai_key && config.azure_openai_endpoint) {
        process.env.AZURE_OPENAI_API_KEY = config.azure_openai_key;
        process.env.AZURE_OPENAI_ENDPOINT = config.azure_openai_endpoint;
      }

      vectorStore = new VectorStoreClass();
      await vectorStore.initialize();
      hybridSearch = new HybridSearchClass(searchEngine, vectorStore);
      logger.info('Vector search initialized');
    } catch (err) {
      logger.warn('Vector search unavailable', { error: err.message });
    }
  }

  // Load knowledge
  await knowledgeManager.loadKnowledge();
  const entries = knowledgeManager.getAllEntries();
  searchEngine.buildIndex(entries);

  logger.info('Knowledge loaded', {
    entries: entries.length,
    vectorEnabled: !!vectorStore,
  });

  // Register tools

  // 1. Query Knowledge Tool
  server.tool(
    'query_mendix_knowledge',
    'Search the Mendix knowledge base for SDK patterns, best practices, and troubleshooting',
    {
      topic: z.string().describe('Search topic (e.g., "microflow loops", "REST integration")'),
      detail_level: z.enum(['summary', 'detailed', 'comprehensive']).default('detailed'),
      max_results: z.number().min(1).max(20).default(5),
    },
    async ({ topic, detail_level, max_results }) => {
      try {
        let results;

        if (hybridSearch) {
          results = await hybridSearch.search(topic, { limit: max_results });
        } else {
          results = searchEngine.search(topic, { limit: max_results });
        }

        if (!results || results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No results found for "${topic}". Try:\n1. Use different keywords\n2. Check spelling\n3. Search docs.mendix.com directly`,
              },
            ],
          };
        }

        const formatted = results
          .map((r, i) => {
            const entry = r.entry || r;
            let text = `### ${i + 1}. ${entry.title || entry.topic}\n`;
            text += `**Score:** ${(r.score * 100).toFixed(0)}%\n`;
            text += `**Category:** ${entry.category || 'General'}\n\n`;

            if (detail_level === 'summary') {
              text += entry.summary || entry.content?.substring(0, 200) + '...';
            } else {
              text += entry.content || entry.description || 'No content available';
              if (entry.code_example && detail_level === 'comprehensive') {
                text += `\n\n**Example:**\n\`\`\`\n${entry.code_example}\n\`\`\``;
              }
            }

            return text;
          })
          .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `## Search Results for "${topic}"\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Search error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 2. Get Best Practice Tool
  server.tool(
    'get_best_practice',
    'Get Mendix best practice recommendations for a specific scenario',
    {
      scenario: z.string().describe('The scenario to get best practices for'),
      category: z
        .enum(['microflows', 'domain-model', 'security', 'performance', 'integration', 'general'])
        .optional(),
    },
    async ({ scenario, category }) => {
      const searchQuery = category ? `${category} ${scenario}` : scenario;
      const results = searchEngine.search(searchQuery, {
        limit: 3,
        filter: (entry) =>
          entry.category?.toLowerCase().includes('best') || entry.tags?.includes('best-practice'),
      });

      if (!results.length) {
        return {
          content: [
            {
              type: 'text',
              text: `No specific best practices found for "${scenario}". General recommendation: Check docs.mendix.com/refguide/ for official guidelines.`,
            },
          ],
        };
      }

      const formatted = results
        .map((r) => {
          const entry = r.entry || r;
          return `### ${entry.title || entry.topic}\n${entry.content || entry.description}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `## Best Practices: ${scenario}\n\n${formatted}`,
          },
        ],
      };
    }
  );

  // 3. Add Knowledge Tool
  server.tool(
    'add_to_knowledge_base',
    'Add new knowledge to the self-learning knowledge base',
    {
      topic: z.string().describe('Topic title'),
      content: z.string().describe('Knowledge content'),
      category: z.string().describe('Category (sdk, best-practices, troubleshooting, etc.)'),
      source: z.string().optional().describe('Source URL or reference'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async ({ topic, content, category, source, tags }) => {
      try {
        const quality = qualityScorer.score({ topic, content, category, source, tags });

        if (quality.score < 0.3) {
          return {
            content: [
              {
                type: 'text',
                text: `Knowledge rejected (quality score: ${(quality.score * 100).toFixed(
                  0
                )}%). Issues: ${quality.issues.join(', ')}`,
              },
            ],
          };
        }

        const entry = {
          id: `user-${Date.now()}`,
          topic,
          title: topic,
          content,
          category,
          source: source || 'user-contributed',
          tags: tags || [],
          quality_score: quality.score,
          created_at: new Date().toISOString(),
          mendix_version: 'studio-pro-11',
        };

        await knowledgeManager.addEntry(entry);
        searchEngine.buildIndex(knowledgeManager.getAllEntries());

        return {
          content: [
            {
              type: 'text',
              text: `✅ Knowledge added!\n- Topic: ${topic}\n- Category: ${category}\n- Quality Score: ${(
                quality.score * 100
              ).toFixed(0)}%`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to add knowledge: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 4. Analyze Project Tool
  server.tool(
    'analyze_project',
    'Analyze a Mendix .mpr project file',
    {
      project_path: z.string().describe('Path to the .mpr file or extracted data directory'),
      module_name: z.string().optional().describe('Specific module to analyze'),
    },
    async ({ project_path, module_name }) => {
      try {
        const analysis = await projectLoader.analyzeProject(project_path, { module: module_name });

        return {
          content: [
            {
              type: 'text',
              text: `## Project Analysis\n\n\`\`\`json\n${JSON.stringify(
                analysis,
                null,
                2
              )}\n\`\`\``,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Analysis failed: ${error.message}. Ensure the path points to a valid .mpr file or extracted Mendix project.`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 5. Get Stats Tool
  server.tool('get_knowledge_stats', 'Get statistics about the knowledge base', {}, async () => {
    const stats = knowledgeManager.getStats();
    const searchStats = searchEngine.getStats();

    return {
      content: [
        {
          type: 'text',
          text: `## Knowledge Base Statistics\n\n- **Total Entries:** ${
            stats.totalEntries
          }\n- **Categories:** ${
            Object.keys(stats.byCategory || {}).length
          }\n- **Search Index Terms:** ${searchStats.indexedTerms}\n- **Vector Search:** ${
            vectorStore ? 'Enabled' : 'Disabled'
          }`,
        },
      ],
    };
  });

  logger.info('Server configured with 5 tools');

  return server.server;
}
