#!/usr/bin/env node
/**
 * Cloud Proxy MCP Server
 *
 * Lightweight local MCP server that forwards all requests to the cloud-hosted
 * mendix-expert API. No local database, no credentials needed - just HTTP forwarding.
 *
 * Usage:
 *   node src/cloud-proxy.js
 *
 * Configure in VS Code settings.json or Claude Desktop config:
 *   "mendix-expert": {
 *     "command": "node",
 *     "args": ["path/to/cloud-proxy.js"]
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Cloud API endpoint
const CLOUD_API =
  process.env.MENDIX_EXPERT_API || 'https://mendix-mcp-server-production.up.railway.app';

/**
 * Make HTTP request to cloud API
 */
async function callCloudAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${CLOUD_API}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    return { error: error.message, cloudApi: CLOUD_API };
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'mendix-expert-cloud',
    version: '3.5.4',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
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
      },
      {
        name: 'search_knowledge',
        description:
          'Hybrid search combining keyword and semantic vector search. Returns quality indicators and web search recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_best_practice',
        description:
          'Get best practice recommendations for a specific Mendix development scenario.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario: {
              type: 'string',
              description:
                'The development scenario (e.g., "many-to-many relationship", "error handling")',
            },
          },
          required: ['scenario'],
        },
      },
      {
        name: 'add_to_knowledge_base',
        description:
          'Add new knowledge to the knowledge base. Content must be related to Mendix or relevant development topics.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title for the knowledge entry',
            },
            content: {
              type: 'string',
              description: 'The knowledge content (min 50 chars)',
            },
            category: {
              type: 'string',
              description: 'Category (e.g., best-practices, troubleshooting)',
            },
            source: {
              type: 'string',
              description: 'Source of the information',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'get_server_status',
        description: 'Get the status of the cloud-hosted mendix-expert server.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls by forwarding to cloud API
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result;

  switch (name) {
    case 'query_mendix_knowledge':
      result = await callCloudAPI('/query', 'POST', {
        topic: args.topic,
        detail_level: args.detail_level || 'detailed',
      });
      break;

    case 'search_knowledge':
      result = await callCloudAPI('/search', 'POST', {
        query: args.query,
        limit: args.limit || 10,
      });
      break;

    case 'get_best_practice':
      result = await callCloudAPI('/best-practice', 'POST', {
        scenario: args.scenario,
      });
      break;

    case 'add_to_knowledge_base':
      result = await callCloudAPI('/learn', 'POST', {
        title: args.title,
        content: args.content,
        category: args.category || 'learned',
        source: args.source || 'mcp-cloud-proxy',
      });
      break;

    case 'get_server_status':
      result = await callCloudAPI('/health', 'GET');
      result.proxyMode = true;
      result.cloudApi = CLOUD_API;
      break;

    default:
      result = { error: `Unknown tool: ${name}` };
  }

  // Format response
  let text;
  if (result.error) {
    text = `❌ Error: ${result.error}`;
  } else if (name === 'get_server_status') {
    text =
      `☁️ **Cloud Mendix Expert Status**\n\n` +
      `- Status: ${result.status}\n` +
      `- Entries: ${result.entries}\n` +
      `- Vector Search: ${result.vectorSearchAvailable ? 'Available' : 'Unavailable'}\n` +
      `- Storage: ${result.storage}\n` +
      `- Cloud API: ${CLOUD_API}\n` +
      `- Proxy Mode: Active`;
  } else {
    text = JSON.stringify(result, null, 2);
  }

  return {
    content: [{ type: 'text', text }],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`☁️ Mendix Expert Cloud Proxy started - forwarding to ${CLOUD_API}`);
}

main().catch((error) => {
  console.error('Failed to start cloud proxy:', error);
  process.exit(1);
});
