/**
 * HybridKnowledgeManager - Combines Supabase (cloud) and JSON (local) storage
 *
 * Storage Strategy:
 * 1. If SUPABASE_URL is set → Use Supabase as primary, JSON as backup
 * 2. If Supabase unavailable → Fallback to JSON-only mode
 * 3. Write operations go to both storages
 * 4. Read operations prefer Supabase (faster)
 *
 * This enables:
 * - Railway cloud deployment with persistent knowledge
 * - Local development with same knowledge base
 * - Graceful degradation if Supabase is down
 *
 * @version 1.0.0
 */

import SupabaseKnowledgeStore from '../storage/SupabaseKnowledgeStore.js';
import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';

class HybridKnowledgeManager {
  constructor(jsonKnowledgeManager) {
    this.logger = new Logger('HybridKnowledgeManager');
    this.config = getConfig();

    // JSON-based manager (existing functionality)
    this.jsonManager = jsonKnowledgeManager;

    // Supabase store (cloud storage)
    this.supabase = null;
    this.supabaseAvailable = false;

    // Mode tracking
    this.mode = 'json-only'; // 'hybrid', 'supabase-only', 'json-only'

    this.logger.info('HybridKnowledgeManager created');
  }

  /**
   * Initialize the hybrid manager
   * Attempts to connect to Supabase, falls back to JSON if unavailable
   */
  async initialize() {
    this.logger.info('Initializing hybrid knowledge storage...');

    // Always load JSON first (local backup)
    if (this.jsonManager && !this.jsonManager.loaded) {
      try {
        await this.jsonManager.load();
        this.logger.info('JSON knowledge loaded');
      } catch (error) {
        this.logger.warn('Failed to load JSON knowledge', { error: error.message });
      }
    }

    // Try to connect to Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = new SupabaseKnowledgeStore(supabaseUrl, supabaseKey);
        await this.supabase.initialize();
        this.supabaseAvailable = true;
        this.mode = 'hybrid';

        this.logger.info('Supabase connected - running in hybrid mode');
      } catch (error) {
        this.logger.warn('Supabase unavailable, using JSON-only mode', {
          error: error.message,
        });
        this.supabaseAvailable = false;
        this.mode = 'json-only';
      }
    } else {
      this.logger.info('Supabase not configured - using JSON-only mode');
      this.mode = 'json-only';
    }

    return {
      mode: this.mode,
      supabaseAvailable: this.supabaseAvailable,
      jsonLoaded: this.jsonManager?.loaded || false,
    };
  }

  /**
   * Search knowledge across all sources
   * Prefers Supabase for speed when available
   */
  async search(query, options = {}) {
    const results = [];

    // Try Supabase first (faster, indexed)
    if (this.supabaseAvailable) {
      try {
        const supabaseResults = await this.supabase.search(query, options.limit || 10);
        results.push(
          ...supabaseResults.map((r) => ({
            ...r,
            source_type: 'supabase',
          }))
        );

        this.logger.debug('Supabase search returned', {
          count: supabaseResults.length,
        });
      } catch (error) {
        this.logger.warn('Supabase search failed, falling back to JSON', {
          error: error.message,
        });
      }
    }

    // Fallback or supplement with JSON search if needed
    if (results.length < (options.limit || 10) && this.jsonManager?.loaded) {
      // TODO: Implement JSON-based text search
      // For now, JSON is read-only in hybrid mode
    }

    return results;
  }

  /**
   * Add new knowledge
   * Writes to both Supabase and JSON when in hybrid mode
   */
  async add(category, content, source, options = {}) {
    const results = {
      supabase: null,
      json: null,
      success: false,
    };

    // Add to Supabase if available
    if (this.supabaseAvailable) {
      try {
        results.supabase = await this.supabase.add({
          title: content.title || content.name || 'Untitled',
          content: typeof content === 'string' ? content : JSON.stringify(content),
          category: category,
          source: source,
          tags: options.tags || [],
          quality_score: options.qualityScore || 0.5,
          learned_from: options.learnedFrom || 'user',
        });

        // Track learning event
        await this.supabase.trackLearning(
          results.supabase.title,
          source,
          options.learnedFrom || 'user'
        );

        results.success = true;
        this.logger.info('Knowledge added to Supabase', {
          id: results.supabase.id,
        });
      } catch (error) {
        this.logger.error('Failed to add to Supabase', { error: error.message });
      }
    }

    // Also add to JSON (local backup)
    if (this.jsonManager) {
      try {
        // Map category to JSON file
        const fileName = this._categoryToFile(category);
        results.json = await this.jsonManager.add(fileName, category, content, source, options);

        if (!results.success) {
          results.success = results.json.success;
        }

        this.logger.debug('Knowledge added to JSON', {
          file: fileName,
        });
      } catch (error) {
        this.logger.warn('Failed to add to JSON', { error: error.message });
        // Don't fail if Supabase succeeded
      }
    }

    return results;
  }

  /**
   * Get all knowledge by category
   */
  async getByCategory(category) {
    if (this.supabaseAvailable) {
      try {
        return await this.supabase.getByCategory(category);
      } catch (error) {
        this.logger.warn('Supabase getByCategory failed', { error: error.message });
      }
    }

    // Fallback to JSON
    if (this.jsonManager?.loaded) {
      const fileName = this._categoryToFile(category);
      return this.jsonManager.getCategory(fileName, category);
    }

    return [];
  }

  /**
   * Get statistics from all sources
   */
  async getStats() {
    const stats = {
      mode: this.mode,
      supabase: null,
      json: null,
      combined: {
        totalEntries: 0,
        sources: [],
      },
    };

    if (this.supabaseAvailable) {
      try {
        stats.supabase = await this.supabase.getStats();
        stats.combined.totalEntries += stats.supabase.totalEntries || 0;
        stats.combined.sources.push('supabase');
      } catch (error) {
        this.logger.warn('Failed to get Supabase stats', { error: error.message });
      }
    }

    if (this.jsonManager?.loaded) {
      stats.json = this.jsonManager.getStats();
      // Don't double-count if in hybrid mode (Supabase is source of truth)
      if (!this.supabaseAvailable) {
        stats.combined.totalEntries += stats.json.totalEntries || 0;
      }
      stats.combined.sources.push('json');
    }

    return stats;
  }

  /**
   * Log analytics event
   */
  async logQuery(query, resultCount, responseTimeMs) {
    if (this.supabaseAvailable) {
      try {
        await this.supabase.logAnalytics('search', query, {
          resultCount,
          responseTimeMs,
        });
      } catch (error) {
        // Silent fail for analytics
        this.logger.debug('Analytics log failed', { error: error.message });
      }
    }
  }

  /**
   * Map category to JSON file name
   */
  _categoryToFile(category) {
    const mappings = {
      'best-practices': 'best-practices',
      troubleshooting: 'troubleshooting',
      'studio-pro': 'studio-pro',
      'model-sdk': 'model-sdk',
      'platform-sdk': 'platform-sdk',
      widgets: 'pluggable-widgets',
      security: 'security-guide',
      performance: 'performance-guide',
      'getting-started': 'getting-started',
      advanced: 'advanced-patterns',
    };

    // Try exact match first
    if (mappings[category]) {
      return mappings[category];
    }

    // Try partial match
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
        return value;
      }
    }

    // Default to best-practices
    return 'best-practices';
  }

  /**
   * Health check for both storage systems
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      supabase: {
        available: this.supabaseAvailable,
        latency: null,
      },
      json: {
        loaded: this.jsonManager?.loaded || false,
      },
    };

    if (this.supabaseAvailable) {
      try {
        const start = Date.now();
        await this.supabase.getStats();
        health.supabase.latency = Date.now() - start;
      } catch (error) {
        health.supabase.available = false;
        health.status = 'degraded';
      }
    } else {
      if (!health.json.loaded) {
        health.status = 'unhealthy';
      }
    }

    return health;
  }

  /**
   * Sync JSON to Supabase (migration helper)
   */
  async syncToSupabase() {
    if (!this.supabaseAvailable) {
      throw new Error('Supabase not available');
    }

    if (!this.jsonManager?.loaded) {
      throw new Error('JSON knowledge not loaded');
    }

    const stats = {
      synced: 0,
      skipped: 0,
      errors: 0,
    };

    // Iterate through all JSON knowledge
    for (const [fileName, fileData] of Object.entries(this.jsonManager.knowledgeBase)) {
      if (fileData.categories) {
        for (const [category, items] of Object.entries(fileData.categories)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              try {
                await this.supabase.add({
                  title: item.title || item.name || category,
                  content: JSON.stringify(item),
                  category: fileName,
                  source: `json:${fileName}`,
                  tags: item.tags || [],
                  quality_score: item._metadata?.quality_score || 0.5,
                  learned_from: 'migration',
                });
                stats.synced++;
              } catch (error) {
                if (error.message.includes('duplicate')) {
                  stats.skipped++;
                } else {
                  stats.errors++;
                }
              }
            }
          }
        }
      }
    }

    this.logger.info('Sync to Supabase complete', stats);
    return stats;
  }
}

export default HybridKnowledgeManager;
