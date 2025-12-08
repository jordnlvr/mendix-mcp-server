const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs-extra');
const path = require('path');

// Paths from environment or defaults
const MENDIX_PROJECT_PATH =
  process.env.MENDIX_PROJECT_PATH || 'D:\\kelly.seale\\CodeBase\\OneTech-main\\OneTech.mpr';
const SDK_TOOLKIT_PATH =
  process.env.MENDIX_SDK_TOOLKIT_PATH ||
  'D:\\Users\\kelly.seale\\VSCode-Dream-Workspace\\Mendix-SDK-Toolkit';

// Knowledge base paths
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');

// Create MCP server
const server = new Server(
  {
    name: 'mendix-expert',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Load knowledge base
let knowledgeBase = {};

async function loadKnowledgeBase() {
  try {
    const knowledgeFiles = [
      'studio-pro.json',
      'model-sdk.json',
      'platform-sdk.json',
      'best-practices.json',
      'troubleshooting.json',
    ];

    for (const file of knowledgeFiles) {
      const filePath = path.join(KNOWLEDGE_DIR, file);
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        const key = path.basename(file, '.json');
        knowledgeBase[key] = data;
      }
    }

    console.error('[Mendix MCP] Knowledge base loaded successfully');
  } catch (error) {
    console.error('[Mendix MCP] Error loading knowledge base:', error);
  }
}

// Load OneTech extracted data
async function loadOneTechData() {
  try {
    const requestHubPath = path.join(
      SDK_TOOLKIT_PATH,
      'extracted-data',
      'RequestHub',
      'RequestHub-DomainModel.json'
    );
    const mainModulePath = path.join(
      SDK_TOOLKIT_PATH,
      'extracted-data',
      'MainModule',
      'MainModule-DomainModel.json'
    );

    if (await fs.pathExists(requestHubPath)) {
      knowledgeBase.requestHub = await fs.readJson(requestHubPath);
    }
    if (await fs.pathExists(mainModulePath)) {
      knowledgeBase.mainModule = await fs.readJson(mainModulePath);
    }

    console.error('[Mendix MCP] OneTech data loaded successfully');
  } catch (error) {
    console.error('[Mendix MCP] Error loading OneTech data:', error);
  }
}

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'mendix://knowledge/studio-pro',
        name: 'Mendix Studio Pro Knowledge',
        description: 'Comprehensive Studio Pro 10.23+ and 11+ knowledge',
        mimeType: 'application/json',
      },
      {
        uri: 'mendix://knowledge/model-sdk',
        name: 'Mendix Model SDK Knowledge',
        description: 'Model SDK API reference and examples',
        mimeType: 'application/json',
      },
      {
        uri: 'mendix://knowledge/best-practices',
        name: 'Mendix Best Practices',
        description: 'Domain modeling, microflows, pages, security best practices',
        mimeType: 'application/json',
      },
      {
        uri: 'mendix://onetech/request-hub',
        name: 'OneTech RequestHub Domain Model',
        description: 'Complete RequestHub module structure from OneTech project',
        mimeType: 'application/json',
      },
      {
        uri: 'mendix://onetech/main-module',
        name: 'OneTech MainModule Domain Model',
        description: 'Complete MainModule structure from OneTech project',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'mendix://knowledge/studio-pro') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase['studio-pro'] || {}, null, 2),
        },
      ],
    };
  }

  if (uri === 'mendix://knowledge/model-sdk') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase['model-sdk'] || {}, null, 2),
        },
      ],
    };
  }

  if (uri === 'mendix://knowledge/best-practices') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase['best-practices'] || {}, null, 2),
        },
      ],
    };
  }

  if (uri === 'mendix://onetech/request-hub') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.requestHub || {}, null, 2),
        },
      ],
    };
  }

  if (uri === 'mendix://onetech/main-module') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(knowledgeBase.mainModule || {}, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_mendix_knowledge',
        description:
          'Query the Mendix knowledge base for specific topics, patterns, or best practices',
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
      },
      {
        name: 'analyze_onetech_entity',
        description: 'Analyze a specific entity from the OneTech project',
        inputSchema: {
          type: 'object',
          properties: {
            module: {
              type: 'string',
              enum: ['RequestHub', 'MainModule'],
              description: 'The module containing the entity',
            },
            entity_name: {
              type: 'string',
              description: 'Name of the entity to analyze',
            },
          },
          required: ['module', 'entity_name'],
        },
      },
      {
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
      },
      {
        name: 'add_to_knowledge_base',
        description:
          'Add new knowledge to the mendix-expert knowledge base (use when research finds information not currently in the knowledge base)',
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
              description:
                'The knowledge content to add (structured JSON matching the file format)',
            },
            source: {
              type: 'string',
              description:
                'Source of the information (e.g., "docs.mendix.com", "Mendix Forum", "expert research")',
            },
          },
          required: ['knowledge_file', 'content', 'source'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'query_mendix_knowledge') {
    // Search knowledge base for topic with better filtering
    const topic = args.topic.toLowerCase();
    const results = [];

    for (const [key, data] of Object.entries(knowledgeBase)) {
      // Skip non-knowledge entries (OneTech data)
      if (key === 'requestHub' || key === 'mainModule') continue;

      // Search in the stringified data
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes(topic)) {
        // For best-practices, extract relevant categories
        if (key === 'best-practices' && data.categories) {
          const relevantCategories = {};
          for (const [catName, catData] of Object.entries(data.categories)) {
            const catStr = JSON.stringify(catData).toLowerCase();
            if (catStr.includes(topic)) {
              relevantCategories[catName] = catData;
            }
          }
          if (Object.keys(relevantCategories).length > 0) {
            results.push({
              source: key,
              relevant_categories: relevantCategories,
              expert_tips: data.expert_tips?.filter((tip) =>
                JSON.stringify(tip).toLowerCase().includes(topic)
              ),
              common_mistakes: data.common_mistakes?.filter((mistake) =>
                JSON.stringify(mistake).toLowerCase().includes(topic)
              ),
            });
          }
        } else {
          results.push({ source: key, data });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text:
            results.length > 0
              ? JSON.stringify(results, null, 2)
              : `No specific knowledge found for "${args.topic}". Try broader terms like "microflow", "domain modeling", "security", "performance", etc.`,
        },
      ],
    };
  }

  if (name === 'analyze_onetech_entity') {
    const moduleKey = args.module === 'RequestHub' ? 'requestHub' : 'mainModule';
    const moduleData = knowledgeBase[moduleKey];

    if (moduleData && moduleData.entities) {
      const entity = moduleData.entities.find((e) => e.name === args.entity_name);
      if (entity) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(entity, null, 2),
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Entity '${args.entity_name}' not found in ${args.module}`,
        },
      ],
    };
  }

  if (name === 'get_best_practice') {
    const scenario = args.scenario.toLowerCase();
    const bestPractices = knowledgeBase['best-practices'] || {};

    // Search through categories for matching practices
    const results = [];
    if (bestPractices.categories) {
      for (const [categoryName, practices] of Object.entries(bestPractices.categories)) {
        if (Array.isArray(practices)) {
          const matching = practices.filter((p) =>
            JSON.stringify(p).toLowerCase().includes(scenario)
          );
          if (matching.length > 0) {
            results.push({
              category: categoryName,
              practices: matching,
            });
          }
        }
      }
    }

    // Also check expert tips and common mistakes
    const tips =
      bestPractices.expert_tips?.filter((tip) =>
        JSON.stringify(tip).toLowerCase().includes(scenario)
      ) || [];

    const mistakes =
      bestPractices.common_mistakes?.filter((mistake) =>
        JSON.stringify(mistake).toLowerCase().includes(scenario)
      ) || [];

    const response = {
      scenario: args.scenario,
      matching_practices: results,
      expert_tips: tips.length > 0 ? tips : undefined,
      common_mistakes: mistakes.length > 0 ? mistakes : undefined,
    };

    return {
      content: [
        {
          type: 'text',
          text:
            results.length > 0 || tips.length > 0 || mistakes.length > 0
              ? JSON.stringify(response, null, 2)
              : `No best practice found for: ${args.scenario}. Try terms like "error handling", "performance", "security", "domain modeling", etc.`,
        },
      ],
    };
  }

  if (name === 'add_to_knowledge_base') {
    const { knowledge_file, category, content, source } = args;
    const filePath = path.join(knowledgeDir, `${knowledge_file}.json`);

    try {
      // Read current file
      const currentData = await fs.readJSON(filePath);

      // Add metadata to the content
      const enhancedContent = {
        ...content,
        _metadata: {
          added_at: new Date().toISOString(),
          source: source,
          added_by: 'mendix-expert-mcp',
        },
      };

      // If category specified, add to that category
      if (category && currentData.categories) {
        if (!currentData.categories[category]) {
          currentData.categories[category] = [];
        }

        // Ensure it's an array
        if (!Array.isArray(currentData.categories[category])) {
          currentData.categories[category] = [currentData.categories[category]];
        }

        currentData.categories[category].push(enhancedContent);
      } else {
        // Add to root level or appropriate section
        if (!currentData.items) {
          currentData.items = [];
        }
        currentData.items.push(enhancedContent);
      }

      // Write back to file with formatting
      await fs.writeJSON(filePath, currentData, { spaces: 2 });

      // Reload knowledge base
      knowledgeBase = await loadKnowledgeBase();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully added knowledge to ${knowledge_file}.json${
              category ? ` in category "${category}"` : ''
            }.\n\nKnowledge base has been reloaded. The new information is now available for queries.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to add knowledge: ${error.message}\n\nPlease ensure the JSON structure matches the file format and try again.`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'mendix_expert',
        description:
          'Act as a Mendix expert with deep knowledge of Studio Pro, SDKs, and the OneTech project',
        arguments: [
          {
            name: 'question',
            description: 'Your Mendix development question',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'mendix_expert') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a Mendix expert with access to a comprehensive knowledge base through the mendix-expert MCP server.

KNOWLEDGE BASE AVAILABLE:
- Mendix Studio Pro 10.23+ and 11+ (196.85 KB of expert knowledge)
- Mendix Model SDK and Platform SDK complete references
- 50+ best practices across 8 categories (domain modeling, microflows, pages, security, performance, architecture, testing, deployment)
- 100+ documented patterns and anti-patterns
- 50+ expert tips from Mendix MVPs
- 25+ real-world case studies
- Troubleshooting guides for common issues
- OneTech project structure (RequestHub and MainModule domain models)

📋 INSTRUCTIONS FOR USING THE KNOWLEDGE BASE:

STEP 1 - CHECK YOUR KNOWLEDGE:
First, use the mendix-expert MCP tools to query the knowledge base:
- Call 'query_mendix_knowledge' with the user's topic
- Call 'get_best_practice' for specific scenarios
- Call 'analyze_onetech_entity' if relevant to OneTech project

STEP 2 - EVALUATE WHAT YOU FOUND:
✅ If you get GOOD, COMPREHENSIVE information from the knowledge base:
   → Use it to provide a detailed answer to the user
   → Include examples, best practices, and expert tips from the knowledge base
   → Cite that this came from the mendix-expert knowledge base

❌ If the knowledge base returns EMPTY or INSUFFICIENT information:
   → Acknowledge: "The mendix-expert knowledge base doesn't have detailed information on this topic yet."
   → Perform COMPREHENSIVE DEEP RESEARCH from ALL available sources:
     
     📚 OFFICIAL SOURCES (Start here):
     * docs.mendix.com (official documentation)
     * Mendix Academy (academy.mendix.com - training materials, courses)
     * Mendix Forum (forum.mendix.com - community discussions, verified solutions)
     * Mendix Marketplace (marketplace.mendix.com - module docs, examples)
     * Mendix Blog (mendix.com/blog - official articles, announcements)
     * Mendix GitHub (github.com/mendix - official repos, code examples)
     
     🌐 COMMUNITY & EXPERT SOURCES (Deep dive here):
     * Medium articles about Mendix (medium.com - expert tutorials, case studies)
     * Dev.to Mendix posts (dev.to - developer stories, tips)
     * Stack Overflow Mendix questions (stackoverflow.com/questions/tagged/mendix)
     * YouTube Mendix channels (search: Mendix tutorials, conference talks, demos)
     * LinkedIn Mendix posts (linkedin.com - expert insights, MVPs, thought leaders)
     * Twitter/X Mendix community (#mendix, @mendix - latest discussions)
     * Reddit r/mendix (reddit.com/r/mendix - community help)
     
     🎓 EXPERT BLOGS & SITES:
     * Personal blogs from Mendix MVPs and experts
     * Company tech blogs using Mendix
     * Consulting firm Mendix resources
     * Academic papers and research on low-code/Mendix
     
     💡 ADDITIONAL SOURCES:
     * Mendix World conference recordings (mendixworld.com)
     * Mendix webinars and workshops
     * SlideShare presentations about Mendix
     * Gartner/Forrester reports on low-code (for context)
     * GitHub Gists with Mendix code snippets
     * CodePen/JSFiddle examples (for custom widgets)
     
     🔍 SEARCH STRATEGY:
     * Use multiple search engines (Google, Bing, DuckDuckGo)
     * Try various keyword combinations
     * Look for recent AND historical content (patterns change over versions)
     * Verify information from multiple sources
     * Prioritize Mendix 10.23+ and 11.x version-specific info
     
   → After researching, ADD TO KNOWLEDGE BASE automatically using the 'add_to_knowledge_base' tool:
     * Choose appropriate knowledge_file: best-practices, studio-pro, model-sdk, platform-sdk, troubleshooting, advanced-patterns, performance-guide, or security-guide
     * Specify category if applicable (e.g., "microflows", "domain_modeling", "security")
     * Provide structured content matching the file's format
     * Include source URL(s) for reference
   → Then provide the answer to the user

STEP 3 - RESPOND TO USER:
Structure your response:
1. 🔍 **Knowledge Base Check**: What you found (or didn't find)
2. 📚 **Answer**: Comprehensive answer using knowledge base OR researched information
3. ✅ **Knowledge Base Updated** (if research was needed): Confirm the new knowledge was added

USER'S QUESTION: ${args.question}

REMEMBER: Use the 'add_to_knowledge_base' tool to AUTOMATICALLY add researched information. This makes the knowledge base grow with every gap discovered, improving future answers for all users.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Start server
async function main() {
  await loadKnowledgeBase();
  await loadOneTechData();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[Mendix MCP] Server running and ready');
}

main().catch(console.error);
