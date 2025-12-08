/**
 * Smithery Entry Point - Simplified for Smithery Deployment
 * 
 * This is a standalone MCP server that works with Smithery's bundler.
 * It includes embedded knowledge for reliable operation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Configuration schema for Smithery session config
export const configSchema = z.object({
  debug: z.boolean().default(false).describe('Enable debug logging'),
});

// Embedded knowledge base (core entries for Smithery deployment)
const KNOWLEDGE_BASE = [
  {
    id: 'mf-loops',
    topic: 'Microflow Loops and Iteration',
    category: 'microflows',
    content: `To iterate over a list in a microflow, use the Loop activity with IterableList on the loopSource property. Never use the deprecated loopVariableName. Inside the loop, use the iterator object to access each item. For counting items, use AggregateListAction - there is NO length() function in microflows. Example pattern: Create List → Loop (IterableList) → Process Item → Optional: Aggregate for count.`,
    tags: ['microflow', 'loop', 'iteration', 'list'],
  },
  {
    id: 'mf-naming',
    topic: 'Microflow Naming Conventions',
    category: 'best-practices',
    content: `Microflow naming prefixes: ACT_ for button clicks/user actions (e.g., ACT_SubmitRequest), DS_ for widget data sources (e.g., DS_GetOpenRequests), SUB_ for helper/sub-microflows (e.g., SUB_ValidateInput), VAL_ for validation microflows, OCH_ for on-change handlers, BCO_/ACO_ for before/after commit events, ASU_ for after startup microflows.`,
    tags: ['naming', 'conventions', 'microflow', 'best-practices'],
  },
  {
    id: 'sdk-working-copy',
    topic: 'Platform SDK Working Copy Pattern',
    category: 'sdk',
    content: `To modify a Mendix app via Platform SDK: 1) Get app reference: const app = client.getApp('app-id'); 2) Create working copy: const workingCopy = await app.createTemporaryWorkingCopy('main'); 3) Open model: const model = await workingCopy.openModel(); 4) Make changes to model elements; 5) Flush changes: await model.flushChanges(); 6) Commit: await workingCopy.commitToRepository('main', { commitMessage: 'Description' });`,
    tags: ['sdk', 'platform-sdk', 'working-copy', 'commit'],
  },
  {
    id: 'sdk-flows',
    topic: 'SDK: Delete Flows Before Activities',
    category: 'sdk',
    content: `CRITICAL SDK PATTERN: When modifying microflows via SDK, always delete flows BEFORE deleting activities. Flows reference activities, so deleting activities first causes dangling references. Pattern: 1) Collect flows to delete, 2) flow.delete() for each, 3) Then delete activities. This applies to SequenceFlow, all flow types.`,
    tags: ['sdk', 'microflow', 'flows', 'deletion'],
  },
  {
    id: 'domain-associations',
    topic: 'Domain Model Association Best Practices',
    category: 'best-practices',
    content: `Association types: Use 1-* (one-to-many) for parent-child relationships like Order→OrderLines. Use *-* (many-to-many) for bidirectional relationships like Student↔Course. Use 1-1 for optional extensions like User→UserProfile. Always set delete behavior appropriately. Index foreign keys for performance. Document the purpose of each association.`,
    tags: ['domain-model', 'associations', 'best-practices'],
  },
  {
    id: 'security-roles',
    topic: 'Module Role Security Pattern',
    category: 'security',
    content: `Every microflow needs allowedModuleRoles configured. Create module roles that map to user roles (Admin, User, Guest). Set entity access per role (CRUD). Use XPath constraints for row-level security. Never expose microflows without role restrictions in production. Test with each role to verify access.`,
    tags: ['security', 'roles', 'access', 'best-practices'],
  },
  {
    id: 'rest-integration',
    topic: 'REST API Integration',
    category: 'integration',
    content: `For REST integrations: 1) Use Published REST Service for exposing APIs (configure in Project Explorer → Add Other → Published REST Service). 2) Use Call REST action in microflows for consuming external APIs. 3) Create JSON structures and Import Mappings for response handling. 4) Always handle errors with error handlers in microflows. 5) Use constants for base URLs to support different environments.`,
    tags: ['rest', 'api', 'integration', 'http'],
  },
  {
    id: 'performance-lists',
    topic: 'Performance: Working with Lists',
    category: 'performance',
    content: `Performance tips for lists: 1) Use XPath constraints to limit retrieved data at source. 2) Avoid retrieving all objects then filtering in microflow. 3) Use Aggregate activities instead of loops for counting/summing. 4) Index attributes used in XPath constraints. 5) Use pagination for large data sets in UI. 6) Consider using OQL for complex queries.`,
    tags: ['performance', 'lists', 'xpath', 'optimization'],
  },
  {
    id: 'widgets-pluggable',
    topic: 'Pluggable Widget Development',
    category: 'widgets',
    content: `Pluggable widgets use React + TypeScript. Key interfaces: ListValue for list data sources, ListAttributeValue for accessing attributes, ActionValue for triggering actions, EditableValue for two-way binding. Widget XML defines properties shown in Studio Pro. Use @mendix/widget-plugin-* packages for common functionality. Test with different data scenarios.`,
    tags: ['widgets', 'pluggable', 'react', 'typescript'],
  },
  {
    id: 'atlas-theming',
    topic: 'Atlas UI Theming',
    category: 'styling',
    content: `Atlas 3 structure: themesource/[module]/web/ contains _design-properties.json, _exclusion-variables.scss, main.scss. Customization order: 1) Use design properties in Studio Pro. 2) Create custom SCSS in theme/web/custom-variables.scss. 3) Override Atlas variables. 4) Create design tokens for consistency. 100+ exclusion variables available to remove unused styles.`,
    tags: ['atlas', 'theming', 'scss', 'styling'],
  },
];

// Simple TF-IDF-like search
function searchKnowledge(query, limit = 5) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  const scored = KNOWLEDGE_BASE.map(entry => {
    const text = `${entry.topic} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
    let score = 0;
    
    for (const term of queryTerms) {
      if (text.includes(term)) {
        score += 1;
        // Boost for exact topic match
        if (entry.topic.toLowerCase().includes(term)) score += 2;
        // Boost for tag match
        if (entry.tags.some(t => t.includes(term))) score += 1.5;
      }
    }
    
    return { entry, score: score / queryTerms.length };
  });
  
  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Create and configure the Mendix Expert MCP Server
 */
export default function createServer({ config }) {
  const debug = config?.debug || false;
  
  const server = new McpServer({
    name: 'mendix-expert',
    version: '2.4.3',
  });

  // Tool 1: Query Knowledge
  server.tool(
    'query_mendix_knowledge',
    'Search the Mendix knowledge base for SDK patterns, best practices, and troubleshooting',
    {
      topic: z.string().describe('Search topic (e.g., "microflow loops", "REST integration")'),
      max_results: z.number().min(1).max(10).default(5).describe('Maximum results to return'),
    },
    async ({ topic, max_results }) => {
      const results = searchKnowledge(topic, max_results);
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No results found for "${topic}". Try different keywords or check docs.mendix.com directly.\n\nAvailable topics include: microflow loops, naming conventions, SDK patterns, REST integration, performance, security, widgets, theming.`,
          }],
        };
      }
      
      const formatted = results.map((r, i) => {
        return `### ${i + 1}. ${r.entry.topic}\n**Category:** ${r.entry.category} | **Relevance:** ${(r.score * 100).toFixed(0)}%\n\n${r.entry.content}\n\n**Tags:** ${r.entry.tags.join(', ')}`;
      }).join('\n\n---\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `## Mendix Knowledge: "${topic}"\n\n${formatted}`,
        }],
      };
    }
  );

  // Tool 2: Get Best Practice
  server.tool(
    'get_best_practice',
    'Get Mendix best practice recommendations for a specific scenario',
    {
      scenario: z.string().describe('The scenario (e.g., "naming microflows", "securing APIs")'),
    },
    async ({ scenario }) => {
      const results = searchKnowledge(scenario + ' best practices', 3);
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No specific best practices found for "${scenario}". Check https://docs.mendix.com/refguide/community-best-practices-for-app-performance/ for official guidelines.`,
          }],
        };
      }
      
      const formatted = results.map(r => `### ${r.entry.topic}\n${r.entry.content}`).join('\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `## Best Practices: ${scenario}\n\n${formatted}`,
        }],
      };
    }
  );

  // Tool 3: List Available Topics
  server.tool(
    'list_knowledge_topics',
    'List all available knowledge topics in the Mendix expert knowledge base',
    {},
    async () => {
      const topics = KNOWLEDGE_BASE.map(e => `- **${e.topic}** (${e.category})`).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `## Available Knowledge Topics\n\n${topics}\n\n*Use query_mendix_knowledge to search for specific topics.*`,
        }],
      };
    }
  );

  // Tool 4: Get SDK Pattern
  server.tool(
    'get_sdk_pattern',
    'Get Mendix Platform SDK code patterns and examples',
    {
      pattern: z.string().describe('SDK pattern to look up (e.g., "working copy", "microflow modification")'),
    },
    async ({ pattern }) => {
      const results = searchKnowledge('sdk ' + pattern, 3);
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No SDK pattern found for "${pattern}". Check https://docs.mendix.com/apidocs-mxsdk/mxsdk/ for the official SDK documentation.`,
          }],
        };
      }
      
      const formatted = results.map(r => `### ${r.entry.topic}\n${r.entry.content}`).join('\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `## SDK Pattern: ${pattern}\n\n${formatted}`,
        }],
      };
    }
  );

  if (debug) {
    console.log('Mendix Expert MCP Server initialized with', KNOWLEDGE_BASE.length, 'knowledge entries');
  }

  return server.server;
}
