/**
 * HybridSearch - Combines TF-IDF keyword search with vector semantic search
 * 
 * Uses a fusion algorithm to merge results from both search methods,
 * providing both exact keyword matching and semantic understanding.
 * 
 * @version 2.3.0
 */

import SearchEngine from '../core/SearchEngine.js';
import VectorStore from './VectorStore.js';
import { Logger } from '../utils/Logger.js';

const logger = new Logger('HybridSearch');

export default class HybridSearch {
  constructor(options = {}) {
    this.keywordWeight = options.keywordWeight || 0.6;
    this.vectorWeight = options.vectorWeight || 0.4;
    
    this.keywordEngine = new SearchEngine();
    this.vectorStore = new VectorStore(options.vector || {});
    
    this.initialized = false;
    logger.info('HybridSearch created', { 
      keywordWeight: this.keywordWeight, 
      vectorWeight: this.vectorWeight 
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
    
    // Flatten knowledge base for vector indexing
    const documents = [];
    for (const [category, entries] of Object.entries(knowledgeBase)) {
      for (const [title, entry] of Object.entries(entries)) {
        documents.push({
          title,
          category,
          content: this.extractContent(entry),
          source: entry.source || 'knowledge-base',
          version: entry.version || entry.mendix_version || 'unknown'
        });
      }
    }

    // Index for vector search
    const vectorStats = await this.vectorStore.indexDocuments(documents);
    
    logger.info('Knowledge base indexed', {
      keywordEntries: this.keywordEngine.index?.size || 0,
      vectorEntries: vectorStats.indexed
    });

    return {
      keyword: { entries: this.keywordEngine.index?.size || 0 },
      vector: vectorStats
    };
  }

  /**
   * Extract searchable content from an entry
   */
  extractContent(entry) {
    const parts = [];
    
    if (entry.description) parts.push(entry.description);
    if (entry.content) parts.push(entry.content);
    if (entry.definition) parts.push(entry.definition);
    if (entry.when_to_use) parts.push(entry.when_to_use);
    if (entry.summary) parts.push(entry.summary);
    if (entry.tips) parts.push(Array.isArray(entry.tips) ? entry.tips.join(' ') : entry.tips);
    if (entry.best_practices) {
      parts.push(Array.isArray(entry.best_practices) 
        ? entry.best_practices.join(' ') 
        : entry.best_practices);
    }
    
    return parts.join(' ');
  }

  /**
   * Hybrid search combining keyword and vector results
   */
  async search(query, options = {}) {
    const { limit = 10, keywordOnly = false, vectorOnly = false } = options;

    // Keyword search
    let keywordResults = [];
    if (!vectorOnly) {
      keywordResults = this.keywordEngine.search(query, { limit: limit * 2 });
    }

    // Vector search
    let vectorResults = [];
    if (!keywordOnly && this.vectorStore.initialized) {
      vectorResults = await this.vectorStore.search(query, { topK: limit * 2 });
    }

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
      const id = result.entry?.title || result.title || `kw-${rank}`;
      const rrfScore = this.keywordWeight / (k + rank + 1);
      scores.set(id, (scores.get(id) || 0) + rrfScore);
      
      if (!metadata.has(id)) {
        metadata.set(id, {
          title: result.entry?.title || result.title,
          category: result.category,
          entry: result.entry,
          keywordScore: result.score,
          sources: ['keyword']
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
          sources: ['vector']
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
        matchType: metadata.get(id).sources.length > 1 ? 'both' : metadata.get(id).sources[0]
      }));

    return sorted;
  }

  /**
   * Format keyword results for consistency
   */
  formatKeywordResults(results) {
    return results.map(r => ({
      title: r.entry?.title || r.title,
      category: r.category,
      entry: r.entry,
      keywordScore: r.score,
      matchType: 'keyword'
    }));
  }

  /**
   * Format vector results for consistency
   */
  formatVectorResults(results) {
    return results.map(r => ({
      title: r.title,
      category: r.category,
      preview: r.preview,
      vectorScore: r.score,
      matchType: 'vector'
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
        terms: this.keywordEngine.documentFrequency?.size || 0
      },
      vector: vectorStats,
      weights: {
        keyword: this.keywordWeight,
        vector: this.vectorWeight
      }
    };
  }
}
