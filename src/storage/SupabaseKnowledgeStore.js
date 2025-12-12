/**
 * Supabase Knowledge Store
 *
 * Cloud-based knowledge storage using Supabase (PostgreSQL).
 * Replaces JSON file storage for persistent, shared knowledge across
 * all instances (local MCP, Railway, ChatGPT, etc.)
 *
 * Features:
 * - Full-text search with PostgreSQL
 * - Automatic deduplication via content hash
 * - Usage tracking and quality scoring
 * - Real-time sync across all instances
 *
 * @version 1.0.0
 */

import crypto from 'crypto';
import Logger from '../utils/logger.js';

const logger = new Logger('SupabaseStore');

class SupabaseKnowledgeStore {
  constructor(options = {}) {
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = options.supabaseKey || process.env.SUPABASE_ANON_KEY;
    this.initialized = false;
    this.cache = new Map(); // Local cache for frequently accessed items
    this.cacheMaxAge = options.cacheMaxAge || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the store and verify connection
   */
  async initialize() {
    if (this.initialized) return true;

    if (!this.supabaseUrl || !this.supabaseKey) {
      logger.warn('Supabase credentials not configured, falling back to JSON storage');
      return false;
    }

    try {
      // Test connection by fetching count
      const response = await this._fetch('/knowledge?select=count', 'GET');

      if (response.ok) {
        const data = await response.json();
        logger.info('Supabase connected', { entries: data[0]?.count || 0 });
        this.initialized = true;
        return true;
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to initialize Supabase', { error: error.message });
      return false;
    }
  }

  /**
   * Internal fetch wrapper for Supabase REST API
   */
  async _fetch(path, method = 'GET', body = null, headers = {}) {
    const url = `${this.supabaseUrl}/rest/v1${path}`;

    const options = {
      method,
      headers: {
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  /**
   * Generate content hash for deduplication
   */
  _generateHash(title, content) {
    const normalized = `${title.toLowerCase().trim()}:${content.toLowerCase().trim()}`;
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get all knowledge entries
   */
  async getAll() {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) return [];
    }

    try {
      const response = await this._fetch('/knowledge?select=*&order=quality_score.desc');
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      return await response.json();
    } catch (error) {
      logger.error('Failed to get all knowledge', { error: error.message });
      return [];
    }
  }

  /**
   * Get knowledge by category
   */
  async getByCategory(category) {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this._fetch(
        `/knowledge?category=eq.${encodeURIComponent(category)}&order=quality_score.desc`
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      return await response.json();
    } catch (error) {
      logger.error('Failed to get by category', { category, error: error.message });
      return [];
    }
  }

  /**
   * Search knowledge using PostgreSQL full-text search
   */
  async search(query, limit = 10) {
    if (!this.initialized) await this.initialize();

    try {
      // Use the search_knowledge function we created
      const response = await this._fetch(`/rpc/search_knowledge`, 'POST', {
        search_query: query,
        limit_count: limit,
      });

      if (!response.ok) {
        // Fallback to simple ILIKE search
        const fallback = await this._fetch(
          `/knowledge?or=(title.ilike.*${encodeURIComponent(
            query
          )}*,content.ilike.*${encodeURIComponent(query)}*)&limit=${limit}&order=quality_score.desc`
        );
        if (!fallback.ok) throw new Error(`Search failed: ${response.status}`);
        return await fallback.json();
      }

      return await response.json();
    } catch (error) {
      logger.error('Search failed', { query, error: error.message });
      return [];
    }
  }

  /**
   * Add new knowledge entry
   * Automatically checks for duplicates via content hash
   */
  async add(entry) {
    if (!this.initialized) await this.initialize();

    const contentHash = this._generateHash(entry.title, entry.content);

    try {
      // Check if already exists
      const existing = await this._fetch(
        `/knowledge?content_hash=eq.${contentHash}&select=id,usage_count`
      );

      if (existing.ok) {
        const existingData = await existing.json();
        if (existingData.length > 0) {
          // Update usage count instead of inserting duplicate
          logger.info('Knowledge already exists, updating usage', {
            id: existingData[0].id,
            title: entry.title,
          });
          await this.incrementUsage(existingData[0].id);
          return { ...existingData[0], duplicate: true };
        }
      }

      // Insert new entry
      const newEntry = {
        title: entry.title,
        content: entry.content,
        category: entry.category || 'general',
        source: entry.source || 'unknown',
        source_url: entry.sourceUrl || entry.source_url,
        mendix_version: entry.mendixVersion || entry.mendix_version,
        tags: entry.tags || [],
        quality_score: entry.qualityScore || entry.quality_score || 0.5,
        learned_from: entry.learnedFrom || entry.learned_from || 'manual',
        content_hash: contentHash,
      };

      const response = await this._fetch('/knowledge', 'POST', newEntry);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Insert failed: ${error}`);
      }

      const inserted = await response.json();
      logger.info('Knowledge added', { id: inserted[0]?.id, title: entry.title });

      return inserted[0];
    } catch (error) {
      logger.error('Failed to add knowledge', { title: entry.title, error: error.message });
      throw error;
    }
  }

  /**
   * Add multiple entries (bulk insert)
   */
  async addBulk(entries) {
    if (!this.initialized) await this.initialize();

    const results = { added: 0, skipped: 0, errors: [] };

    for (const entry of entries) {
      try {
        const result = await this.add(entry);
        if (result.duplicate) {
          results.skipped++;
        } else {
          results.added++;
        }
      } catch (error) {
        results.errors.push({ title: entry.title, error: error.message });
      }
    }

    logger.info('Bulk add complete', results);
    return results;
  }

  /**
   * Update an existing entry
   */
  async update(id, updates) {
    if (!this.initialized) await this.initialize();

    try {
      // If title or content changed, update hash
      if (updates.title || updates.content) {
        const existing = await this.getById(id);
        if (existing) {
          const newHash = this._generateHash(
            updates.title || existing.title,
            updates.content || existing.content
          );
          updates.content_hash = newHash;
        }
      }

      const response = await this._fetch(`/knowledge?id=eq.${id}`, 'PATCH', updates);

      if (!response.ok) throw new Error(`Update failed: ${response.status}`);

      logger.info('Knowledge updated', { id });
      return true;
    } catch (error) {
      logger.error('Failed to update knowledge', { id, error: error.message });
      return false;
    }
  }

  /**
   * Get entry by ID
   */
  async getById(id) {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this._fetch(`/knowledge?id=eq.${id}&select=*`);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      logger.error('Failed to get by ID', { id, error: error.message });
      return null;
    }
  }

  /**
   * Increment usage count when knowledge is returned in search
   */
  async incrementUsage(id) {
    if (!this.initialized) await this.initialize();

    try {
      // Get current count
      const entry = await this.getById(id);
      if (!entry) return false;

      const response = await this._fetch(`/knowledge?id=eq.${id}`, 'PATCH', {
        usage_count: (entry.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to increment usage', { id, error: error.message });
      return false;
    }
  }

  /**
   * Log analytics event
   */
  async logAnalytics(event) {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this._fetch('/analytics', 'POST', {
        event_type: event.type,
        query: event.query,
        results_count: event.resultsCount,
        knowledge_ids: event.knowledgeIds || [],
        source: event.source || 'unknown',
        session_id: event.sessionId,
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to log analytics', { error: error.message });
      return false;
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalytics(days = 7) {
    if (!this.initialized) await this.initialize();

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const response = await this._fetch(
        `/analytics?created_at=gte.${since.toISOString()}&select=*`
      );

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const events = await response.json();

      // Aggregate
      const summary = {
        totalEvents: events.length,
        byType: {},
        topQueries: {},
        bySource: {},
      };

      for (const event of events) {
        summary.byType[event.event_type] = (summary.byType[event.event_type] || 0) + 1;
        summary.bySource[event.source] = (summary.bySource[event.source] || 0) + 1;
        if (event.query) {
          summary.topQueries[event.query] = (summary.topQueries[event.query] || 0) + 1;
        }
      }

      return summary;
    } catch (error) {
      logger.error('Failed to get analytics', { error: error.message });
      return null;
    }
  }

  /**
   * Log harvest result
   */
  async logHarvest(result) {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this._fetch('/harvest_log', 'POST', {
        source: result.source,
        entries_added: result.added || 0,
        entries_updated: result.updated || 0,
        entries_skipped: result.skipped || 0,
        duration_ms: result.durationMs,
        status: result.status || 'completed',
        error_message: result.error,
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to log harvest', { error: error.message });
      return false;
    }
  }

  /**
   * Report a knowledge gap
   */
  async reportGap(gap) {
    if (!this.initialized) await this.initialize();

    try {
      const response = await this._fetch('/knowledge_gaps', 'POST', {
        topic: gap.topic,
        description: gap.description,
        query_that_failed: gap.query,
        priority: gap.priority || 'medium',
      });

      if (!response.ok) throw new Error(`Insert failed: ${response.status}`);

      logger.info('Knowledge gap reported', { topic: gap.topic });
      return true;
    } catch (error) {
      logger.error('Failed to report gap', { error: error.message });
      return false;
    }
  }

  /**
   * Get statistics
   */
  async getStats() {
    if (!this.initialized) await this.initialize();

    try {
      const [knowledge, analytics, gaps] = await Promise.all([
        this._fetch('/knowledge?select=count'),
        this._fetch('/analytics?select=count'),
        this._fetch('/knowledge_gaps?status=eq.open&select=count'),
      ]);

      const knowledgeCount = (await knowledge.json())[0]?.count || 0;
      const analyticsCount = (await analytics.json())[0]?.count || 0;
      const gapsCount = (await gaps.json())[0]?.count || 0;

      // Get categories
      const categories = await this._fetch('/knowledge?select=category&order=category');
      const categoryData = await categories.json();
      const uniqueCategories = [...new Set(categoryData.map((k) => k.category))];

      return {
        totalKnowledge: parseInt(knowledgeCount),
        totalAnalyticsEvents: parseInt(analyticsCount),
        openGaps: parseInt(gapsCount),
        categories: uniqueCategories.length,
        storage: 'supabase',
        initialized: this.initialized,
      };
    } catch (error) {
      logger.error('Failed to get stats', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Check if store is available
   */
  isAvailable() {
    return this.initialized;
  }
}

export default SupabaseKnowledgeStore;
