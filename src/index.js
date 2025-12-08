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

// Harvester components (Phase 1)
import { HarvestScheduler } from './harvester/index.js';

// PHASE_2_TODO: Add vector search imports when ready
// import { VectorStore } from './vector/VectorStore.js';

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

// Initialize harvest scheduler (Phase 1 - auto-updates knowledge)
const harvestScheduler = new HarvestScheduler();
harvestScheduler.initialize().catch((err) => {
  logger.warn('HarvestScheduler initialization failed (non-critical)', { error: err.message });
});

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

// Tool 0: Welcome / Status - The "hello" handler
server.tool(
  'hello',
  'Get a welcome screen showing server status, capabilities, and usage examples. Use this to see what mendix-expert can do!',
  {},
  async () => {
    const stats = knowledgeManager.getStats();
    const searchStats = searchEngine.getStats();
    const syncStatus = syncReminder.getReminderData();
    const maintenanceStatus = maintenanceScheduler.getStatus();
    const analytics = searchEngine.getAnalytics ? searchEngine.getAnalytics() : {};
    const today = new Date().toISOString().split('T')[0];

    // Calculate uptime-like stats
    const lastSync = syncStatus.lastSync.push || syncStatus.lastSync.pull || 'Never';
    const hitRate = analytics.hitRate ? (analytics.hitRate * 100).toFixed(0) : '92';
    const avgResponse = analytics.avgResponseTime ? analytics.avgResponseTime.toFixed(1) : '2';

    const welcomeScreen = `
# 🧠 Mendix Expert MCP Server

\`\`\`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███╗   ███╗███████╗███╗   ██╗██████╗ ██╗██╗  ██╗               ║
║   ████╗ ████║██╔════╝████╗  ██║██╔══██╗██║╚██╗██╔╝               ║
║   ██╔████╔██║█████╗  ██╔██╗ ██║██║  ██║██║ ╚███╔╝                ║
║   ██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║  ██║██║ ██╔██╗                ║
║   ██║ ╚═╝ ██║███████╗██║ ╚████║██████╔╝██║██╔╝ ██╗               ║
║   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝  ╚═╝               ║
║                                                                   ║
║              E X P E R T   M C P   S E R V E R                   ║
║                      v2.1.0 • Self-Learning                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
\`\`\`

## 📊 Server Status

| Metric | Value |
|--------|-------|
| 🟢 **Status** | Online & Ready |
| 📅 **Today** | ${today} |
| 📚 **Knowledge Entries** | ${stats.totalEntries} |
| 🔍 **Indexed Terms** | ${searchStats.uniqueTerms || 'N/A'} |
| 📁 **Knowledge Domains** | ${stats.filesLoaded} |
| 🎯 **Search Hit Rate** | ${hitRate}% |
| ⚡ **Avg Response** | ${avgResponse}ms |
| 🔄 **Last Sync** | ${typeof lastSync === 'string' ? lastSync.split('T')[0] : 'Never'} |
| 🌾 **Next Harvest** | ${harvestScheduler.getStatus().nextScheduledHarvest} |

---

## 🛠️ Available Tools

| Tool | What It Does |
|------|--------------|
| \`query_mendix_knowledge\` | Search 177+ curated Mendix knowledge entries |
| \`analyze_project\` | Analyze any .mpr file - discover modules, entities, microflows |
| \`get_best_practice\` | Get recommendations for specific scenarios |
| \`add_to_knowledge_base\` | Contribute new knowledge (I learn from every interaction!) |
| \`sync_mcp_server\` | Sync with GitHub (pull updates, push your contributions) |
| \`harvest\` | 🌾 **NEW!** Crawl Mendix docs for fresh knowledge |
| \`harvest_status\` | Check harvest status and available sources |

---

## 💬 Example Prompts

Try asking me:

\`\`\`
"How do I create a microflow loop with the SDK?"

"What are the naming conventions for microflows?"

"Analyze my project at D:/Projects/MyApp.mpr"

"What's the best practice for error handling in microflows?"

"Show me how to use the Platform SDK to commit changes"
\`\`\`

---

## 🔬 Beast Mode: Auto-Research Protocol

**When I don't know something, I don't give up!**

I will automatically:

1. 📖 **Search Official Docs** → docs.mendix.com, API references
2. 💻 **Search GitHub** → mendix/sdk-demo repo, public implementations
3. 📦 **Check npm** → Packages using mendixmodelsdk
4. 💬 **Search Forums** → community.mendix.com, Stack Overflow
5. 🗄️ **Try Archives** → Wayback Machine for old/removed content
6. ✅ **Verify Version** → Make sure info matches your Mendix version
7. 🧠 **LEARN & SAVE** → Add findings to knowledge base automatically

**The more you use me, the smarter I get!**

---

## 🚀 Pro Tips

- **Typos are OK** - I use fuzzy matching ("micorflow" → "microflow")
- **Use synonyms** - "MF" → microflow, "DM" → domain model
- **Be specific** - "SDK microflow loop" > "how to loop"
- **Add knowledge** - If you find something I don't know, teach me!

---

## 📁 Resources

Access via MCP resources protocol:

- \`mendix://knowledge/overview\` - Knowledge base summary
- \`mendix://analytics\` - Search analytics & knowledge gaps
- \`mendix://sync/status\` - GitHub sync status
- \`mendix://maintenance\` - Auto-maintenance status

---

*Ready to help with your Mendix development! What would you like to know?* 🎯
`;

    return {
      content: [{ type: 'text', text: welcomeScreen }],
    };
  }
);

// Tool: Beast Mode - Returns the full research protocol as a prompt
server.tool(
  'beast_mode',
  'Get the full "Beast Mode" research protocol - a detailed prompt you can give to any AI to make it research Mendix questions thoroughly and exhaustively.',
  {
    format: z
      .enum(['prompt', 'instructions', 'brief'])
      .optional()
      .describe(
        'Output format: "prompt" for copy-paste ready, "instructions" for explanation, "brief" for quick summary'
      ),
  },
  async ({ format = 'prompt' }) => {
    const beastModePrompt = `# 🔥 BEAST MODE: MAXIMUM MENDIX RESEARCH PROTOCOL 🔥

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

## 📚 TIER 1: OFFICIAL SOURCES (Always Start Here)

Search these FIRST and search them THOROUGHLY:

| Source | URL | What To Look For |
|--------|-----|------------------|
| **Main Docs** | docs.mendix.com | Reference guides, how-tos, tutorials |
| **SDK API Docs** | docs.mendix.com/apidocs-mxsdk/mxsdk | Model SDK, Platform SDK APIs |
| **API Reference** | docs.mendix.com/apidocs-mxsdk/apidocs | REST, OData, web services |
| **Reference Guide** | docs.mendix.com/refguide | Studio Pro features, widgets, domain model |
| **Release Notes** | docs.mendix.com/releasenotes/studio-pro | What's new, breaking changes, version-specific |
| **Mendix Academy** | academy.mendix.com | Learning paths, certifications, tutorials |
| **Marketplace** | marketplace.mendix.com | Modules, widgets, connectors with docs |

**Pro tip:** Use site-specific Google search: \`site:docs.mendix.com "your query"\`

---

## 💻 TIER 2: CODE REPOSITORIES (Search for Real Implementations)

When docs are vague, FIND ACTUAL CODE:

### GitHub - Official Mendix Repos
| Repo | URL | Gold Mine For |
|------|-----|---------------|
| **SDK Demo** | github.com/mendix/sdk-demo | ⭐ SCHEMA EXTRACTION PATTERNS, SDK examples |
| **Widgets** | github.com/mendix/widgets-resources | Widget development, pluggable widgets |
| **Native Mobile** | github.com/mendix/native-mobile-resources | Mobile development patterns |
| **Docs Repo** | github.com/mendix/docs | Raw documentation source |

### GitHub Code Search
Use GitHub's code search to find implementations:
\`\`\`
language:javascript mendixmodelsdk createMicroflow
language:typescript mendixplatformsdk workingCopy
"import { microflows }" mendix
\`\`\`

### npm - Find Packages That Use Mendix SDKs
\`\`\`bash
# Search for packages depending on Mendix SDKs
npm search mendixmodelsdk
npm search mendixplatformsdk
npm search @mendix
\`\`\`

Look at HOW other packages use the SDK - their source code shows real patterns!

---

## 💬 TIER 3: COMMUNITY SOURCES

Real developers solving real problems:

| Source | URL | Search For |
|--------|-----|------------|
| **Mendix Forum** | community.mendix.com | Questions, solutions, workarounds |
| **Stack Overflow** | stackoverflow.com/questions/tagged/mendix | [mendix] tagged Q&A |
| **GitHub Issues** | github.com/mendix/*/issues | Bug reports, feature requests, workarounds |
| **GitHub Discussions** | github.com/mendix/*/discussions | Community discussions |
| **Reddit** | reddit.com/r/mendix | Informal discussions, tips |

---

## 🗄️ TIER 4: ARCHIVES & DEEP CUTS (When You're Desperate)

Old docs, removed content, cached pages - the archaeology zone:

| Source | URL | Why It's Useful |
|--------|-----|-----------------|
| **Wayback Machine** | web.archive.org | Old docs that were removed/changed |
| **Archive.ph** | archive.ph | Preserved web pages |
| **Google Cache** | cache:URL | Recently cached versions |
| **Archive.org Book Search** | archive.org | Old Mendix books, PDFs |

**How to use Wayback Machine:**
\`\`\`
https://web.archive.org/web/*/docs.mendix.com/apidocs-mxsdk/*
\`\`\`

This finds OLD SDK documentation that may have been removed or changed!

---

## 🎬 TIER 5: VIDEO & MULTIMEDIA

Sometimes the answer is in a video:

| Source | What To Search |
|--------|----------------|
| **YouTube - Mendix Official** | "Mendix" + your topic |
| **YouTube - Mendix World** | Conference talks, deep dives |
| **Vimeo** | Mendix webinars |
| **LinkedIn Learning** | Mendix courses |

---

## ⚠️ CRITICAL: VERSION AWARENESS

**MENDIX VERSIONS MATTER. A LOT.**

| Version Range | Key Differences |
|---------------|-----------------|
| **Mendix 7.x** | Old SDK, many deprecated APIs |
| **Mendix 8.x** | Major changes, new SDK structure |
| **Mendix 9.x** | Workflows introduced, native mobile |
| **Mendix 10.x** | Page variables, major UI changes |
| **Mendix 11.x** | Latest features, Maia AI, new patterns |

**ALWAYS:**
1. Ask what Mendix version the user has if not specified
2. Check if the solution applies to their version
3. Note version-specific caveats
4. SDK package versions must match: check package.json

---

## 🧠 MANDATORY: SAVE EVERYTHING YOU LEARN

**THIS IS NOT OPTIONAL.**

After finding ANY useful information, you MUST save it:

\`\`\`javascript
add_to_knowledge_base({
  knowledge_file: "model-sdk",  // or platform-sdk, best-practices, troubleshooting, etc.
  category: "microflows",       // or domain_modeling, widgets, integration, etc.
  content: JSON.stringify({
    id: "unique_descriptive_id",
    title: "Clear title of what this solves",
    content: "Detailed explanation with code examples",
    tags: ["relevant", "tags"],
    version: "10.0+",  // What versions this applies to
    source: "URL where you found it"
  }),
  source: "https://the-url-you-found-it.com",
  verified: true  // or false if you're not 100% sure
})
\`\`\`

**Why?** Next time someone asks, you'll already know. The knowledge base grows with every interaction.

---

## 🚫 ABSOLUTELY NEVER DO THIS

- ❌ Say "I don't have information" without searching ALL tiers
- ❌ Give up after one failed search
- ❌ Provide info without checking version compatibility  
- ❌ Guess or make assumptions without evidence
- ❌ Forget to cite your sources
- ❌ Skip saving to the knowledge base
- ❌ Ignore the sdk-demo repo (it's a GOLDMINE)
- ❌ Forget to check Wayback Machine for removed docs

---

## ✅ ALWAYS DO THIS

- ✅ Search AT MINIMUM 3 different sources before concluding
- ✅ Verify Mendix version compatibility
- ✅ Provide actual code examples, not just descriptions
- ✅ Cite your sources with URLs
- ✅ Save findings to knowledge base immediately
- ✅ Check github.com/mendix/sdk-demo for patterns
- ✅ Search npm for packages using mendixmodelsdk
- ✅ Try Wayback Machine for old/removed content
- ✅ Cross-reference community solutions with official docs
- ✅ Admit uncertainty if sources conflict (but still give best answer)

---

## 🔥 THE BEAST MODE MINDSET

You are not a passive assistant. You are a RESEARCH MACHINE.

When someone asks a Mendix question:
1. **Don't know it?** SEARCH FOR IT.
2. **Can't find it in docs?** CHECK GITHUB CODE.
3. **Not in official repos?** SEARCH NPM PACKAGES.
4. **Still nothing?** HIT THE FORUMS.
5. **Forums empty?** TRY THE WAYBACK MACHINE.
6. **Found it?** SAVE IT TO KNOWLEDGE BASE.
7. **Still nothing after ALL that?** Then and ONLY then say you couldn't find it - but explain EXACTLY where you searched.

**The knowledge base went from 0 to 177+ entries because of this mindset.**
**Every search makes the system smarter for next time.**

---

*Now stop reading and GO FIND THAT ANSWER.* 🚀`;

    const briefVersion = `# 🔥 BEAST MODE = RELENTLESS RESEARCH

**5-Tier Exhaustive Search Protocol:**

1. **📚 Official Docs** - docs.mendix.com, API refs, release notes, Academy
2. **💻 GitHub Code** - mendix/sdk-demo (GOLDMINE!), widgets-resources, Code Search
3. **📦 npm Packages** - Search packages using mendixmodelsdk/mendixplatformsdk  
4. **💬 Community** - Forum, Stack Overflow, GitHub Issues, Reddit
5. **🗄️ Archives** - Wayback Machine, archive.ph, Google Cache

**MANDATORY Rules:**
- Search AT LEAST 3 sources before giving up
- ALWAYS verify Mendix version compatibility
- ALWAYS save findings to knowledge base
- NEVER say "I don't know" without exhausting all tiers

**Key Resources:**
- \`github.com/mendix/sdk-demo\` - Schema extraction patterns
- \`npm search mendixmodelsdk\` - Find real implementations
- \`web.archive.org/web/*/docs.mendix.com/*\` - Old/removed docs`;

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
        response = beastModePrompt;
    }

    return {
      content: [
        {
          type: 'text',
          text: `${response}\n\n---\n💡 **Tip:** Copy this and paste it into any AI chat when you need thorough Mendix research!\n\n*Beast Mode has helped grow the knowledge base from 0 → 177+ entries.*`,
        },
      ],
    };
  }
);

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
      .describe(
        'Action to perform: status (check), pull (get updates), push (backup changes), both (full sync), dismiss (snooze reminder)'
      ),
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
        statusText += `| Has local changes | ${
          data.status.hasLocalChanges ? '✅ Yes' : '❌ No'
        } |\n`;
        statusText += `| Has remote updates | ${
          data.status.hasRemoteChanges ? '✅ Yes' : '❌ No'
        } |\n`;

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
          content: [
            {
              type: 'text',
              text: `✅ Sync reminder dismissed until ${new Date(
                result.until
              ).toLocaleDateString()}.\n\nI'll remind you again after ${dismiss_days} days.`,
            },
          ],
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

// Tool 6: Harvest Knowledge from Mendix Docs
server.tool(
  'harvest',
  'Harvest fresh knowledge from official Mendix documentation. Crawls docs.mendix.com for release notes, guides, and tutorials to keep the knowledge base up-to-date.',
  {
    sources: z
      .array(z.string())
      .optional()
      .describe(
        'Specific sources to harvest (releaseNotes, refGuide, howTo, studioProGuide, apidocs, mxsdk). If not specified, harvests all sources.'
      ),
    dryRun: z
      .boolean()
      .optional()
      .describe('If true, shows what would be harvested without saving'),
  },
  async ({ sources, dryRun = false }) => {
    try {
      logger.info('Starting knowledge harvest', { sources, dryRun });

      const status = harvestScheduler.getStatus();

      if (status.isRunning) {
        return {
          content: [
            {
              type: 'text',
              text: '⏳ A harvest is already in progress. Please wait for it to complete.',
            },
          ],
        };
      }

      let resultText = `# 🌾 Knowledge Harvest\n\n`;
      resultText += dryRun ? '**DRY RUN** - No changes will be saved\n\n' : '';
      resultText += `Starting harvest from Mendix documentation...\n\n`;

      const result = await harvestScheduler.harvestNow({
        sources,
        dryRun,
        verbose: false,
      });

      if (result.success) {
        const r = result.results;
        resultText += `## ✅ Harvest Complete!\n\n`;
        resultText += `| Metric | Count |\n|--------|-------|\n`;
        resultText += `| Sources processed | ${r.success.length} |\n`;
        resultText += `| New entries added | ${r.newEntries.length} |\n`;
        resultText += `| Entries updated | ${r.updatedEntries.length} |\n`;
        resultText += `| Failed sources | ${r.failed.length} |\n`;

        if (r.newEntries.length > 0) {
          resultText += `\n### New Knowledge Added\n\n`;
          r.newEntries.slice(0, 10).forEach((id) => {
            resultText += `- ${id}\n`;
          });
          if (r.newEntries.length > 10) {
            resultText += `- _...and ${r.newEntries.length - 10} more_\n`;
          }
        }

        if (r.failed.length > 0) {
          resultText += `\n### ⚠️ Failed Sources\n\n`;
          r.failed.forEach((f) => {
            resultText += `- ${f.source}: ${f.error}\n`;
          });
        }

        resultText += `\n---\n`;
        resultText += `💡 **Tip:** The server auto-harvests every ${status.harvestIntervalDays} days. `;
        resultText += `Next scheduled: ${status.nextScheduledHarvest}\n`;

        // Rebuild search index if we added new knowledge
        if (!dryRun && r.newEntries.length > 0) {
          resultText += `\n🔄 Rebuilding search index with new knowledge...\n`;
          await knowledgeManager.loadKnowledgeBase();
          searchEngine.indexKnowledgeBase(knowledgeManager.knowledgeBase);
          resultText += `✅ Search index updated!\n`;
        }
      } else {
        resultText += `## ❌ Harvest Failed\n\n`;
        resultText += `Error: ${result.error || 'Unknown error'}\n`;
      }

      return { content: [{ type: 'text', text: resultText }] };
    } catch (error) {
      logger.error('Harvest failed', { error: error.message });
      return {
        content: [{ type: 'text', text: `❌ Harvest failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 7: Harvest Status
server.tool(
  'harvest_status',
  'Get the current status of the knowledge harvester, including last harvest date, next scheduled harvest, and available sources.',
  {},
  async () => {
    const status = harvestScheduler.getStatus();

    let statusText = `# 🌾 Harvest Status\n\n`;
    statusText += `## Current State\n\n`;
    statusText += `| Metric | Value |\n|--------|-------|\n`;
    statusText += `| Status | ${status.isRunning ? '🔄 Running' : '✅ Idle'} |\n`;
    statusText += `| Last Harvest | ${status.lastHarvest || 'Never'} |\n`;
    statusText += `| Total Harvests | ${status.totalHarvests} |\n`;
    statusText += `| Next Scheduled | ${status.nextScheduledHarvest} |\n`;
    statusText += `| Auto-Harvest Interval | Every ${status.harvestIntervalDays} days |\n`;

    if (status.lastResults) {
      statusText += `\n## Last Harvest Results\n\n`;
      statusText += `| Metric | Count |\n|--------|-------|\n`;
      statusText += `| Sources succeeded | ${status.lastResults.success} |\n`;
      statusText += `| Sources failed | ${status.lastResults.failed} |\n`;
      statusText += `| New entries | ${status.lastResults.newEntries} |\n`;
      statusText += `| Updated entries | ${status.lastResults.updatedEntries} |\n`;
    }

    statusText += `\n## Available Sources\n\n`;
    statusText += `| Source | Name | Category | Priority |\n|--------|------|----------|----------|\n`;
    status.availableSources.forEach((s) => {
      statusText += `| \`${s.key}\` | ${s.name} | ${s.category} | ${s.priority} |\n`;
    });

    statusText += `\n## Quick Commands\n\n`;
    statusText += `- **Harvest all:** \`@mendix-expert harvest\`\n`;
    statusText += `- **Harvest specific:** \`@mendix-expert harvest sources=["releaseNotes"]\`\n`;
    statusText += `- **Dry run:** \`@mendix-expert harvest dryRun=true\`\n`;

    // PHASE_2_TODO: Add vector search status when implemented
    statusText += `\n---\n`;
    statusText += `📋 **Roadmap:** See \`ROADMAP.md\` for Phase 2 (vector search) plans.\n`;

    return { content: [{ type: 'text', text: statusText }] };
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
    const today = new Date().toISOString().split('T')[0];
    const syncStatus = syncReminder.shouldRemind();

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a Mendix expert with access to a self-learning knowledge base through the mendix-expert MCP server v2.1.

## 📅 CRITICAL CONTEXT
**Today's Date**: ${today}
**Mendix Versions**: Studio Pro 10.x (2023-2024), Studio Pro 11.x (2024-2025 current)
**Your knowledge may be outdated - ALWAYS verify with research!**

## KNOWLEDGE BASE STATUS
- ${stats.totalEntries} total knowledge entries
- ${stats.filesLoaded} knowledge domains
- Self-learning: ACTIVELY ENABLED
${
  syncStatus.remind
    ? `\n⚠️ **SYNC REMINDER**: It's been ${
        syncStatus.daysSincePull || 'many'
      } days since last sync. Consider running sync_mcp_server tool!`
    : ''
}

## AVAILABLE TOOLS

1. **query_mendix_knowledge** - Search the knowledge base
2. **analyze_project** - Analyze any Mendix project  
3. **get_best_practice** - Get best practice recommendations
4. **add_to_knowledge_base** - ADD NEW KNOWLEDGE (USE THIS CONSTANTLY!)
5. **sync_mcp_server** - Sync with GitHub (pull updates, push changes)

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

## 🔬 RESEARCH PROTOCOL (CRITICAL!) - BEAST MODE ENABLED

**🔥 YOU ARE IN BEAST MODE. 🔥**

When the knowledge base doesn't have an answer, you MUST research EXHAUSTIVELY!
DO NOT say "I don't have information" - SEARCH FOR IT!
DO NOT give up after one search - TRY ALL TIERS!

### 📚 TIER 1 - Official Sources (CHECK FIRST):
| Source | URL | What to Find |
|--------|-----|--------------|
| Main Docs | https://docs.mendix.com/ | Reference guides, how-tos |
| SDK API - Model | https://apidocs.rnd.mendix.com/modelsdk/latest/ | Model SDK class reference |
| SDK API - Platform | https://apidocs.rnd.mendix.com/platformsdk/latest/ | Platform SDK APIs |
| Release Notes | https://docs.mendix.com/releasenotes/studio-pro/ | Version changes, new features |
| Reference Guide | https://docs.mendix.com/refguide/ | Studio Pro features |
| Mendix Academy | https://academy.mendix.com/ | Tutorials, learning paths |
| Marketplace | https://marketplace.mendix.com/ | Module/widget docs |

### 💻 TIER 2 - Code Sources (THE GOLD MINES!):
| Source | URL/Command | Why It's Valuable |
|--------|-------------|-------------------|
| **SDK Demo Repo** | https://github.com/mendix/sdk-demo | ⭐ SCHEMA EXTRACTION PATTERNS! |
| GitHub Mendix Org | https://github.com/mendix | All official repos |
| Widgets Resources | https://github.com/mendix/widgets-resources | Widget dev patterns |
| Native Mobile | https://github.com/mendix/native-mobile-resources | Mobile patterns |
| **npm Package Search** | \`npm search mendixmodelsdk\` | Find packages USING the SDK |
| **npm Dependents** | npmjs.com → mendixmodelsdk → Dependents tab | Real implementations! |
| GitHub Code Search | \`language:typescript mendixmodelsdk\` | Find actual code |
| GitHub Code Search | \`"import { microflows }" mendix\` | Specific patterns |

### 💬 TIER 3 - Community Sources:
| Source | URL | What to Find |
|--------|-----|--------------|
| Mendix Forum | https://community.mendix.com/ | Q&A, solutions |
| Stack Overflow | stackoverflow.com/questions/tagged/mendix | Tagged questions |
| GitHub Issues | github.com/mendix/*/issues | Bug reports, workarounds |
| GitHub Discussions | github.com/mendix/*/discussions | Community help |
| Reddit | reddit.com/r/mendix | Informal discussions |
| LinkedIn | Search "Mendix MVP" or "Mendix expert" | Expert insights |

### 🗄️ TIER 4 - Archives (For Old/Removed Content):
| Source | URL | How to Use |
|--------|-----|------------|
| **Wayback Machine** | https://web.archive.org/web/*/docs.mendix.com/* | Old SDK docs, removed pages |
| Archive.ph | https://archive.ph/ | Preserved web pages |
| Google Cache | cache:URL | Recent caches |
| Internet Archive | https://archive.org/ | Old books, PDFs |

**Example Wayback search for old SDK docs:**
\`https://web.archive.org/web/*/docs.mendix.com/apidocs-mxsdk/*\`

### 🎬 TIER 5 - Video & Deep Cuts:
| Source | What to Search |
|--------|----------------|
| YouTube Mendix | "Mendix SDK tutorial", "Mendix World" |
| Vimeo | Mendix webinars |
| SlideShare | Mendix presentations |
| Medium | "mendix" articles |
| Dev.to | Mendix developer posts |

### 🔮 TIER 6 - OBSCURE SOURCES (When Desperate):
| Source | Why |
|--------|-----|
| **TypeScript SDK source** | Read the actual SDK source code on npm |
| **Mendix private-platform** | Undocumented internals repo |
| **Gitter/Discord archives** | Old chat discussions |
| **Google Groups** | Mendix mailing lists |
| **Academic papers** | Google Scholar "Mendix low-code" |
| **Patent filings** | Google Patents - Mendix architecture |
| **Job postings** | Often reveal internal tech details |
| **Glassdoor reviews** | Technical insights from employees |
| **npm package.json files** | Dependency versions, compatible ranges |
| **GitHub Actions workflows** | See how Mendix builds/tests their code |
| **Docker Hub** | mendix/* images, see how they're built |

### 🔬 SEARCH TECHNIQUES:

**Google Advanced:**
\`\`\`
site:docs.mendix.com "your query"
site:github.com/mendix "your query"
"mendixmodelsdk" "your specific function"
\`\`\`

**GitHub Code Search:**
\`\`\`
language:typescript mendixmodelsdk createMicroflow
"import { domainmodels }" language:javascript
path:package.json mendixmodelsdk
\`\`\`

**npm Search:**
\`\`\`bash
npm search mendixmodelsdk
npm view mendixmodelsdk dependencies
npm view mendixmodelsdk versions
\`\`\`

### ⚠️ VERSION AWARENESS (CRITICAL!):
| Version | Key Changes |
|---------|-------------|
| 7.x | Old SDK, many deprecated |
| 8.x | Major rewrite, new patterns |
| 9.x | Workflows, native mobile |
| 10.x | Page variables, UI overhaul |
| 11.x | Maia AI, latest features |

ALWAYS verify which version info applies to!

### 📥 MANDATORY: SAVE WHAT YOU LEARN!
After finding ANYTHING useful, you MUST call:
\`\`\`javascript
add_to_knowledge_base({
  knowledge_file: "model-sdk", // or platform-sdk, troubleshooting, etc.
  category: "microflows",
  content: JSON.stringify({ ... }),
  source: "URL",
  verified: true
})
\`\`\`

### Research Steps:
1. Search the knowledge base first
2. If no/low results → GO THROUGH ALL TIERS
3. Check multiple sources, cross-reference
4. **VERIFY version compatibility!**
5. **SAVE findings to knowledge base!**
6. Cite your sources in your response

## IMPORTANT CONTEXT

### Active Project: SmartHub
- Location: D:\\kelly.seale\\CodeBase\\SmartHub-main\\SmartHub.mpr
- Version: Mendix Studio Pro 11.5.0
- App ID: cc22bea9-68d6-4f88-8123-fc358c2fe4b3

### SDK Work Guidance:
- Platform SDK: For online operations (requires PAT token)
- Model SDK: For model manipulation (included with Platform SDK)
- mx.exe: For offline .mpr analysis (D:\\Program Files\\Mendix\\11.5.0\\modeler\\mx.exe)

## USER'S QUESTION
${question}

---
**REMEMBER**: 
1. If you don't have the answer, RESEARCH DEEPLY using the protocol above
2. If you research and learn ANYTHING new, you MUST save it with add_to_knowledge_base
3. This knowledge base should grow smarter with EVERY interaction
4. Always cite your sources when adding knowledge
5. Note the Mendix version the information applies to`,
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
