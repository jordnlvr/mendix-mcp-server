/**
 * HybridSearch - Combines TF-IDF keyword search with vector semantic search
 *
 * Uses a fusion algorithm to merge results from both search methods,
 * providing both exact keyword matching and semantic understanding.
 *
 * @version 2.4.1
 */

import SearchEngine from '../core/SearchEngine.js';
import Logger from '../utils/logger.js';
import VectorStore from './VectorStore.js';

const logger = new Logger('HybridSearch');

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

    // If only one engine available, return its results
    if (keywordOnly || vectorResults.length === 0) {
      return this.formatKeywordResults(keywordResults.slice(0, limit));
    }
    if (vectorOnly || keywordResults.length === 0) {
      return this.formatVectorResults(vectorResults.slice(0, limit));
    }

    // Reciprocal Rank Fusion
    const fusedResults = this.reciprocalRankFusion(keywordResults, vectorResults);

    return fusedResults.slice(0, limit);
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

    // Sort by fused score
    const sorted = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, fusedScore]) => ({
        ...metadata.get(id),
        fusedScore,
        matchType: metadata.get(id).sources.length > 1 ? 'both' : metadata.get(id).sources[0],
      }));

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
        if (result.fusedScore > existing.fusedScore || 
            (result.sources?.length || 0) > (existing.sources?.length || 0)) {
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
      .replace(/\s+/g, '');       // Remove spaces
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
    };
  }
}
