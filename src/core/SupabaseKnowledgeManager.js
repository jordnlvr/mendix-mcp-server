/**
 * SupabaseKnowledgeManager - Supabase-first knowledge management
 *
 * Drop-in replacement for KnowledgeManager that uses Supabase as the
 * single source of truth. Maintains same interface for SearchEngine
 * and other consumers.
 *
 * The key insight: SearchEngine expects `knowledgeBase` in a specific format
 * (files with categories). This manager fetches from Supabase and transforms
 * into that format for compatibility.
 *
 * @version 1.0.0
 */

import SupabaseKnowledgeStore from '../storage/SupabaseKnowledgeStore.js';
import Logger from '../utils/logger.js';
import QualityScorer from './QualityScorer.js';

class SupabaseKnowledgeManager {
  constructor() {
    this.logger = new Logger('SupabaseKnowledgeManager');
    this.qualityScorer = new QualityScorer();

    // Supabase store
    this.store = new SupabaseKnowledgeStore();

    // In-memory cache of knowledgeBase (for SearchEngine compatibility)
    this.knowledgeBase = {};
    this.loaded = false;

    // Category to file mapping (legacy compatibility)
    this.categoryFileMap = {
      'studio-pro': 'studio-pro',
      'model-sdk': 'model-sdk',
      'platform-sdk': 'platform-sdk',
      'best-practices': 'best-practices',
      troubleshooting: 'troubleshooting',
      'advanced-patterns': 'advanced-patterns',
      'performance-guide': 'performance-guide',
      'security-guide': 'security-guide',
      'sdk-community-resources': 'sdk-community-resources',
      'pluggable-widgets': 'pluggable-widgets',
      'getting-started': 'getting-started',
      general: 'best-practices', // Default fallback
    };

    this.knowledgeFiles = Object.keys(this.categoryFileMap);

    this.logger.info('SupabaseKnowledgeManager initialized');
  }

  /**
   * Initialize connection and load knowledge
   */
  async initialize() {
    try {
      const connected = await this.store.initialize();
      if (!connected) {
        this.logger.error('Failed to connect to Supabase');
        throw new Error('Supabase connection failed');
      }

      await this.load();
      this.logger.info('SupabaseKnowledgeManager ready', {
        entries: this.getStats().totalEntries,
      });

      return true;
    } catch (error) {
      this.logger.error('Initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Load knowledge from Supabase and transform to legacy format
   * This builds the knowledgeBase object that SearchEngine expects
   */
  async load() {
    try {
      this.logger.info('Loading knowledge from Supabase...');

      // Fetch all entries from Supabase
      const entries = await this.store.getAll();

      // Transform to legacy format (grouped by category/file)
      this.knowledgeBase = this._transformToLegacyFormat(entries);
      this.loaded = true;

      this.logger.info('Knowledge loaded from Supabase', {
        entries: entries.length,
        files: Object.keys(this.knowledgeBase).length,
      });

      return this.knowledgeBase;
    } catch (error) {
      this.logger.error('Failed to load from Supabase', { error: error.message });
      throw error;
    }
  }

  /**
   * Reload knowledge base
   */
  async reload() {
    this.logger.info('Reloading knowledge from Supabase');
    this.knowledgeBase = {};
    this.loaded = false;
    return await this.load();
  }

  /**
   * Transform flat Supabase entries to legacy hierarchical format
   * Expected format for SearchEngine:
   * {
   *   "best-practices": {
   *     "topic": "...",
   *     "categories": {
   *       "microflows": [{ title, content, _metadata }, ...]
   *     }
   *   }
   * }
   */
  _transformToLegacyFormat(entries) {
    const result = {};

    // Initialize all known files
    for (const file of this.knowledgeFiles) {
      result[file] = {
        topic: file.replace(/-/g, ' '),
        description: `Knowledge about ${file.replace(/-/g, ' ')}`,
        last_updated: new Date().toISOString(),
        categories: {},
      };
    }

    // Group entries by category
    for (const entry of entries) {
      const category = entry.category || 'general';
      const file = this.categoryFileMap[category] || 'best-practices';

      if (!result[file].categories[category]) {
        result[file].categories[category] = [];
      }

      // Transform to legacy entry format
      const legacyEntry = {
        title: entry.title,
        content: entry.content,
        description: entry.content?.substring(0, 200) + '...',
        _metadata: {
          id: entry.id,
          added_at: entry.created_at,
          updated_at: entry.updated_at,
          source: entry.source,
          source_url: entry.source_url,
          version: entry.version || 1,
          verified: entry.verified || false,
          mendix_version: entry.mendix_version,
          usage_count: entry.usage_count || 0,
          access_count: entry.usage_count || 0,
          quality_score: entry.quality_score || 0.5,
          tags: entry.tags || [],
          feedback: { positive: 0, negative: 0, total: 0 },
        },
      };

      result[file].categories[category].push(legacyEntry);
    }

    return result;
  }

  /**
   * Add new knowledge entry
   * Writes to Supabase and updates local cache
   */
  async add(fileName, category, content, source, options = {}) {
    try {
      // Build entry for Supabase
      const entry = {
        title: content.title || `${category} entry`,
        content: typeof content === 'string' ? content : content.content || JSON.stringify(content),
        category: category || fileName,
        source: source,
        sourceUrl: options.sourceUrl,
        mendixVersion: options.mendixVersion,
        tags: options.tags || [],
        qualityScore: this.qualityScorer.calculateScore(content) || 0.5,
        learnedFrom: options.learnedFrom || 'manual',
      };

      // Add to Supabase
      const result = await this.store.add(entry);

      // Refresh local cache
      await this.reload();

      this.logger.info('Knowledge added to Supabase', {
        id: result.id,
        category,
        duplicate: result.duplicate || false,
      });

      return {
        success: true,
        id: result.id,
        qualityScore: entry.qualityScore,
        duplicate: result.duplicate || false,
      };
    } catch (error) {
      this.logger.error('Failed to add knowledge', { error: error.message });
      throw error;
    }
  }

  /**
   * Update existing knowledge entry
   */
  async update(fileName, entryId, updates, options = {}) {
    try {
      const supabaseUpdates = {
        title: updates.title,
        content: updates.content,
        updated_at: new Date().toISOString(),
      };

      const success = await this.store.update(entryId, supabaseUpdates);

      if (success) {
        await this.reload();
      }

      return { success, id: entryId };
    } catch (error) {
      this.logger.error('Failed to update knowledge', { error: error.message });
      throw error;
    }
  }

  /**
   * Record usage of a knowledge entry
   */
  async recordUsage(fileName, entryId) {
    try {
      await this.store.incrementUsage(entryId);
    } catch (error) {
      this.logger.warn('Failed to record usage', { error: error.message });
    }
  }

  /**
   * Get file data (legacy compatibility)
   */
  getFile(fileName) {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }
    return this.knowledgeBase[fileName] || null;
  }

  /**
   * Get knowledge by category
   */
  getCategory(fileName, category) {
    const fileData = this.getFile(fileName);
    if (!fileData || !fileData.categories) return [];
    return fileData.categories[category] || [];
  }

  /**
   * Search knowledge (uses Supabase full-text search)
   */
  async search(query, limit = 10) {
    return await this.store.search(query, limit);
  }

  /**
   * Get statistics about knowledge base
   */
  getStats() {
    const stats = {
      filesLoaded: Object.keys(this.knowledgeBase).length,
      totalEntries: 0,
      byFile: {},
      storage: 'supabase',
    };

    for (const [fileName, fileData] of Object.entries(this.knowledgeBase)) {
      let count = 0;

      if (fileData.categories) {
        for (const items of Object.values(fileData.categories)) {
          if (Array.isArray(items)) {
            count += items.length;
          }
        }
      }

      stats.byFile[fileName] = count;
      stats.totalEntries += count;
    }

    return stats;
  }

  /**
   * Validate knowledge base (simplified for Supabase)
   */
  validateKnowledgeBase() {
    const stats = this.getStats();

    return {
      valid: stats.totalEntries > 0,
      filesChecked: stats.filesLoaded,
      entriesChecked: stats.totalEntries,
      errors: [],
      warnings: stats.totalEntries === 0 ? ['No knowledge entries found'] : [],
      suggestions: [],
      storage: 'supabase',
    };
  }

  /**
   * Quick validate (lightweight check)
   */
  quickValidate() {
    return {
      valid: this.loaded && Object.keys(this.knowledgeBase).length > 0,
      issues: [],
    };
  }

  /**
   * Get stale entries (entries not used in X days)
   */
  async getStaleEntries(days = 90) {
    // This would query Supabase for entries with last_used_at older than X days
    // For now, return empty - could be enhanced later
    return { count: 0, entries: [] };
  }

  /**
   * Load knowledge base alias (legacy compatibility)
   */
  async loadKnowledgeBase() {
    return await this.load();
  }

  /**
   * Log analytics event
   */
  async logAnalytics(event) {
    return await this.store.logAnalytics(event);
  }

  /**
   * Report a knowledge gap
   */
  async reportGap(gap) {
    return await this.store.reportGap(gap);
  }

  /**
   * Check if Supabase is available
   */
  isAvailable() {
    return this.store.isAvailable();
  }
}

export default SupabaseKnowledgeManager;
