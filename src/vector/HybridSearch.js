/**
 * HybridSearch - Combines TF-IDF keyword search with vector semantic search
 *
 * Uses a fusion algorithm to merge results from both search methods,
 * providing both exact keyword matching and semantic understanding.
 *
 * @version 2.4.2
 */

import SearchEngine from '../core/SearchEngine.js';
import Logger from '../utils/logger.js';
import VectorStore from './VectorStore.js';

const logger = new Logger('HybridSearch');

/**
 * Query Analytics - tracks search patterns to improve the system
 * This is the "brain within the brain" - learns what users search for
 */
class QueryAnalytics {
  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
    this.queries = []; // Recent queries with metadata
    this.termFrequency = new Map(); // Which terms are searched most
    this.resultQuality = new Map(); // Query → avg result count
    this.expansionHits = new Map(); // Which expansions actually help
    this.zeroResultQueries = []; // Queries with no results (knowledge gaps!)
  }

  /**
   * Record a search query and its results
   */
  record(query, results, options = {}) {
    const timestamp = new Date().toISOString();
    const normalizedQuery = query.toLowerCase().trim();

    // Record query
    this.queries.push({
      query: normalizedQuery,
      timestamp,
      resultCount: results.length,
      topScore: results[0]?.fusedScore || results[0]?.score || 0,
      matchTypes: results.map((r) => r.matchType).filter(Boolean),
      expanded: options.expanded || false,
    });

    // Trim history if needed
    if (this.queries.length > this.maxHistory) {
      this.queries = this.queries.slice(-this.maxHistory);
    }

    // Track term frequency
    const terms = normalizedQuery.split(/\s+/);
    for (const term of terms) {
      this.termFrequency.set(term, (this.termFrequency.get(term) || 0) + 1);
    }

    // Track result quality
    const existing = this.resultQuality.get(normalizedQuery) || { count: 0, totalResults: 0 };
    this.resultQuality.set(normalizedQuery, {
      count: existing.count + 1,
      totalResults: existing.totalResults + results.length,
    });

    // Track zero-result queries (knowledge gaps!)
    if (results.length === 0) {
      if (!this.zeroResultQueries.includes(normalizedQuery)) {
        this.zeroResultQueries.push(normalizedQuery);
        // Keep only recent 100 gaps
        if (this.zeroResultQueries.length > 100) {
          this.zeroResultQueries = this.zeroResultQueries.slice(-100);
        }
      }
      logger.info('Knowledge gap detected', { query: normalizedQuery });
    }
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const totalQueries = this.queries.length;
    const avgResults =
      totalQueries > 0 ? this.queries.reduce((sum, q) => sum + q.resultCount, 0) / totalQueries : 0;

    // Top searched terms
    const topTerms = [...this.termFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    // Hit rate (queries with at least 1 result)
    const hits = this.queries.filter((q) => q.resultCount > 0).length;
    const hitRate = totalQueries > 0 ? (hits / totalQueries) * 100 : 0;

    // Match type distribution
    const matchTypes = { both: 0, keyword: 0, vector: 0 };
    for (const q of this.queries) {
      for (const type of q.matchTypes) {
        matchTypes[type] = (matchTypes[type] || 0) + 1;
      }
    }

    return {
      totalQueries,
      avgResults: avgResults.toFixed(1),
      hitRate: hitRate.toFixed(1) + '%',
      topTerms,
      matchTypeDistribution: matchTypes,
      knowledgeGaps: this.zeroResultQueries.slice(-10), // Last 10 gaps
      recentQueries: this.queries.slice(-10).map((q) => ({
        query: q.query,
        results: q.resultCount,
        time: q.timestamp,
      })),
    };
  }

  /**
   * Get suggested expansions based on query patterns
   */
  getSuggestedExpansions() {
    // Find terms that often appear together
    const cooccurrence = new Map();

    for (const q of this.queries) {
      const terms = q.query.split(/\s+/);
      for (let i = 0; i < terms.length; i++) {
        for (let j = i + 1; j < terms.length; j++) {
          const pair = [terms[i], terms[j]].sort().join('|');
          cooccurrence.set(pair, (cooccurrence.get(pair) || 0) + 1);
        }
      }
    }

    // Return top co-occurring pairs
    return [...cooccurrence.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => ({ terms: pair.split('|'), count }));
  }
}

/**
 * Mendix-specific term expansions for better search coverage
 * These help when users use acronyms or alternative terminology
 */
const TERM_EXPANSIONS = {
  sdk: ['software development kit', 'platform sdk', 'model sdk', 'mendixmodelsdk'],
  mf: ['microflow', 'microflows'],
  nf: ['nanoflow', 'nanoflows'],
  dm: ['domain model', 'domain modeling'],
  sp: ['studio pro'],
  api: ['application programming interface', 'rest api', 'odata'],
  crud: ['create read update delete', 'basic operations'],
  acl: ['access control list', 'security rules', 'xpath constraints'],
  xpath: ['query language', 'retrieve expressions'],
  oql: ['object query language', 'reporting queries'],
  jwt: ['json web token', 'authentication token'],
  sso: ['single sign-on', 'authentication'],
  saml: ['security assertion markup language', 'sso authentication'],
  oidc: ['openid connect', 'oauth authentication'],
  ci: ['continuous integration', 'pipeline', 'automation'],
  cd: ['continuous deployment', 'deployment pipeline'],
  mx: ['mendix'],
  attr: ['attribute', 'attributes'],
  assoc: ['association', 'associations', 'relationship'],
  enum: ['enumeration', 'enumerations'],
  np: ['non-persistent', 'transient', 'non persistent entity'],
  pe: ['persistent entity', 'database entity'],
};

export default class HybridSearch {
  constructor(options = {}) {
    // With OpenAI embeddings, favor vector search (better semantic understanding)
    // With local embeddings, favor keyword search (more reliable)
    this.keywordWeight = options.keywordWeight || 0.4;
    this.vectorWeight = options.vectorWeight || 0.6;

    this.keywordEngine = new SearchEngine();
    this.vectorStore = new VectorStore(options.vector || {});

    // Query analytics - the "brain within the brain"
    this.analytics = new QueryAnalytics(1000);

    this.initialized = false;
    logger.info('HybridSearch created', {
      keywordWeight: this.keywordWeight,
      vectorWeight: this.vectorWeight,
    });
  }

  /**
   * Initialize both search engines
   */
  async initialize() {
    if (this.initialized) return;

    await this.vectorStore.initialize();
    this.initialized = true;

    logger.info('HybridSearch initialized');
  }

  /**
   * Index knowledge base in both engines
   */
  async indexKnowledgeBase(knowledgeBase) {
    // Index for keyword search
    this.keywordEngine.indexKnowledgeBase(knowledgeBase);

    // Flatten knowledge base for vector indexing - handle nested structures
    const documents = [];

    for (const [fileName, fileContent] of Object.entries(knowledgeBase)) {
      this.flattenKnowledge(fileContent, fileName, documents);
    }

    logger.info('Flattened knowledge', { totalDocuments: documents.length });

    // Index for vector search
    const vectorStats = await this.vectorStore.indexDocuments(documents);

    logger.info('Knowledge base indexed', {
      keywordEntries: this.keywordEngine.index?.size || 0,
      vectorEntries: vectorStats.indexed,
    });

    return {
      keyword: { entries: this.keywordEngine.index?.size || 0 },
      vector: vectorStats,
    };
  }

  /**
   * Recursively flatten nested knowledge structures into documents
   */
  flattenKnowledge(obj, category, documents, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 5) return;

    // Skip arrays at top level, but process array contents
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          this.flattenKnowledge(item, category, documents, depth + 1);
        }
      }
      return;
    }

    // Check if this object looks like a knowledge entry (has title or meaningful content)
    const hasTitle = obj.title || obj.name;
    const hasContent = obj.description || obj.content || obj.definition || obj.summary;

    if (hasTitle || hasContent) {
      const content = this.extractContent(obj);
      if (content && content.length > 20) {
        // Only add if there's meaningful content
        documents.push({
          title: obj.title || obj.name || category,
          category,
          content,
          source: obj.source || 'knowledge-base',
          version: obj.version || obj.mendix_version || obj.mendix_versions || 'unknown',
        });
      }
    }

    // Recurse into nested objects (like 'categories', 'patterns', etc.)
    for (const [key, value] of Object.entries(obj)) {
      // Skip primitive values and certain metadata fields
      if (value === null || typeof value !== 'object') continue;
      if (['version_info', 'last_updated', 'official_docs'].includes(key)) continue;

      // Recurse with the key as potential category context
      const newCategory = depth === 0 ? key : `${category}/${key}`;
      this.flattenKnowledge(value, newCategory, documents, depth + 1);
    }
  }

  /**
   * Extract searchable content from an entry - COMPREHENSIVE extraction
   * Pulls from ALL useful fields to maximize vector coverage
   */
  extractContent(entry) {
    const parts = [];

    // Core content fields
    if (entry.description) parts.push(entry.description);
    if (entry.content) parts.push(entry.content);
    if (entry.definition) parts.push(entry.definition);
    if (entry.summary) parts.push(entry.summary);
    if (entry.overview) parts.push(entry.overview);

    // Usage and context
    if (entry.when_to_use) parts.push(entry.when_to_use);
    if (entry.use_cases)
      parts.push(Array.isArray(entry.use_cases) ? entry.use_cases.join(' ') : entry.use_cases);
    if (entry.purpose) parts.push(entry.purpose);
    if (entry.context) parts.push(entry.context);

    // Best practices and tips
    if (entry.tips) parts.push(Array.isArray(entry.tips) ? entry.tips.join(' ') : entry.tips);
    if (entry.best_practices) {
      parts.push(
        Array.isArray(entry.best_practices) ? entry.best_practices.join(' ') : entry.best_practices
      );
    }
    if (entry.recommendations) {
      parts.push(
        Array.isArray(entry.recommendations)
          ? entry.recommendations.join(' ')
          : entry.recommendations
      );
    }
    if (entry.guidelines) parts.push(entry.guidelines);

    // Technical details
    if (entry.syntax) parts.push(entry.syntax);
    if (entry.parameters) {
      if (Array.isArray(entry.parameters)) {
        parts.push(entry.parameters.map((p) => `${p.name || ''} ${p.description || ''}`).join(' '));
      } else if (typeof entry.parameters === 'object') {
        parts.push(
          Object.entries(entry.parameters)
            .map(([k, v]) => `${k} ${v}`)
            .join(' ')
        );
      }
    }
    if (entry.return_type) parts.push(entry.return_type);
    if (entry.returns) parts.push(entry.returns);

    // Code examples - very valuable for semantic search!
    if (entry.example)
      parts.push(typeof entry.example === 'string' ? entry.example : JSON.stringify(entry.example));
    if (entry.examples) {
      if (Array.isArray(entry.examples)) {
        parts.push(
          entry.examples
            .map((e) => (typeof e === 'string' ? e : e.code || e.description || ''))
            .join(' ')
        );
      } else {
        parts.push(entry.examples);
      }
    }
    if (entry.code) parts.push(entry.code);
    if (entry.code_snippet) parts.push(entry.code_snippet);
    if (entry.sample) parts.push(entry.sample);

    // Related concepts - helps with semantic connections
    if (entry.related)
      parts.push(Array.isArray(entry.related) ? entry.related.join(' ') : entry.related);
    if (entry.related_topics)
      parts.push(
        Array.isArray(entry.related_topics) ? entry.related_topics.join(' ') : entry.related_topics
      );
    if (entry.see_also)
      parts.push(Array.isArray(entry.see_also) ? entry.see_also.join(' ') : entry.see_also);
    if (entry.tags) parts.push(Array.isArray(entry.tags) ? entry.tags.join(' ') : entry.tags);
    if (entry.keywords)
      parts.push(Array.isArray(entry.keywords) ? entry.keywords.join(' ') : entry.keywords);

    // Troubleshooting and errors
    if (entry.common_issues)
      parts.push(
        Array.isArray(entry.common_issues) ? entry.common_issues.join(' ') : entry.common_issues
      );
    if (entry.errors)
      parts.push(Array.isArray(entry.errors) ? entry.errors.join(' ') : entry.errors);
    if (entry.troubleshooting) parts.push(entry.troubleshooting);
    if (entry.gotchas)
      parts.push(Array.isArray(entry.gotchas) ? entry.gotchas.join(' ') : entry.gotchas);
    if (entry.pitfalls)
      parts.push(Array.isArray(entry.pitfalls) ? entry.pitfalls.join(' ') : entry.pitfalls);

    // Version info
    if (entry.mendix_version) parts.push(`Mendix version ${entry.mendix_version}`);
    if (entry.since_version) parts.push(`Available since ${entry.since_version}`);
    if (entry.deprecated_in) parts.push(`Deprecated in ${entry.deprecated_in}`);

    // Steps and procedures
    if (entry.steps) {
      if (Array.isArray(entry.steps)) {
        parts.push(
          entry.steps
            .map((s) => (typeof s === 'string' ? s : s.description || s.action || ''))
            .join(' ')
        );
      }
    }
    if (entry.procedure) parts.push(entry.procedure);
    if (entry.how_to) parts.push(entry.how_to);

    // Notes and warnings
    if (entry.notes) parts.push(Array.isArray(entry.notes) ? entry.notes.join(' ') : entry.notes);
    if (entry.warnings)
      parts.push(Array.isArray(entry.warnings) ? entry.warnings.join(' ') : entry.warnings);
    if (entry.important) parts.push(entry.important);

    return parts.filter((p) => p && p.length > 0).join(' ');
  }

  /**
   * Expand query with Mendix-specific term mappings
   * "SDK" becomes "SDK software development kit platform sdk model sdk"
   */
  expandQuery(query) {
    const words = query.toLowerCase().split(/\s+/);
    const expanded = [...words];

    for (const word of words) {
      if (TERM_EXPANSIONS[word]) {
        expanded.push(...TERM_EXPANSIONS[word]);
      }
    }

    // Remove duplicates and rejoin
    return [...new Set(expanded)].join(' ');
  }

  /**
   * Hybrid search combining keyword and vector results
   * Runs both searches in PARALLEL for speed!
   */
  async search(query, options = {}) {
    const { limit = 10, keywordOnly = false, vectorOnly = false, expandTerms = true } = options;

    // Expand query with Mendix-specific terms
    const expandedQuery = expandTerms ? this.expandQuery(query) : query;

    // Run keyword and vector searches IN PARALLEL for speed!
    const searchPromises = [];

    // Keyword search (synchronous but wrap in promise)
    if (!vectorOnly) {
      searchPromises.push(
        Promise.resolve(this.keywordEngine.search(expandedQuery, { limit: limit * 2 }))
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Vector search (uses original query - embeddings understand meaning better)
    if (!keywordOnly && this.vectorStore.initialized) {
      searchPromises.push(this.vectorStore.search(query, { topK: limit * 2 }));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Wait for both to complete
    const [keywordResults, vectorResults] = await Promise.all(searchPromises);

    // Determine final results
    let finalResults;

    // If only one engine available, return its results
    if (keywordOnly || vectorResults.length === 0) {
      finalResults = this.formatKeywordResults(keywordResults.slice(0, limit));
    } else if (vectorOnly || keywordResults.length === 0) {
      finalResults = this.formatVectorResults(vectorResults.slice(0, limit));
    } else {
      // Reciprocal Rank Fusion
      const fusedResults = this.reciprocalRankFusion(keywordResults, vectorResults);
      finalResults = fusedResults.slice(0, limit);
    }

    // Record analytics (brain within the brain!)
    this.analytics.record(query, finalResults, { expanded: expandTerms });

    return finalResults;
  }

  /**
   * Get query analytics summary
   */
  getAnalytics() {
    return this.analytics.getSummary();
  }

  /**
   * Get suggested term expansions based on search patterns
   */
  getSuggestedExpansions() {
    return this.analytics.getSuggestedExpansions();
  }

  /**
   * Reciprocal Rank Fusion algorithm for merging ranked lists
   * RRF(d) = Σ 1 / (k + rank(d))
   */
  reciprocalRankFusion(keywordResults, vectorResults, k = 60) {
    const scores = new Map();
    const metadata = new Map();

    // Score keyword results
    keywordResults.forEach((result, rank) => {
      const title =
        this.extractTitle(result.entry) || result.title || `${result.category || 'item'}-${rank}`;
      const id = title;
      const rrfScore = this.keywordWeight / (k + rank + 1);
      scores.set(id, (scores.get(id) || 0) + rrfScore);

      if (!metadata.has(id)) {
        metadata.set(id, {
          title: title,
          category: result.category,
          entry: result.entry,
          keywordScore: result.score,
          sources: ['keyword'],
        });
      } else {
        metadata.get(id).keywordScore = result.score;
        metadata.get(id).sources.push('keyword');
      }
    });

    // Score vector results
    vectorResults.forEach((result, rank) => {
      const id = result.title || `vec-${rank}`;
      const rrfScore = this.vectorWeight / (k + rank + 1);
      scores.set(id, (scores.get(id) || 0) + rrfScore);

      if (!metadata.has(id)) {
        metadata.set(id, {
          title: result.title,
          category: result.category,
          preview: result.preview,
          vectorScore: result.score,
          sources: ['vector'],
        });
      } else {
        metadata.get(id).vectorScore = result.score;
        if (!metadata.get(id).sources.includes('vector')) {
          metadata.get(id).sources.push('vector');
        }
      }
    });

    // Sort by fused score with freshness boosting
    const sorted = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, fusedScore]) => {
        const meta = metadata.get(id);

        // Apply freshness boost based on Mendix version or timestamp
        const freshnessBoost = this.calculateFreshnessBoost(meta.entry);
        const boostedScore = fusedScore * (1 + freshnessBoost);

        return {
          ...meta,
          fusedScore: boostedScore,
          originalScore: fusedScore,
          freshnessBoost: freshnessBoost > 0 ? `+${(freshnessBoost * 100).toFixed(0)}%` : null,
          matchType: meta.sources.length > 1 ? 'both' : meta.sources[0],
        };
      })
      .sort((a, b) => b.fusedScore - a.fusedScore); // Re-sort after boosting

    // Deduplicate near-duplicates (same title with slight variations)
    return this.deduplicateResults(sorted);
  }

  /**
   * Remove near-duplicate results based on title similarity
   * Keeps the highest-scoring version of similar results
   */
  deduplicateResults(results) {
    const seen = new Map(); // normalized title -> best result
    const deduplicated = [];

    for (const result of results) {
      // Normalize title for comparison
      const normalizedTitle = this.normalizeForDedup(result.title);

      if (!seen.has(normalizedTitle)) {
        seen.set(normalizedTitle, result);
        deduplicated.push(result);
      } else {
        // Keep the one with higher score or more sources
        const existing = seen.get(normalizedTitle);
        if (
          result.fusedScore > existing.fusedScore ||
          (result.sources?.length || 0) > (existing.sources?.length || 0)
        ) {
          // Replace existing with better result
          const idx = deduplicated.indexOf(existing);
          if (idx !== -1) {
            deduplicated[idx] = result;
            seen.set(normalizedTitle, result);
          }
        }
      }
    }

    return deduplicated;
  }

  /**
   * Normalize title for deduplication comparison
   */
  normalizeForDedup(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove punctuation
      .replace(/\s+/g, ''); // Remove spaces
  }

  /**
   * Extract title from entry - handles various knowledge base formats
   */
  extractTitle(entry) {
    if (!entry) return null;

    // Try common title fields in order of preference
    const titleFields = [
      'title',
      'topic',
      'name',
      'practice',
      'pattern_name',
      'problem',
      'feature',
      'scenario',
      'issue',
      'question',
      'rule',
      'technique',
    ];

    for (const field of titleFields) {
      if (entry[field] && typeof entry[field] === 'string') {
        return entry[field];
      }
    }

    // Try nested structures
    if (entry.pattern?.name) return entry.pattern.name;
    if (entry._metadata?.title) return entry._metadata.title;

    // Fall back to first string value
    for (const value of Object.values(entry)) {
      if (typeof value === 'string' && value.length > 3 && value.length < 100) {
        return value;
      }
    }

    return null;
  }

  /**
   * Calculate freshness boost based on Mendix version or content age
   * Newer Mendix versions get a score boost since they're more relevant
   * @param {Object} entry - Knowledge entry with potential version info
   * @returns {number} Boost factor (0 to 0.15)
   */
  calculateFreshnessBoost(entry) {
    if (!entry) return 0;

    // Look for version info in various fields
    const versionSources = [
      entry.mendix_version,
      entry.version,
      entry.title,
      entry.description,
      typeof entry === 'string' ? entry : JSON.stringify(entry),
    ]
      .filter(Boolean)
      .join(' ');

    // Studio Pro 11.x - Highest priority (latest)
    if (/studio\s*pro\s*11|mendix\s*11|11\.\d+\.\d+/i.test(versionSources)) {
      return 0.15; // 15% boost
    }

    // Studio Pro 10.x - Very relevant
    if (/studio\s*pro\s*10|mendix\s*10|10\.\d+\.\d+/i.test(versionSources)) {
      return 0.1; // 10% boost
    }

    // Studio Pro 9.x - Still useful
    if (/studio\s*pro\s*9|mendix\s*9|9\.\d+\.\d+/i.test(versionSources)) {
      return 0.05; // 5% boost
    }

    // Check for timestamp-based freshness
    const timestamp = entry.added_at || entry.timestamp || entry.date;
    if (timestamp) {
      const age = Date.now() - new Date(timestamp).getTime();
      const daysSinceAdded = age / (1000 * 60 * 60 * 24);

      if (daysSinceAdded < 30) return 0.1; // Less than 1 month old
      if (daysSinceAdded < 90) return 0.05; // Less than 3 months old
    }

    return 0; // No boost for older or version-unknown content
  }

  /**
   * Format keyword results for consistency
   */
  formatKeywordResults(results) {
    return results.map((r) => ({
      title: this.extractTitle(r.entry) || r.title || `${r.category || 'item'}`,
      category: r.category,
      entry: r.entry,
      keywordScore: r.score,
      matchType: 'keyword',
    }));
  }

  /**
   * Format vector results for consistency
   */
  formatVectorResults(results) {
    return results.map((r) => ({
      title: r.title,
      category: r.category,
      preview: r.preview,
      vectorScore: r.score,
      matchType: 'vector',
    }));
  }

  /**
   * Get the VectorStore instance for auto-indexing new entries
   * Used by SupabaseKnowledgeManager to index new knowledge to Pinecone
   */
  getVectorStore() {
    return this.vectorStore;
  }

  /**
   * Get search engine statistics
   */
  async getStats() {
    const vectorStats = await this.vectorStore.getStats();

    return {
      keyword: {
        indexed: this.keywordEngine.index?.size || 0,
        terms: this.keywordEngine.documentFrequency?.size || 0,
      },
      vector: vectorStats,
      weights: {
        keyword: this.keywordWeight,
        vector: this.vectorWeight,
      },
      analytics: this.analytics.getSummary(),
    };
  }
}
