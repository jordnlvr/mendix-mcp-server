/**
 * Aggressive Mendix Knowledge Harvester
 * Fetches and processes official Mendix documentation for up-to-date knowledge
 *
 * Focus areas:
 * - Mendix 10+ and 11 features (2023-2025)
 * - Workflows and workflow automation
 * - Native mobile development
 * - Solutions (pre-built apps)
 * - ML Kit and AI features
 * - CI/CD and DevOps
 * - Performance optimization
 * - New widgets and Atlas UI
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mendix documentation sources to harvest
const MENDIX_SOURCES = {
  // Core Reference Guide - Latest features
  refguide: [
    {
      url: 'https://docs.mendix.com/refguide/workflows/',
      topic: 'Workflows',
      category: 'workflows',
    },
    {
      url: 'https://docs.mendix.com/refguide/workflow-elements/',
      topic: 'Workflow Elements',
      category: 'workflows',
    },
    {
      url: 'https://docs.mendix.com/refguide/workflow-engine/',
      topic: 'Workflow Engine',
      category: 'workflows',
    },
    {
      url: 'https://docs.mendix.com/refguide/workflow-activities/',
      topic: 'Workflow Activities',
      category: 'workflows',
    },
    {
      url: 'https://docs.mendix.com/refguide/page-variables/',
      topic: 'Page Variables (Studio Pro 10+)',
      category: 'pages',
    },
    {
      url: 'https://docs.mendix.com/refguide/data-container/',
      topic: 'Data Container Widget',
      category: 'pages',
    },
    {
      url: 'https://docs.mendix.com/refguide/building-blocks/',
      topic: 'Building Blocks',
      category: 'ui',
    },
    {
      url: 'https://docs.mendix.com/refguide/template-grid/',
      topic: 'Template Grid',
      category: 'ui',
    },
    { url: 'https://docs.mendix.com/refguide/list-view/', topic: 'List View', category: 'ui' },
    {
      url: 'https://docs.mendix.com/refguide/datagrid-2/',
      topic: 'Data Grid 2',
      category: 'widgets',
    },
    {
      url: 'https://docs.mendix.com/refguide/charts-widgets/',
      topic: 'Charts Widgets',
      category: 'widgets',
    },
    {
      url: 'https://docs.mendix.com/refguide/pluggable-widgets/',
      topic: 'Pluggable Widgets',
      category: 'widgets',
    },
    {
      url: 'https://docs.mendix.com/refguide/offline-first/',
      topic: 'Offline-First',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/refguide/native-mobile/',
      topic: 'Native Mobile',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/refguide/native-navigation/',
      topic: 'Native Navigation',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/refguide/native-styling/',
      topic: 'Native Styling',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/refguide/external-entities/',
      topic: 'External Entities (OData)',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/refguide/consumed-rest-services/',
      topic: 'Consumed REST Services',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/refguide/published-rest-services/',
      topic: 'Published REST Services',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/refguide/call-rest-action/',
      topic: 'Call REST Action',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/refguide/mendix-client/',
      topic: 'Mendix Client',
      category: 'runtime',
    },
  ],

  // How-To Guides - Practical implementations
  howto: [
    {
      url: 'https://docs.mendix.com/howto/front-end/atlas-ui/',
      topic: 'Atlas UI Guide',
      category: 'ui',
    },
    {
      url: 'https://docs.mendix.com/howto/mobile/native-mobile/',
      topic: 'Native Mobile How-To',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/howto/mobile/build-native-mobile/',
      topic: 'Build Native Mobile App',
      category: 'mobile',
    },
    {
      url: 'https://docs.mendix.com/howto/integration/consume-rest-service/',
      topic: 'Consume REST Service',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/howto/integration/publish-rest-service/',
      topic: 'Publish REST Service',
      category: 'integration',
    },
    {
      url: 'https://docs.mendix.com/howto/logic-business-rules/workflow-how-to/',
      topic: 'Workflow How-To',
      category: 'workflows',
    },
    {
      url: 'https://docs.mendix.com/howto/monitoring-troubleshooting/debug-microflows/',
      topic: 'Debug Microflows',
      category: 'debugging',
    },
    {
      url: 'https://docs.mendix.com/howto/monitoring-troubleshooting/monitoring-mendix-runtime/',
      topic: 'Monitor Runtime',
      category: 'monitoring',
    },
    {
      url: 'https://docs.mendix.com/howto/testing/testing-overview/',
      topic: 'Testing Overview',
      category: 'testing',
    },
    {
      url: 'https://docs.mendix.com/howto/security/best-practices-security/',
      topic: 'Security Best Practices',
      category: 'security',
    },
  ],

  // Release Notes - What's new
  releasenotes: [
    {
      url: 'https://docs.mendix.com/releasenotes/studio-pro/10/',
      topic: 'Studio Pro 10 Release Notes',
      category: 'release_notes',
    },
    {
      url: 'https://docs.mendix.com/releasenotes/studio-pro/10.0/',
      topic: 'Studio Pro 10.0 Specifics',
      category: 'release_notes',
    },
    {
      url: 'https://docs.mendix.com/releasenotes/studio-pro/10.6/',
      topic: 'Studio Pro 10.6 Specifics',
      category: 'release_notes',
    },
    {
      url: 'https://docs.mendix.com/releasenotes/studio-pro/10.12/',
      topic: 'Studio Pro 10.12 Specifics',
      category: 'release_notes',
    },
  ],

  // Solutions - Pre-built apps
  solutions: [
    {
      url: 'https://docs.mendix.com/appstore/solutions/',
      topic: 'Solutions Overview',
      category: 'solutions',
    },
    {
      url: 'https://docs.mendix.com/appstore/use-content/modules/',
      topic: 'App Store Modules',
      category: 'marketplace',
    },
  ],

  // Developer Portal & CI/CD
  devops: [
    {
      url: 'https://docs.mendix.com/developerportal/deploy/mendix-cloud-deploy/',
      topic: 'Mendix Cloud Deploy',
      category: 'deployment',
    },
    {
      url: 'https://docs.mendix.com/developerportal/deploy/environments/',
      topic: 'Environments',
      category: 'deployment',
    },
    {
      url: 'https://docs.mendix.com/developerportal/deploy/private-cloud/',
      topic: 'Private Cloud',
      category: 'deployment',
    },
    {
      url: 'https://docs.mendix.com/developerportal/deploy/docker-deploy/',
      topic: 'Docker Deploy',
      category: 'deployment',
    },
    {
      url: 'https://docs.mendix.com/howto/integration/use-mendix-ci-cd-toolkit/',
      topic: 'CI/CD Toolkit',
      category: 'cicd',
    },
  ],

  // API Documentation
  apidocs: [
    {
      url: 'https://apidocs.rnd.mendix.com/modelsdk/latest/index.html',
      topic: 'Model SDK Reference',
      category: 'sdk',
    },
    {
      url: 'https://apidocs.rnd.mendix.com/platformsdk/latest/index.html',
      topic: 'Platform SDK Reference',
      category: 'sdk',
    },
  ],
};

class AggressiveHarvester {
  constructor() {
    this.knowledgeDir = path.join(__dirname, '../knowledge');
    this.harvestedData = {};
    this.fetchCount = 0;
    this.maxConcurrent = 3; // Don't hammer the server
    this.delayMs = 1500; // 1.5 second delay between fetches
  }

  async fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'MendixMCPServer/2.6.0 (Knowledge Harvester)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (err) {
        console.log(`  ⚠️ Attempt ${i + 1} failed for ${url}: ${err.message}`);
        if (i < retries - 1) {
          await this.delay(2000 * (i + 1)); // Exponential backoff
        }
      }
    }
    return null;
  }

  extractContent(html) {
    if (!html) return null;

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Mendix.*$/i, '').trim() : '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Remove noise
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Try to get main content
    const mainMatch =
      content.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      content.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      content.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
      content.match(/<div[^>]*class="[^"]*markdown[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    if (mainMatch) {
      content = mainMatch[1];
    }

    // Extract headings for structure
    const headings = [];
    const headingMatches = content.matchAll(/<h([1-6])[^>]*>([^<]+)<\/h\1>/gi);
    for (const match of headingMatches) {
      headings.push({ level: parseInt(match[1]), text: match[2].trim() });
    }

    // Extract code blocks
    const codeBlocks = [];
    const codeMatches = content.matchAll(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi);
    for (const match of codeMatches) {
      const code = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      if (code.length > 20 && code.length < 2000) {
        codeBlocks.push(code);
      }
    }

    // Clean text
    let text = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate very long content
    if (text.length > 5000) {
      text = text.slice(0, 5000) + '...';
    }

    return {
      title,
      description,
      headings: headings.slice(0, 20),
      codeExamples: codeBlocks.slice(0, 5),
      content: text,
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async harvestCategory(categoryName, sources) {
    const results = [];
    console.log(`\n📁 Harvesting ${categoryName}...`);

    for (const source of sources) {
      await this.delay(this.delayMs);

      console.log(`  📄 Fetching: ${source.topic}`);
      const html = await this.fetchWithRetry(source.url);

      if (html) {
        const extracted = this.extractContent(html);
        if (extracted && extracted.content.length > 100) {
          results.push({
            topic: source.topic,
            category: source.category,
            url: source.url,
            ...extracted,
            harvested: new Date().toISOString(),
            version: 'mendix-10-11',
          });
          console.log(
            `    ✅ Extracted ${extracted.content.length} chars, ${extracted.codeExamples.length} code blocks`
          );
          this.fetchCount++;
        } else {
          console.log(`    ⚠️ Insufficient content extracted`);
        }
      } else {
        console.log(`    ❌ Failed to fetch`);
      }
    }

    return results;
  }

  async harvestAll() {
    console.log('🚀 Starting aggressive Mendix documentation harvest...');
    console.log('   Target: Mendix 10+ and 11 features\n');

    const allResults = {};

    for (const [categoryName, sources] of Object.entries(MENDIX_SOURCES)) {
      const results = await this.harvestCategory(categoryName, sources);
      if (results.length > 0) {
        allResults[categoryName] = results;
      }
    }

    // Save harvested data
    const outputFile = path.join(this.knowledgeDir, 'harvested-mendix-10-11.json');
    const harvestData = {
      _metadata: {
        harvested: new Date().toISOString(),
        source: 'docs.mendix.com',
        version: 'mendix-10-11',
        totalEntries: this.fetchCount,
        categories: Object.keys(allResults),
      },
      ...allResults,
    };

    await fs.writeFile(outputFile, JSON.stringify(harvestData, null, 2), 'utf8');

    console.log(`\n✅ Harvest complete!`);
    console.log(`   📊 Total entries: ${this.fetchCount}`);
    console.log(`   📁 Saved to: ${outputFile}`);

    return harvestData;
  }
}

// Run if called directly
const harvester = new AggressiveHarvester();
harvester.harvestAll().catch(console.error);
