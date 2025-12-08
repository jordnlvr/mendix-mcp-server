/**
 * Mendix Expert MCP Server v2.1
 * Modular, scalable, self-learning knowledge server
 * Updated for MCP SDK v1.x (ESM)
 *
 * Architecture:
 * - Core: ProjectLoader, KnowledgeManager, SearchEngine, QualityScorer, CacheManager
 * - Tools: QueryTool, AnalyzeTool, BestPracticeTool, AddKnowledgeTool
 * - Utils: Logger, Validator, Config
 *
 * Features:
 * - Dynamic project loading (any .mpr or extracted directory)
 * - Intelligent search with relevance scoring
 * - Automatic quality assessment
 * - Version tracking and conflict detection
 * - Self-learning with auto-research
 * - Smart caching for performance
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Core components
import CacheManager from './core/CacheManager.js';
import KnowledgeManager from './core/KnowledgeManager.js';
import ProjectLoader from './core/ProjectLoader.js';
import QualityScorer from './core/QualityScorer.js';
import SearchEngine from './core/SearchEngine.js';
import { getConfig } from './utils/config.js';
import Logger from './utils/logger.js';
import MaintenanceScheduler from './utils/MaintenanceScheduler.js';
import SyncReminder from './utils/SyncReminder.js';
import WebFetcher from './utils/WebFetcher.js';

// Initialize
const logger = new Logger('Server');
const config = getConfig();

// Validate configuration
const configValidation = config.validate();
if (!configValidation.valid) {
  logger.error('Invalid configuration', { errors: configValidation.errors });
  process.exit(1);
}

logger.info('Starting Mendix Expert MCP Server v2.1 (SDK v1.x)');

// Create server with new McpServer API
const server = new McpServer({
  name: config.get('server.name', 'mendix-expert'),
  version: config.get('server.version', '2.1.0'),
});

// Initialize core components
const cacheManager = new CacheManager();
const projectLoader = new ProjectLoader(cacheManager);
const knowledgeManager = new KnowledgeManager();
const webFetcher = new WebFetcher({ enabled: true });
const searchEngine = new SearchEngine();
const qualityScorer = new QualityScorer();
const syncReminder = new SyncReminder();

// Initialize maintenance scheduler with all components
const maintenanceScheduler = new MaintenanceScheduler({
  knowledgeManager,
  searchEngine,
  webFetcher,
  cacheManager,
  autoRun: true,
  validationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  analyticsInterval: 14 * 24 * 60 * 60 * 1000, // 14 days (2 weeks)
  cacheInterval: 24 * 60 * 60 * 1000, // 1 day
  stalenessInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  maintenanceInterval: 14 * 24 * 60 * 60 * 1000, // 14 days (2 weeks)
});

// Check for sync reminder on startup
const syncStatus = syncReminder.shouldRemind();
if (syncStatus.remind) {
  logger.warn('Sync reminder triggered', syncStatus);
  console.log(syncReminder.getReminderMessage());
}

// ============================================================================
// TOOL REGISTRATIONS
// ============================================================================

// Tool 1: Query Mendix Knowledge
server.tool(
  'query_mendix_knowledge',
  'Query the Mendix knowledge base for specific topics, patterns, or best practices. Uses advanced search with relevance scoring.',
  {
    topic: z
      .string()
      .describe('The Mendix topic to query (e.g., "domain modeling", "microflows", "security")'),
    detail_level: z
      .enum(['basic', 'detailed', 'expert'])
      .optional()
      .describe('Level of detail in the response'),
  },
  async ({ topic, detail_level = 'basic' }) => {
    try {
      logger.info('Querying knowledge', { topic, detail_level });

      const searchResults = searchEngine.search(topic, {
        maxResults: detail_level === 'expert' ? 20 : 10,
        minScore: detail_level === 'basic' ? 0.5 : 0.3,
      });

      if (searchResults.length === 0) {
        // Suggest web sources when no results found
        const fetchSuggestions = webFetcher.suggestFetchUrls(topic);
        const suggestionText =
          fetchSuggestions.length > 0
            ? '\n\n📚 **Suggested sources to research:**\n' +
              fetchSuggestions
                .slice(0, 3)
                .map((s) => `- [${s.reason}](${s.url})`)
                .join('\n')
            : '';

        return {
          content: [
            {
              type: 'text',
              text: `No specific knowledge found for "${topic}". Try broader terms like "microflow", "domain modeling", "security", "performance", etc.${suggestionText}\n\n💡 **Tip**: Use the add_to_knowledge_base tool to add new knowledge about this topic after researching it!`,
            },
          ],
        };
      }

      // Format results
      const sections = [];
      sections.push(`# Search Results (${searchResults.length} matches)\n`);

      for (const result of searchResults) {
        const { file, category, entry, score } = result;

        sections.push(`## ${entry.practice || entry.feature || entry.topic || 'Knowledge Entry'}`);
        sections.push(`**Source:** ${file}${category ? ` > ${category}` : ''}`);
        sections.push(`**Relevance:** ${(score * 100).toFixed(0)}%`);

        if (detail_level !== 'basic' && entry._metadata) {
          const quality = entry._metadata.quality_score;
          if (quality) {
            sections.push(`**Quality:** ${(quality * 100).toFixed(0)}%`);
          }
        }

        sections.push('');
        sections.push(JSON.stringify(entry, null, 2));
        sections.push('\n---\n');

        // Record usage
        if (entry._metadata?.id) {
          await knowledgeManager.recordUsage(file, entry._metadata.id);
        }
      }

      return {
        content: [{ type: 'text', text: sections.join('\n') }],
      };
    } catch (error) {
      logger.error('Query failed', { error: error.message });
      return {
        content: [{ type: 'text', text: `Query failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 2: Analyze Project
server.tool(
  'analyze_project',
  'Analyze a Mendix project from any .mpr file or extracted data directory. Dynamically discovers modules and entities.',
  {
    project_path: z.string().describe('Path to .mpr file or extracted data directory'),
    module_name: z.string().optional().describe('Optional: specific module to analyze'),
    entity_name: z
      .string()
      .optional()
      .describe('Optional: specific entity to analyze (requires module_name)'),
  },
  async ({ project_path, module_name, entity_name }) => {
    try {
      logger.info('Analyzing project', { project_path, module_name, entity_name });

      const project = await projectLoader.loadProject(project_path);

      // If specific module and entity requested
      if (module_name && entity_name) {
        const entity = projectLoader.getEntity(project_path, module_name, entity_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(entity, null, 2) }],
        };
      }

      // If specific module requested
      if (module_name) {
        const module = projectLoader.getModule(project_path, module_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(module, null, 2) }],
        };
      }

      // Return project overview
      const overview = {
        name: project.name,
        path: project.path,
        modules: project.modules.map((m) => ({
          name: m.name,
          entities: m.domainModel?.entities?.length || 0,
          microflows: m.microflows ? Object.keys(m.microflows).length : 0,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(overview, null, 2) }],
      };
    } catch (error) {
      logger.error('Analysis failed', { error: error.message });
      return {
        content: [{ type: 'text', text: `Analysis failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 3: Get Best Practice
server.tool(
  'get_best_practice',
  'Get best practice recommendations for a specific Mendix development scenario',
  {
    scenario: z
      .string()
      .describe(
        'The development scenario (e.g., "many-to-many relationship", "security rules", "performance optimization")'
      ),
  },
  async ({ scenario }) => {
    try {
      logger.info('Getting best practice', { scenario });

      const results = searchEngine.search(scenario, {
        files: ['best-practices'],
        maxResults: 5,
        minScore: 0.4,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No best practice found for: ${scenario}. Try terms like "error handling", "performance", "security", "domain modeling", etc.\n\n💡 **Tip**: Use the add_to_knowledge_base tool to add best practices for this scenario!`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r) =>
            `## ${r.entry.practice || r.entry.topic || 'Best Practice'}\n\n**Relevance:** ${(
              r.score * 100
            ).toFixed(0)}%\n\n${JSON.stringify(r.entry, null, 2)}\n\n---\n`
        )
        .join('\n');

      return {
        content: [{ type: 'text', text: formatted }],
      };
    } catch (error) {
      logger.error('Failed to get best practice', { error: error.message });
      return {
        content: [{ type: 'text', text: `Failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 4: Add to Knowledge Base (Self-Learning)
server.tool(
  'add_to_knowledge_base',
  'Add new knowledge to the mendix-expert knowledge base with automatic quality scoring and duplicate detection. Use this to teach the system new information!',
  {
    knowledge_file: z
      .enum([
        'best-practices',
        'studio-pro',
        'model-sdk',
        'platform-sdk',
        'troubleshooting',
        'advanced-patterns',
        'performance-guide',
        'security-guide',
      ])
      .describe('Which knowledge base file to update'),
    category: z
      .string()
      .optional()
      .describe('The category within the file (e.g., "microflows", "domain_modeling", "security")'),
    content: z
      .string()
      .describe(
        'The knowledge content as a JSON string (will be parsed as structured JSON matching the file format)'
      ),
    source: z
      .string()
      .describe(
        'Source of the information (e.g., "docs.mendix.com", "Mendix Forum", "expert research")'
      ),
    verified: z
      .boolean()
      .optional()
      .describe('Whether this knowledge has been verified as accurate'),
  },
  async ({ knowledge_file, category, content, source, verified = false }) => {
    try {
      logger.info('Adding knowledge', { file: knowledge_file, category, source });

      // Parse the JSON string content
      const parsedContent = JSON.parse(content);

      const result = await knowledgeManager.add(knowledge_file, category, parsedContent, source, {
        addedBy: 'mendix-expert-mcp',
        mergeDuplicates: true,
        verified,
      });

      // Reload knowledge base and re-index
      await knowledgeManager.reload();
      searchEngine.clear();
      searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);

      return {
        content: [
          {
            type: 'text',
            text:
              `✅ Successfully added knowledge to ${knowledge_file}.json${
                category ? ` in category "${category}"` : ''
              }.\n\n` +
              `📋 **Entry ID:** ${result.id}\n` +
              `⭐ **Quality Score:** ${(result.qualityScore * 100).toFixed(0)}%\n` +
              `🔄 **Status:** Knowledge base reloaded and re-indexed\n\n` +
              `The new information is now available for queries. The system just got smarter! 🧠`,
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to add knowledge', { error: error.message });
      return {
        content: [{ type: 'text', text: `Failed to add knowledge: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 5: Sync Server with GitHub
server.tool(
  'sync_mcp_server',
  'Sync the MCP server with GitHub - pull updates, push local changes, or check sync status. Use this to keep your server in sync across machines.',
  {
    action: z
      .enum(['status', 'pull', 'push', 'both', 'dismiss'])
      .describe('Action to perform: status (check), pull (get updates), push (backup changes), both (full sync), dismiss (snooze reminder)'),
    dismiss_days: z
      .number()
      .optional()
      .describe('Days to dismiss reminder (only used with dismiss action, default 7)'),
  },
  async ({ action, dismiss_days = 7 }) => {
    try {
      logger.info('Sync action requested', { action });

      if (action === 'status') {
        const data = syncReminder.getReminderData();
        
        let statusText = `# 🔄 Sync Status\n\n`;
        statusText += `**Repository:** ${data.repoUrl}\n`;
        statusText += `**Local Path:** ${data.repoPath}\n\n`;
        
        statusText += `## Current State\n\n`;
        statusText += `| Metric | Value |\n|--------|-------|\n`;
        statusText += `| Days since last pull | ${data.status.daysSincePull} |\n`;
        statusText += `| Days since last push | ${data.status.daysSincePush} |\n`;
        statusText += `| Has local changes | ${data.status.hasLocalChanges ? '✅ Yes' : '❌ No'} |\n`;
        statusText += `| Has remote updates | ${data.status.hasRemoteChanges ? '✅ Yes' : '❌ No'} |\n`;
        
        if (data.shouldRemind) {
          statusText += `\n⚠️ **Sync recommended!**\n\n`;
          if (data.status.hasLocalChanges) {
            statusText += `- You have local changes that should be backed up\n`;
          }
          if (data.status.hasRemoteChanges) {
            statusText += `- There are updates available from GitHub\n`;
          }
        } else {
          statusText += `\n✅ **All synced!**\n`;
        }
        
        statusText += `\n## Quick Commands\n\n`;
        statusText += `\`\`\`powershell\n# Pull updates\n${data.commands.pull}\n\n# Push changes\n${data.commands.push}\n\`\`\``;

        return { content: [{ type: 'text', text: statusText }] };
      }

      if (action === 'dismiss') {
        const result = syncReminder.dismissReminder(dismiss_days);
        return {
          content: [{
            type: 'text',
            text: `✅ Sync reminder dismissed until ${new Date(result.until).toLocaleDateString()}.\n\nI'll remind you again after ${dismiss_days} days.`
          }]
        };
      }

      // Execute sync (pull, push, or both)
      const result = await syncReminder.executeSync(action);

      let resultText = `# 🔄 Sync Results\n\n`;
      
      for (const op of result.operations) {
        if (op.success) {
          resultText += `✅ **${op.operation.toUpperCase()}** succeeded\n`;
          if (op.output && op.output !== 'No local changes to push') {
            resultText += `\`\`\`\n${op.output}\n\`\`\`\n`;
          } else if (op.output) {
            resultText += `_${op.output}_\n`;
          }
        } else {
          resultText += `❌ **${op.operation.toUpperCase()}** failed\n`;
          resultText += `Error: ${op.error}\n`;
        }
        resultText += '\n';
      }

      if (result.success) {
        resultText += `🎉 **Sync complete!** Your server is now in sync with GitHub.`;
      } else {
        resultText += `\n⚠️ **Some operations failed.** You may need to resolve conflicts manually:\n`;
        resultText += `\`\`\`powershell\ncd "${syncReminder.repoPath}"\ngit status\n\`\`\``;
      }

      return { content: [{ type: 'text', text: resultText }] };

    } catch (error) {
      logger.error('Sync failed', { error: error.message });
      return {
        content: [{ type: 'text', text: `Sync failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// RESOURCE REGISTRATIONS
// ============================================================================

// Resource 1: All Knowledge
server.resource(
  'all-knowledge',
  'mendix://knowledge/all',
  {
    title: 'All Mendix Knowledge',
    description: 'Complete knowledge base with search and quality metrics',
    mimeType: 'application/json',
  },
  async () => ({
    contents: [
      {
        uri: 'mendix://knowledge/all',
        mimeType: 'application/json',
        text: JSON.stringify(knowledgeManager.knowledgeBase, null, 2),
      },
    ],
  })
);

// Resource 2: Knowledge Stats
server.resource(
  'knowledge-stats',
  'mendix://stats/knowledge',
  {
    title: 'Knowledge Base Statistics',
    description: 'Statistics about knowledge base content and quality',
    mimeType: 'application/json',
  },
  async () => ({
    contents: [
      {
        uri: 'mendix://stats/knowledge',
        mimeType: 'application/json',
        text: JSON.stringify(knowledgeManager.getStats(), null, 2),
      },
    ],
  })
);

// Resource 3: Search Stats
server.resource(
  'search-stats',
  'mendix://stats/search',
  {
    title: 'Search Engine Statistics',
    description: 'Search index statistics and performance metrics',
    mimeType: 'application/json',
  },
  async () => ({
    contents: [
      {
        uri: 'mendix://stats/search',
        mimeType: 'application/json',
        text: JSON.stringify(searchEngine.getStats(), null, 2),
      },
    ],
  })
);

// Resource 4: Project Stats
server.resource(
  'project-stats',
  'mendix://stats/projects',
  {
    title: 'Loaded Projects Statistics',
    description: 'Information about currently loaded Mendix projects',
    mimeType: 'application/json',
  },
  async () => ({
    contents: [
      {
        uri: 'mendix://stats/projects',
        mimeType: 'application/json',
        text: JSON.stringify(projectLoader.getStats(), null, 2),
      },
    ],
  })
);

// Resource 5: Knowledge Validation Report
server.resource(
  'knowledge-validation',
  'mendix://validation/knowledge',
  {
    title: 'Knowledge Base Validation Report',
    description: 'Validation results including errors, warnings, and improvement suggestions',
    mimeType: 'application/json',
  },
  async () => {
    const report = knowledgeManager.validateKnowledgeBase();
    return {
      contents: [
        {
          uri: 'mendix://validation/knowledge',
          mimeType: 'application/json',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }
);

// Resource 6: Search Analytics & Knowledge Gaps
server.resource(
  'search-analytics',
  'mendix://analytics/search',
  {
    title: 'Search Analytics & Knowledge Gaps',
    description: 'Popular searches, missed queries, and knowledge gap suggestions',
    mimeType: 'application/json',
  },
  async () => {
    const stats = searchEngine.getStats();
    const gaps = searchEngine.getKnowledgeGaps();
    return {
      contents: [
        {
          uri: 'mendix://analytics/search',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              analytics: stats.analytics,
              knowledgeGaps: gaps,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Resource 7: Knowledge Staleness Report
server.resource(
  'knowledge-staleness',
  'mendix://staleness/knowledge',
  {
    title: 'Knowledge Staleness Report',
    description: 'Entries that need review or verification based on age',
    mimeType: 'application/json',
  },
  async () => {
    const staleReport = knowledgeManager.getStaleEntries(90);
    return {
      contents: [
        {
          uri: 'mendix://staleness/knowledge',
          mimeType: 'application/json',
          text: JSON.stringify(staleReport, null, 2),
        },
      ],
    };
  }
);

// Resource 8: Maintenance Status
server.resource(
  'maintenance-status',
  'mendix://maintenance/status',
  {
    title: 'Maintenance Status',
    description: 'Scheduled maintenance tasks, last runs, and due tasks',
    mimeType: 'application/json',
  },
  async () => {
    const status = maintenanceScheduler.getStatus();
    return {
      contents: [
        {
          uri: 'mendix://maintenance/status',
          mimeType: 'application/json',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
);

// Resource 9: Sync Status
server.resource(
  'sync-status',
  'mendix://sync/status',
  {
    title: 'Sync Status',
    description: 'GitHub sync status - when to pull/push, local changes, remote updates',
    mimeType: 'application/json',
  },
  async () => {
    const data = syncReminder.getReminderData();
    return {
      contents: [
        {
          uri: 'mendix://sync/status',
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// ============================================================================
// PROMPT REGISTRATIONS
// ============================================================================

server.prompt(
  'mendix_expert',
  'Act as a Mendix expert with deep knowledge and self-learning capabilities',
  {
    question: z.string().describe('Your Mendix development question'),
  },
  async ({ question }) => {
    const stats = knowledgeManager.getStats();

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a Mendix expert with access to a self-learning knowledge base through the mendix-expert MCP server v2.1.

## KNOWLEDGE BASE STATUS
- ${stats.totalEntries} total knowledge entries
- ${stats.filesLoaded} knowledge domains
- Self-learning: ACTIVELY ENABLED

## AVAILABLE TOOLS

1. **query_mendix_knowledge** - Search the knowledge base
2. **analyze_project** - Analyze any Mendix project  
3. **get_best_practice** - Get best practice recommendations
4. **add_to_knowledge_base** - ADD NEW KNOWLEDGE (USE THIS CONSTANTLY!)

## 🚨 MANDATORY AUTO-LEARNING PROTOCOL

You MUST add knowledge to the base whenever you:
- Research something and find an answer
- Figure out how to do something after troubleshooting  
- Discover a solution that wasn't in the knowledge base
- Learn about a new Mendix feature or version change
- Help the user solve a problem through experimentation

### LEARNING TRIGGERS (Always save these):
- ✅ Any working code patterns you discover
- ✅ Solutions to errors or problems
- ✅ Best practices from official docs
- ✅ SDK approaches that actually work
- ✅ Configuration that solves an issue
- ✅ Version-specific behaviors
- ✅ Mendix project operations (like renaming)

### HOW TO SAVE KNOWLEDGE:
Call add_to_knowledge_base with:
- knowledge_file: appropriate category (best-practices, model-sdk, troubleshooting, etc.)
- category: specific sub-category
- content: JSON string with the actual knowledge (must be valid JSON!)
- source: where you learned it (docs.mendix.com, research, experimentation, etc.)
- verified: true if tested and working

## IMPORTANT CONTEXT

### Active Project: SmartHub
- Folder: D:\\kelly.seale\\CodeBase\\OneTech-main (pending rename)
- File: OneTech.mpr (pending rename to SmartHub)
- Version: Mendix Studio Pro 11+

### SDK Work: Use Model SDK ONLY
- DO NOT use Platform SDK (requires PAT/online)
- Model SDK can work with local .mpr files
- Research mendixmodelsdk package, NOT mendixplatformsdk

## USER'S QUESTION
${question}

---
Remember: If you research and learn ANYTHING new while answering this, you MUST save it with add_to_knowledge_base. The user wants this knowledge base to grow smarter with every interaction.`,
          },
        },
      ],
    };
  }
);

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

async function main() {
  try {
    // Load knowledge base
    logger.info('Loading knowledge base...');
    await knowledgeManager.load();

    // Index for searching
    logger.info('Building search index...');
    const indexStats = searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);
    logger.info('Search index ready', indexStats);

    // Initialize maintenance scheduler
    logger.info('Initializing maintenance scheduler...');
    await maintenanceScheduler.loadState();

    // Run any due maintenance tasks on startup
    const dueTasks = maintenanceScheduler.getScheduledTasks();
    if (dueTasks.length > 0) {
      logger.info('Running due maintenance tasks on startup', { count: dueTasks.length });
      await maintenanceScheduler.runDueMaintenance();
    }

    // Start auto-maintenance (checks every hour, runs tasks when due)
    maintenanceScheduler.startAutoMaintenance(60 * 60 * 1000);

    // Start cache cleanup interval (every hour)
    setInterval(() => {
      cacheManager.cleanup();
    }, 60 * 60 * 1000);

    // Connect to transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Server running and ready', {
      version: '2.1.0',
      knowledgeEntries: knowledgeManager.getStats().totalEntries,
      searchTerms: searchEngine.getStats().indexedTerms,
      maintenanceEnabled: true,
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  maintenanceScheduler.stopAutoMaintenance();
  cacheManager.clear();
  projectLoader.clearAll();
  logger.info('Shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Start server
main().catch((error) => {
  logger.error('Fatal error', { error: error.message, stack: error.stack });
  process.exit(1);
});
