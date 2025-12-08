/**
 * KnowledgeHarvester - Automatically fetches and indexes Mendix documentation
 *
 * Phase 1: Crawl official Mendix sources and add to JSON knowledge base
 * Phase 2 (TODO): Add Pinecone vector embeddings for semantic search
 *
 * @version 1.0.0
 * @author Kai SDK
 */

import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source configurations for Mendix documentation
const MENDIX_SOURCES = {
  releaseNotes: {
    name: 'Studio Pro Release Notes',
    baseUrl: 'https://docs.mendix.com/releasenotes/studio-pro/',
    versionUrls: [
      'https://docs.mendix.com/releasenotes/studio-pro/10/',
      'https://docs.mendix.com/releasenotes/studio-pro/11/',
    ],
    category: 'release_notes',
    priority: 'high',
  },
  refGuide: {
    name: 'Reference Guide',
    baseUrl: 'https://docs.mendix.com/refguide/',
    sections: [
      'modeling/pages/',
      'modeling/domain-model/',
      'modeling/microflows-and-nanoflows/',
      'modeling/application-logic/',
      'modeling/resources/',
      'modeling/integration/',
    ],
    category: 'reference',
    priority: 'high',
  },
  howTo: {
    name: 'How-To Guides',
    baseUrl: 'https://docs.mendix.com/howto/',
    sections: ['front-end/', 'logic-business-rules/', 'integration/', 'mobile/', 'extensibility/'],
    category: 'tutorials',
    priority: 'medium',
  },
  studioProGuide: {
    name: 'Studio Pro Guide',
    baseUrl: 'https://docs.mendix.com/refguide/',
    pages: ['page-variables', 'workflows', 'maia', 'data-widgets', 'pluggable-widgets'],
    category: 'studio_pro',
    priority: 'high',
  },
  apidocs: {
    name: 'API Documentation',
    baseUrl: 'https://docs.mendix.com/apidocs-mxsdk/apidocs/',
    category: 'api',
    priority: 'medium',
  },
  mxsdk: {
    name: 'Mendix SDK Documentation',
    baseUrl: 'https://docs.mendix.com/apidocs-mxsdk/mxsdk/',
    category: 'sdk',
    priority: 'high',
  },
};

// Topics we specifically want to harvest (knowledge gaps)
const PRIORITY_TOPICS = [
  // Studio Pro 11+ features - CRITICAL
  { query: 'page variables', minVersion: '10.0', category: 'new_features' },
  { query: 'workflows 2.0', minVersion: '10.0', category: 'new_features' },
  { query: 'workflow activities', minVersion: '10.0', category: 'new_features' },
  { query: 'multi user task', minVersion: '10.0', category: 'new_features' },
  { query: 'external entity', category: 'new_features' },

  // Maia AI Assistant - HOT TOPIC
  { query: 'maia ai assistant', minVersion: '10.12', category: 'ai' },
  { query: 'maia logic recommendations', minVersion: '10.12', category: 'ai' },
  { query: 'maia microflow generation', minVersion: '10.12', category: 'ai' },
  { query: 'maia page generation', minVersion: '10.12', category: 'ai' },
  { query: 'mendix assist', minVersion: '9.0', category: 'ai' },
  { query: 'ai bot', category: 'ai' },

  // Theming & Design - Design Tokens!
  { query: 'atlas ui 3', category: 'theming' },
  { query: 'design tokens', category: 'theming' },
  { query: 'design tokens css variables', category: 'theming' },
  { query: 'custom themes sass', category: 'theming' },
  { query: 'design system', category: 'theming' },
  { query: 'atlas core', category: 'theming' },
  { query: 'styling modeler', category: 'theming' },
  { query: 'brand customization', category: 'theming' },

  // Native Mobile
  { query: 'native mobile', category: 'mobile' },
  { query: 'make it native app', category: 'mobile' },
  { query: 'native navigation', category: 'mobile' },
  { query: 'native widgets', category: 'mobile' },
  { query: 'offline first', category: 'mobile' },
  { query: 'react native', category: 'mobile' },
  { query: 'native styling', category: 'mobile' },

  // Progressive Web App
  { query: 'progressive web app pwa', category: 'pwa' },
  { query: 'installable web app', category: 'pwa' },
  { query: 'service worker', category: 'pwa' },
  { query: 'offline web', category: 'pwa' },

  // Widget Development
  { query: 'pluggable widgets api', category: 'widgets' },
  { query: 'widget development', category: 'widgets' },
  { query: 'react widgets', category: 'widgets' },
  { query: 'widget properties', category: 'widgets' },
  { query: 'widget actions', category: 'widgets' },
  { query: 'widget events', category: 'widgets' },

  // Extensions & SDK
  { query: 'studio pro extensions', category: 'extensions' },
  { query: 'extension points', category: 'extensions' },
  { query: 'platform sdk', category: 'sdk' },
  { query: 'model sdk', category: 'sdk' },
  { query: 'mendixmodelsdk', category: 'sdk' },
  { query: 'mendixplatformsdk', category: 'sdk' },
  { query: 'sdk typescript', category: 'sdk' },

  // Integration Patterns
  { query: 'rest api published', category: 'integration' },
  { query: 'rest api consumed', category: 'integration' },
  { query: 'odata services', category: 'integration' },
  { query: 'graphql', category: 'integration' },
  { query: 'message queue', category: 'integration' },
  { query: 'kafka', category: 'integration' },
  { query: 'event broker', category: 'integration' },

  // Best Practices
  { query: 'performance best practices', category: 'best_practices' },
  { query: 'security best practices', category: 'best_practices' },
  { query: 'microflow best practices', category: 'best_practices' },
  { query: 'domain model best practices', category: 'best_practices' },
  { query: 'testing best practices', category: 'best_practices' },
  { query: 'deployment best practices', category: 'best_practices' },

  // Data Hub & Catalog
  { query: 'data hub', category: 'data' },
  { query: 'data catalog', category: 'data' },
  { query: 'external data', category: 'data' },

  // Security
  { query: 'user roles', category: 'security' },
  { query: 'access rules', category: 'security' },
  { query: 'xpath constraints', category: 'security' },
  { query: 'module roles', category: 'security' },
  { query: 'authentication sso', category: 'security' },
  { query: 'saml oidc', category: 'security' },
];

class KnowledgeHarvester {
  constructor(knowledgeBasePath) {
    this.knowledgeBasePath = knowledgeBasePath || path.join(__dirname, '../../knowledge');
    this.harvestLog = [];
    this.stats = {
      pagesScanned: 0,
      entriesAdded: 0,
      entriesUpdated: 0,
      errors: 0,
      lastHarvest: null,
    };
    this.rateLimitDelay = 1000; // 1 second between requests to be polite
  }

  /**
   * Main harvest function - crawls all configured sources
   */
  async harvest(options = {}) {
    const { sources = Object.keys(MENDIX_SOURCES), dryRun = false, verbose = true } = options;

    this.log('🌾 Starting Knowledge Harvest...', verbose);
    this.log(`   Sources: ${sources.join(', ')}`, verbose);
    this.stats.lastHarvest = new Date().toISOString();

    const results = {
      success: [],
      failed: [],
      newEntries: [],
      updatedEntries: [],
    };

    for (const sourceKey of sources) {
      const source = MENDIX_SOURCES[sourceKey];
      if (!source) {
        this.log(`   ⚠️ Unknown source: ${sourceKey}`, verbose);
        continue;
      }

      this.log(`\n📖 Harvesting: ${source.name}...`, verbose);

      try {
        const entries = await this.harvestSource(sourceKey, source, verbose);

        if (!dryRun && entries.length > 0) {
          const saveResult = await this.saveEntries(entries, source.category);
          results.newEntries.push(...saveResult.new);
          results.updatedEntries.push(...saveResult.updated);
        }

        results.success.push({ source: sourceKey, entries: entries.length });
        this.log(`   ✅ Harvested ${entries.length} entries from ${source.name}`, verbose);
      } catch (error) {
        results.failed.push({ source: sourceKey, error: error.message });
        this.stats.errors++;
        this.log(`   ❌ Failed to harvest ${source.name}: ${error.message}`, verbose);
      }
    }

    // Also harvest priority topics
    this.log('\n🎯 Harvesting Priority Topics...', verbose);
    for (const topic of PRIORITY_TOPICS) {
      try {
        const entries = await this.harvestTopic(topic, verbose);
        if (!dryRun && entries.length > 0) {
          const saveResult = await this.saveEntries(entries, topic.category);
          results.newEntries.push(...saveResult.new);
          results.updatedEntries.push(...saveResult.updated);
        }
      } catch (error) {
        this.log(`   ⚠️ Could not harvest topic "${topic.query}": ${error.message}`, verbose);
      }
    }

    this.log('\n' + '═'.repeat(50), verbose);
    this.log('📊 Harvest Complete!', verbose);
    this.log(`   Pages scanned: ${this.stats.pagesScanned}`, verbose);
    this.log(`   New entries: ${results.newEntries.length}`, verbose);
    this.log(`   Updated entries: ${results.updatedEntries.length}`, verbose);
    this.log(`   Errors: ${this.stats.errors}`, verbose);
    this.log('═'.repeat(50), verbose);

    // Save harvest log
    await this.saveHarvestLog();

    return results;
  }

  /**
   * Harvest a specific source configuration
   */
  async harvestSource(sourceKey, source, verbose) {
    const entries = [];

    switch (sourceKey) {
      case 'releaseNotes':
        for (const url of source.versionUrls) {
          const pageEntries = await this.harvestReleaseNotes(url, verbose);
          entries.push(...pageEntries);
          await this.delay();
        }
        break;

      case 'refGuide':
      case 'howTo':
        for (const section of source.sections || []) {
          const url = source.baseUrl + section;
          const pageEntries = await this.harvestDocPage(url, source.category, verbose);
          entries.push(...pageEntries);
          await this.delay();
        }
        break;

      case 'studioProGuide':
        for (const page of source.pages || []) {
          const url = source.baseUrl + page;
          const pageEntries = await this.harvestDocPage(url, source.category, verbose);
          entries.push(...pageEntries);
          await this.delay();
        }
        break;

      case 'mxsdk':
      case 'apidocs':
        const pageEntries = await this.harvestDocPage(source.baseUrl, source.category, verbose);
        entries.push(...pageEntries);
        break;

      default:
        this.log(`   No handler for source: ${sourceKey}`, verbose);
    }

    return entries;
  }

  /**
   * Harvest release notes pages
   */
  async harvestReleaseNotes(url, verbose) {
    const entries = [];

    try {
      const html = await this.fetchPage(url);
      if (!html) return entries;

      const $ = cheerio.load(html);
      this.stats.pagesScanned++;

      // Find version sections
      $('h2, h3').each((i, el) => {
        const title = $(el).text().trim();
        const versionMatch = title.match(/(\d+\.\d+(\.\d+)?)/);

        if (versionMatch) {
          const version = versionMatch[1];
          const content = [];

          // Get content until next heading
          let next = $(el).next();
          while (next.length && !next.is('h2, h3')) {
            if (next.is('ul, ol')) {
              next.find('li').each((j, li) => {
                content.push($(li).text().trim());
              });
            } else if (next.is('p')) {
              content.push(next.text().trim());
            }
            next = next.next();
          }

          if (content.length > 0) {
            entries.push({
              id: `release_${version.replace(/\./g, '_')}`,
              title: `Studio Pro ${version} Release Notes`,
              content: content.join('\n'),
              version: version,
              category: 'release_notes',
              source: url,
              harvested: new Date().toISOString(),
              tags: ['release', 'version', version.split('.')[0]],
            });
          }
        }
      });

      this.log(`      Found ${entries.length} version entries`, verbose);
    } catch (error) {
      this.log(`      Error parsing release notes: ${error.message}`, verbose);
    }

    return entries;
  }

  /**
   * Harvest a documentation page
   */
  async harvestDocPage(url, category, verbose) {
    const entries = [];

    try {
      const html = await this.fetchPage(url);
      if (!html) return entries;

      const $ = cheerio.load(html);
      this.stats.pagesScanned++;

      // Get page title
      const pageTitle =
        $('h1').first().text().trim() ||
        $('title').text().replace(' | Mendix Documentation', '').trim();

      // Get main content
      const mainContent = $('.mx-page-content, .content, main, article').first();

      if (mainContent.length) {
        // Extract sections
        mainContent.find('h2, h3').each((i, el) => {
          const sectionTitle = $(el).text().trim();
          const sectionContent = [];

          let next = $(el).next();
          while (next.length && !next.is('h2, h3')) {
            const text = next.text().trim();
            if (text && text.length > 10) {
              sectionContent.push(text);
            }
            next = next.next();
          }

          if (sectionContent.length > 0) {
            const entryId = this.generateId(pageTitle, sectionTitle);
            entries.push({
              id: entryId,
              title: `${pageTitle} - ${sectionTitle}`,
              content: sectionContent.join('\n\n'),
              category: category,
              source: url,
              harvested: new Date().toISOString(),
              tags: this.extractTags(sectionTitle, sectionContent.join(' ')),
            });
          }
        });

        // If no sections found, get the whole page
        if (entries.length === 0) {
          const fullContent = mainContent.text().trim();
          if (fullContent.length > 100) {
            entries.push({
              id: this.generateId(pageTitle),
              title: pageTitle,
              content: fullContent.substring(0, 5000), // Limit content size
              category: category,
              source: url,
              harvested: new Date().toISOString(),
              tags: this.extractTags(pageTitle, fullContent),
            });
          }
        }
      }

      this.log(`      Extracted ${entries.length} sections from ${pageTitle}`, verbose);
    } catch (error) {
      this.log(`      Error parsing doc page: ${error.message}`, verbose);
    }

    return entries;
  }

  /**
   * Harvest a specific topic using Mendix docs search
   */
  async harvestTopic(topic, verbose) {
    const entries = [];

    // Use docs.mendix.com search
    const searchUrl = `https://docs.mendix.com/search/?q=${encodeURIComponent(topic.query)}`;

    this.log(`   🔍 Searching: "${topic.query}"`, verbose);

    try {
      // Note: This is a simplified approach. Real implementation would
      // need to handle the search results page or use an API if available
      const html = await this.fetchPage(searchUrl);
      if (!html) return entries;

      const $ = cheerio.load(html);
      this.stats.pagesScanned++;

      // Look for search results
      $('.search-result, .result-item, [class*="result"]').each((i, el) => {
        if (i >= 5) return false; // Limit to top 5 results

        const title = $(el).find('h2, h3, .title, a').first().text().trim();
        const snippet = $(el).find('p, .snippet, .description').first().text().trim();
        const link = $(el).find('a').first().attr('href');

        if (title && snippet) {
          entries.push({
            id: this.generateId(topic.query, title),
            title: title,
            content: snippet,
            category: topic.category,
            source: link ? `https://docs.mendix.com${link}` : searchUrl,
            harvested: new Date().toISOString(),
            tags: [
              topic.query,
              topic.category,
              ...(topic.minVersion ? [`v${topic.minVersion}+`] : []),
            ],
            minVersion: topic.minVersion,
          });
        }
      });
    } catch (error) {
      this.log(`      Search failed: ${error.message}`, verbose);
    }

    return entries;
  }

  /**
   * Fetch a page with error handling and rate limiting
   */
  async fetchPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MendixExpert-MCP-Harvester/1.0 (Knowledge Indexer)',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Save harvested entries to knowledge base
   */
  async saveEntries(entries, category) {
    const result = { new: [], updated: [] };

    const filePath = path.join(this.knowledgeBasePath, `harvested-${category}.json`);

    let existing = { metadata: {}, entries: [] };
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      existing = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    const existingIds = new Set(existing.entries.map((e) => e.id));

    for (const entry of entries) {
      if (existingIds.has(entry.id)) {
        // Update existing
        const idx = existing.entries.findIndex((e) => e.id === entry.id);
        if (idx !== -1) {
          existing.entries[idx] = {
            ...existing.entries[idx],
            ...entry,
            updated: new Date().toISOString(),
          };
          result.updated.push(entry.id);
        }
      } else {
        // Add new
        existing.entries.push(entry);
        result.new.push(entry.id);
        this.stats.entriesAdded++;
      }
    }

    existing.metadata = {
      category: category,
      lastHarvest: new Date().toISOString(),
      totalEntries: existing.entries.length,
      source: 'KnowledgeHarvester',
    };

    await fs.writeFile(filePath, JSON.stringify(existing, null, 2));

    return result;
  }

  /**
   * Save harvest log for tracking
   */
  async saveHarvestLog() {
    const logPath = path.join(this.knowledgeBasePath, 'harvest-log.json');

    let logs = [];
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      logs = JSON.parse(content);
    } catch {
      // File doesn't exist
    }

    logs.push({
      timestamp: new Date().toISOString(),
      stats: this.stats,
      log: this.harvestLog.slice(-100), // Keep last 100 log entries
    });

    // Keep only last 30 harvests
    if (logs.length > 30) {
      logs = logs.slice(-30);
    }

    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Generate a unique ID for an entry
   */
  generateId(...parts) {
    return parts
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 64);
  }

  /**
   * Extract tags from title and content
   */
  extractTags(title, content) {
    const tags = new Set();
    const text = `${title} ${content}`.toLowerCase();

    // Common Mendix terms to tag
    const termMap = {
      microflow: 'microflows',
      nanoflow: 'nanoflows',
      'domain model': 'domain-model',
      entity: 'entities',
      page: 'pages',
      widget: 'widgets',
      workflow: 'workflows',
      integration: 'integration',
      rest: 'rest-api',
      odata: 'odata',
      security: 'security',
      xpath: 'xpath',
      java: 'java',
      javascript: 'javascript',
      sdk: 'sdk',
      maia: 'maia-ai',
      atlas: 'atlas-ui',
      theme: 'theming',
      sass: 'theming',
    };

    for (const [term, tag] of Object.entries(termMap)) {
      if (text.includes(term)) {
        tags.add(tag);
      }
    }

    return Array.from(tags);
  }

  /**
   * Rate limiting delay
   */
  delay() {
    return new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
  }

  /**
   * Logging helper
   */
  log(message, verbose = true) {
    if (verbose) {
      console.log(message);
    }
    this.harvestLog.push({ time: new Date().toISOString(), message });
  }

  /**
   * Get harvest statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get list of available sources
   */
  getSources() {
    return Object.entries(MENDIX_SOURCES).map(([key, source]) => ({
      key,
      name: source.name,
      category: source.category,
      priority: source.priority,
    }));
  }
}

export default KnowledgeHarvester;
export { MENDIX_SOURCES, PRIORITY_TOPICS };
