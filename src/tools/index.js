/**
 * Tool implementations for MCP server
 * Modular, testable tool handlers
 */

const Logger = require('../utils/logger');
const { validateString, ValidationError } = require('../utils/validator');

/**
 * QueryTool - Search knowledge base
 */
class QueryTool {
  constructor(knowledgeManager, searchEngine) {
    this.logger = new Logger('QueryTool');
    this.knowledgeManager = knowledgeManager;
    this.searchEngine = searchEngine;
  }

  async execute(args) {
    try {
      const topic = validateString(args.topic, 'topic', { required: true });
      const detailLevel = args.detail_level || 'basic';

      this.logger.info('Querying knowledge', { topic, detailLevel });

      // Use search engine for better results
      const searchResults = this.searchEngine.search(topic, {
        maxResults: detailLevel === 'expert' ? 20 : 10,
        minScore: detailLevel === 'basic' ? 0.5 : 0.3,
      });

      if (searchResults.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No specific knowledge found for "${topic}". Try broader terms like "microflow", "domain modeling", "security", "performance", etc.`,
            },
          ],
        };
      }

      // Format results based on detail level
      const formatted = this._formatResults(searchResults, detailLevel);

      // Record usage
      for (const result of searchResults) {
        if (result.entry._metadata?.id) {
          await this.knowledgeManager.recordUsage(result.file, result.entry._metadata.id);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Query failed', { error: error.message });
      return {
        content: [
          {
            type: 'text',
            text: `Query failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  _formatResults(results, detailLevel) {
    const sections = [];

    sections.push(`# Search Results (${results.length} matches)\n`);

    for (const result of results) {
      const { file, category, entry, score } = result;

      sections.push(`## ${entry.practice || entry.feature || entry.topic || 'Knowledge Entry'}`);
      sections.push(`**Source:** ${file}${category ? ` > ${category}` : ''}`);
      sections.push(`**Relevance:** ${(score * 100).toFixed(0)}%`);

      if (detailLevel !== 'basic' && entry._metadata) {
        const quality = entry._metadata.quality_score;
        if (quality) {
          sections.push(`**Quality:** ${(quality * 100).toFixed(0)}%`);
        }
      }

      sections.push('');
      sections.push(JSON.stringify(entry, null, 2));
      sections.push('\n---\n');
    }

    return sections.join('\n');
  }

  getSchema() {
    return {
      name: 'query_mendix_knowledge',
      description:
        'Query the Mendix knowledge base for specific topics, patterns, or best practices. Uses advanced search with relevance scoring.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description:
              'The Mendix topic to query (e.g., "domain modeling", "microflows", "security")',
          },
          detail_level: {
            type: 'string',
            enum: ['basic', 'detailed', 'expert'],
            description: 'Level of detail in the response',
          },
        },
        required: ['topic'],
      },
    };
  }
}

/**
 * AnalyzeTool - Analyze Mendix project entities
 */
class AnalyzeTool {
  constructor(projectLoader) {
    this.logger = new Logger('AnalyzeTool');
    this.projectLoader = projectLoader;
  }

  async execute(args) {
    try {
      const projectPath = validateString(args.project_path, 'project_path', {
        required: true,
      });
      const moduleName = args.module_name ? validateString(args.module_name, 'module_name') : null;
      const entityName = args.entity_name ? validateString(args.entity_name, 'entity_name') : null;

      this.logger.info('Analyzing project', { projectPath, moduleName, entityName });

      // Load project
      const project = await this.projectLoader.loadProject(projectPath);

      // If specific module and entity requested
      if (moduleName && entityName) {
        const entity = this.projectLoader.getEntity(projectPath, moduleName, entityName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      }

      // If specific module requested
      if (moduleName) {
        const module = this.projectLoader.getModule(projectPath, moduleName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(module, null, 2),
            },
          ],
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
        content: [
          {
            type: 'text',
            text: JSON.stringify(overview, null, 2),
          },
        ],
      };
    } catch (error) {
      this.logger.error('Analysis failed', { error: error.message });
      return {
        content: [
          {
            type: 'text',
            text: `Analysis failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  getSchema() {
    return {
      name: 'analyze_project',
      description:
        'Analyze a Mendix project from any .mpr file or extracted data directory. Dynamically discovers modules and entities.',
      inputSchema: {
        type: 'object',
        properties: {
          project_path: {
            type: 'string',
            description: 'Path to .mpr file or extracted data directory',
          },
          module_name: {
            type: 'string',
            description: 'Optional: specific module to analyze',
          },
          entity_name: {
            type: 'string',
            description: 'Optional: specific entity to analyze (requires module_name)',
          },
        },
        required: ['project_path'],
      },
    };
  }
}

/**
 * BestPracticeTool - Get best practices
 */
class BestPracticeTool {
  constructor(knowledgeManager, searchEngine) {
    this.logger = new Logger('BestPracticeTool');
    this.knowledgeManager = knowledgeManager;
    this.searchEngine = searchEngine;
  }

  async execute(args) {
    try {
      const scenario = validateString(args.scenario, 'scenario', { required: true });

      this.logger.info('Getting best practice', { scenario });

      // Search specifically in best-practices file
      const results = this.searchEngine.search(scenario, {
        files: ['best-practices'],
        maxResults: 5,
        minScore: 0.4,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No best practice found for: ${scenario}. Try terms like "error handling", "performance", "security", "domain modeling", etc.`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r) => `## ${r.entry.practice || r.entry.topic || 'Best Practice'}

**Relevance:** ${(r.score * 100).toFixed(0)}%

${JSON.stringify(r.entry, null, 2)}

---
`
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to get best practice', { error: error.message });
      return {
        content: [
          {
            type: 'text',
            text: `Failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  getSchema() {
    return {
      name: 'get_best_practice',
      description: 'Get best practice recommendations for a specific Mendix development scenario',
      inputSchema: {
        type: 'object',
        properties: {
          scenario: {
            type: 'string',
            description:
              'The development scenario (e.g., "many-to-many relationship", "security rules", "performance optimization")',
          },
        },
        required: ['scenario'],
      },
    };
  }
}

/**
 * AddKnowledgeTool - Add knowledge to knowledge base
 */
class AddKnowledgeTool {
  constructor(knowledgeManager, searchEngine) {
    this.logger = new Logger('AddKnowledgeTool');
    this.knowledgeManager = knowledgeManager;
    this.searchEngine = searchEngine;
  }

  async execute(args) {
    try {
      const { knowledge_file, category, content, source } = args;

      this.logger.info('Adding knowledge', { file: knowledge_file, category });

      const result = await this.knowledgeManager.add(knowledge_file, category, content, source, {
        addedBy: 'mendix-expert-mcp',
        mergeDuplicates: true,
      });

      // Reload knowledge base and re-index
      await this.knowledgeManager.reload();
      this.searchEngine.clear();
      const knowledgeBase = this.knowledgeManager.knowledgeBase;
      this.searchEngine.indexKnowledgeBase(knowledgeBase);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully added knowledge to ${knowledge_file}.json${
              category ? ` in category "${category}"` : ''
            }.

Entry ID: ${result.id}
Quality Score: ${(result.qualityScore * 100).toFixed(0)}%

Knowledge base has been reloaded and re-indexed. The new information is now available for queries.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Failed to add knowledge', { error: error.message });
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

  getSchema() {
    return {
      name: 'add_to_knowledge_base',
      description:
        'Add new knowledge to the mendix-expert knowledge base with automatic quality scoring and duplicate detection',
      inputSchema: {
        type: 'object',
        properties: {
          knowledge_file: {
            type: 'string',
            enum: [
              'best-practices',
              'studio-pro',
              'model-sdk',
              'platform-sdk',
              'troubleshooting',
              'advanced-patterns',
              'performance-guide',
              'security-guide',
            ],
            description: 'Which knowledge base file to update',
          },
          category: {
            type: 'string',
            description:
              'The category within the file (e.g., "microflows", "domain_modeling", "security")',
          },
          content: {
            type: 'object',
            description: 'The knowledge content to add (structured JSON matching the file format)',
          },
          source: {
            type: 'string',
            description:
              'Source of the information (e.g., "docs.mendix.com", "Mendix Forum", "expert research")',
          },
        },
        required: ['knowledge_file', 'content', 'source'],
      },
    };
  }
}

module.exports = {
  QueryTool,
  AnalyzeTool,
  BestPracticeTool,
  AddKnowledgeTool,
};
