/**
 * SearchEngine - Efficient knowledge base search with relevance scoring
 * Implements inverted index for fast text search and semantic matching
 */

import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';

class SearchEngine {
  constructor() {
    this.logger = new Logger('SearchEngine');
    this.config = getConfig();

    // Inverted index: word -> list of (fileId, entryId, field, position)
    this.index = new Map();

    // Document store: entryId -> full entry
    this.documents = new Map();

    // PERFORMANCE: Pre-computed term list for fuzzy matching
    this.termList = [];

    // ANALYTICS: Track search patterns
    this.analytics = {
      totalSearches: 0,
      totalHits: 0,
      totalMisses: 0,
      queryHistory: [], // Last N queries with timestamps
      popularTerms: new Map(), // term -> count
      missedQueries: [], // Queries with 0 results
      avgResponseTime: 0,
      searchTimes: [],
    };
    this.maxHistorySize = 100;

    // Stopwords to ignore
    this.stopWords = new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'has',
      'he',
      'in',
      'is',
      'it',
      'its',
      'of',
      'on',
      'that',
      'the',
      'to',
      'was',
      'will',
      'with',
    ]);

    // Mendix-specific synonyms (bidirectional)
    this.synonyms = new Map([
      // Abbreviations
      ['mf', ['microflow', 'microflows']],
      ['microflow', ['mf']],
      ['nf', ['nanoflow', 'nanoflows']],
      ['nanoflow', ['nf']],
      ['dm', ['domain', 'domainmodel']],
      ['domainmodel', ['dm', 'domain']],
      ['np', ['nonpersistent', 'non-persistent']],
      ['nonpersistent', ['np']],
      ['sdk', ['modelsdk', 'platformsdk']],
      ['modelsdk', ['sdk', 'model-sdk']],
      ['platformsdk', ['sdk', 'platform-sdk']],
      // Common terms
      ['entity', ['entities', 'object', 'objects']],
      ['attribute', ['attributes', 'field', 'fields', 'property', 'properties']],
      ['association', ['associations', 'relationship', 'relationships', 'reference', 'references']],
      ['page', ['pages', 'form', 'forms', 'screen', 'screens']],
      ['widget', ['widgets', 'component', 'components']],
      ['module', ['modules']],
      ['xpath', ['x-path', 'query', 'queries']],
      ['oql', ['o-q-l']],
      ['rest', ['restful', 'api', 'apis']],
      ['commit', ['commits', 'save', 'persist']],
      ['rollback', ['rollbacks', 'revert', 'undo']],
      ['loop', ['loops', 'iteration', 'iterate', 'foreach', 'for-each']],
      ['error', ['errors', 'exception', 'exceptions', 'bug', 'bugs', 'issue', 'issues']],
      ['performance', ['perf', 'speed', 'optimization', 'optimize', 'fast', 'slow']],
      ['security', ['secure', 'permission', 'permissions', 'access', 'role', 'roles']],
    ]);

    // Simple stemming rules (suffix stripping)
    this.stemmingRules = [
      { suffix: 'ies', replacement: 'y' }, // entities -> entity
      { suffix: 'es', replacement: '' }, // microflows -> microflow (after 'ies')
      { suffix: 's', replacement: '' }, // models -> model
      { suffix: 'ing', replacement: '' }, // modeling -> model
      { suffix: 'ed', replacement: '' }, // configured -> configur
      { suffix: 'tion', replacement: 't' }, // creation -> creat
      { suffix: 'ation', replacement: '' }, // configuration -> configur
    ];

    this.logger.info('SearchEngine initialized with stemming and synonyms');
  }

  /**
   * Index knowledge base for searching
   */
  indexKnowledgeBase(knowledgeBase) {
    this.logger.info('Indexing knowledge base');

    let indexed = 0;

    for (const [fileName, fileData] of Object.entries(knowledgeBase)) {
      // Skip non-knowledge entries
      if (!fileData.categories && !fileData.items) continue;

      // Index categories
      if (fileData.categories) {
        for (const [category, items] of Object.entries(fileData.categories)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              this._indexEntry(fileName, category, item);
              indexed++;
            }
          }
        }
      }

      // Index root items
      if (fileData.items && Array.isArray(fileData.items)) {
        for (const item of fileData.items) {
          this._indexEntry(fileName, null, item);
          indexed++;
        }
      }
    }

    this.logger.info('Indexing complete', {
      entries: indexed,
      uniqueTerms: this.index.size,
    });

    // PERFORMANCE: Build sorted term list for fuzzy matching
    this.termList = Array.from(this.index.keys()).sort();

    return { indexed, uniqueTerms: this.index.size };
  }

  /**
   * Search knowledge base with relevance scoring
   */
  search(query, options = {}) {
    const startTime = performance.now();
    const maxResults = options.maxResults || this.config.get('search.maxResults', 10);
    const minScore = options.minScore || this.config.get('search.minRelevanceScore', 0.3);
    const filterFiles = options.files || null;
    const filterCategories = options.categories || null;
    const enableFuzzy = options.fuzzy !== false; // Default: enabled

    // Tokenize and normalize query (with synonym expansion)
    let queryTerms = this._tokenize(query, { expandSynonyms: true });
    const originalTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTerms.length === 0) {
      this._recordAnalytics(query, 0, performance.now() - startTime);
      return [];
    }

    // FUZZY SEARCH: Expand terms with fuzzy matches for typo tolerance
    if (enableFuzzy) {
      queryTerms = this._expandWithFuzzyMatches(queryTerms);
    }

    this.logger.debug('Searching', {
      query,
      originalTerms: originalTerms.length,
      expandedTerms: queryTerms.length,
      maxResults,
      minScore,
    });

    // Find matching documents
    const matches = this._findMatches(queryTerms);

    // Calculate relevance scores
    const scored = matches.map((match) => ({
      ...match,
      score: this._calculateRelevance(match, queryTerms, query),
    }));

    // Filter by score threshold
    let filtered = scored.filter((item) => item.score >= minScore);

    // Apply filters
    if (filterFiles && filterFiles.length > 0) {
      filtered = filtered.filter((item) => filterFiles.includes(item.file));
    }

    if (filterCategories && filterCategories.length > 0) {
      filtered = filtered.filter((item) =>
        item.category ? filterCategories.includes(item.category) : false
      );
    }

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    // Limit results
    const results = filtered.slice(0, maxResults);

    this.logger.debug('Search complete', {
      totalMatches: matches.length,
      afterFiltering: filtered.length,
      returned: results.length,
    });

    // ANALYTICS: Record this search
    this._recordAnalytics(query, results.length, performance.now() - startTime);

    return results;
  }

  /**
   * Find entries similar to given content
   */
  findSimilar(content, options = {}) {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    return this.search(contentStr, {
      ...options,
      minScore: options.minScore || 0.5,
    });
  }

  /**
   * Suggest related topics based on query
   */
  suggestRelated(query, count = 5) {
    const results = this.search(query, { maxResults: count * 2 });

    // Extract unique topics/categories
    const topics = new Set();

    for (const result of results) {
      if (result.category) {
        topics.add(result.category);
      }

      // Extract keywords from matched content
      const entry = result.entry;
      if (entry.practice) topics.add(entry.practice);
      if (entry.feature) topics.add(entry.feature);
      if (entry.pattern) topics.add(entry.pattern);
    }

    return Array.from(topics).slice(0, count);
  }

  /**
   * Clear index
   */
  clear() {
    this.index.clear();
    this.documents.clear();
    this.logger.info('Search index cleared');
  }

  /**
   * Get search statistics including analytics
   */
  getStats() {
    return {
      indexedDocuments: this.documents.size,
      indexedTerms: this.index.size,
      averageTermsPerDocument:
        this.documents.size > 0 ? Math.round((this.index.size / this.documents.size) * 10) / 10 : 0,
      // Analytics
      analytics: {
        totalSearches: this.analytics.totalSearches,
        totalHits: this.analytics.totalHits,
        totalMisses: this.analytics.totalMisses,
        hitRate:
          this.analytics.totalSearches > 0
            ? Math.round((this.analytics.totalHits / this.analytics.totalSearches) * 100)
            : 0,
        avgResponseTimeMs: Math.round(this.analytics.avgResponseTime * 100) / 100,
        topSearchTerms: this._getTopTerms(10),
        recentMissedQueries: this.analytics.missedQueries.slice(-10),
      },
    };
  }

  /**
   * Index a single entry
   */
  _indexEntry(fileName, category, entry) {
    const entryId = entry._metadata?.id || `${fileName}_${Date.now()}`;

    // Store full document
    this.documents.set(entryId, {
      file: fileName,
      category,
      entry,
    });

    // Extract and index text fields
    const text = this._extractText(entry);
    const terms = this._tokenize(text);

    // Add to inverted index
    terms.forEach((term, position) => {
      if (!this.index.has(term)) {
        this.index.set(term, []);
      }

      this.index.get(term).push({
        entryId,
        fileName,
        category,
        position,
        field: 'content',
      });
    });
  }

  /**
   * Extract searchable text from entry
   */
  _extractText(entry) {
    const textParts = [];

    // Recursive function to extract strings
    const extract = (obj, depth = 0) => {
      if (depth > 5) return; // Prevent infinite recursion

      if (typeof obj === 'string') {
        textParts.push(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          extract(value, depth + 1);
        }
      }
    };

    extract(entry);

    return textParts.join(' ');
  }

  /**
   * Stem a word using simple suffix stripping
   */
  _stem(word) {
    if (word.length < 4) return word; // Don't stem short words

    for (const rule of this.stemmingRules) {
      if (word.endsWith(rule.suffix) && word.length > rule.suffix.length + 2) {
        return word.slice(0, -rule.suffix.length) + rule.replacement;
      }
    }
    return word;
  }

  /**
   * Expand query with synonyms
   */
  _expandWithSynonyms(terms) {
    const expanded = new Set(terms);

    for (const term of terms) {
      const synonymList = this.synonyms.get(term);
      if (synonymList) {
        for (const syn of synonymList) {
          expanded.add(syn);
          expanded.add(this._stem(syn)); // Also stem synonyms
        }
      }
    }

    return Array.from(expanded);
  }

  /**
   * Tokenize text into normalized terms
   */
  _tokenize(text, options = {}) {
    if (!text) return [];

    const tokens = text
      .toLowerCase()
      // Remove special characters except hyphens
      .replace(/[^\w\s-]/g, ' ')
      // Split on whitespace
      .split(/\s+/)
      // Remove stopwords (but keep known abbreviations like mf, nf, dm)
      .filter((term) => {
        if (this.synonyms.has(term)) return true; // Keep known abbreviations
        return term.length > 2 && !this.stopWords.has(term);
      })
      // Trim
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    // Apply stemming
    const stemmed = tokens.map((term) => this._stem(term));

    // Expand with synonyms if this is a query (not indexing)
    if (options.expandSynonyms) {
      return this._expandWithSynonyms(stemmed);
    }

    // For indexing, include both original and stemmed
    const indexed = new Set();
    tokens.forEach((t) => indexed.add(t));
    stemmed.forEach((t) => indexed.add(t));

    return Array.from(indexed);
  }

  /**
   * Find documents matching query terms
   */
  _findMatches(queryTerms) {
    const docScores = new Map();

    for (const term of queryTerms) {
      const postings = this.index.get(term) || [];

      for (const posting of postings) {
        const { entryId } = posting;

        if (!docScores.has(entryId)) {
          docScores.set(entryId, {
            entryId,
            termMatches: new Set(),
            positions: [],
          });
        }

        const docScore = docScores.get(entryId);
        docScore.termMatches.add(term);
        docScore.positions.push(posting.position);
      }
    }

    // Convert to array with document info
    const matches = [];

    for (const [entryId, scoreInfo] of docScores.entries()) {
      const docInfo = this.documents.get(entryId);

      if (docInfo) {
        matches.push({
          ...docInfo,
          termMatches: Array.from(scoreInfo.termMatches),
          matchCount: scoreInfo.termMatches.size,
          positions: scoreInfo.positions,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate relevance score for a match
   */
  _calculateRelevance(match, queryTerms, originalQuery) {
    let score = 0;

    // Term frequency score (how many query terms matched)
    const tfScore = match.matchCount / queryTerms.length;
    score += tfScore * 0.4;

    // Inverse document frequency (rare terms are more valuable)
    let idfScore = 0;
    for (const term of match.termMatches) {
      const postings = this.index.get(term) || [];
      const df = postings.length;
      const idf = Math.log((this.documents.size + 1) / (df + 1));
      idfScore += idf;
    }
    idfScore = match.termMatches.length > 0 ? idfScore / match.termMatches.length : 0;
    score += (idfScore / 5) * 0.25; // Normalize and weight

    // Phrase proximity (terms close together in document)
    if (match.positions.length > 1) {
      const positions = match.positions.sort((a, b) => a - b);
      let proximityScore = 0;
      for (let i = 1; i < positions.length; i++) {
        const distance = positions[i] - positions[i - 1];
        if (distance < 10) {
          proximityScore += 1 / distance;
        }
      }
      proximityScore = Math.min(1, proximityScore);
      score += proximityScore * 0.15;
    }

    // EXACT PHRASE BOOST: Check if original query appears as-is in content
    const entryText = this._extractText(match.entry).toLowerCase();
    const queryLower = originalQuery.toLowerCase().trim();
    if (entryText.includes(queryLower)) {
      score += 0.2; // Significant boost for exact phrase match
      this.logger.debug('Exact phrase match boost applied', { query: queryLower });
    }

    // FIELD BOOST: Higher score if match is in title/name/practice fields
    const entry = match.entry;
    const importantFields = [
      entry.name,
      entry.practice,
      entry.feature,
      entry.topic,
      entry.title,
      entry.pattern,
    ].filter(Boolean);
    for (const field of importantFields) {
      if (field && field.toLowerCase().includes(queryLower)) {
        score += 0.15; // Boost for match in important field
        break;
      }
    }

    // Normalize score to [0, 1]
    return Math.min(1, Math.max(0, score));
  }

  // ============================================================================
  // FUZZY SEARCH (Levenshtein Distance)
  // ============================================================================

  /**
   * Calculate Levenshtein distance between two strings
   * Optimized with early termination for performance
   */
  _levenshteinDistance(a, b, maxDistance = 2) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Early termination: if length difference exceeds max, skip
    if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

    // Use two rows instead of full matrix for memory efficiency
    let prevRow = Array(b.length + 1)
      .fill(0)
      .map((_, i) => i);
    let currRow = Array(b.length + 1).fill(0);

    for (let i = 1; i <= a.length; i++) {
      currRow[0] = i;
      let minInRow = i;

      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          prevRow[j] + 1, // deletion
          currRow[j - 1] + 1, // insertion
          prevRow[j - 1] + cost // substitution
        );
        minInRow = Math.min(minInRow, currRow[j]);
      }

      // Early termination: if min in row exceeds max, no point continuing
      if (minInRow > maxDistance) return maxDistance + 1;

      [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[b.length];
  }

  /**
   * Find fuzzy matches for a term using bounded scan
   */
  _findFuzzyMatches(term, maxDistance = 1) {
    const matches = [];
    if (term.length < 4) return matches; // Don't fuzzy match short terms

    // Scan terms of similar length only
    for (const candidate of this.termList) {
      // Skip if length difference too big
      if (Math.abs(candidate.length - term.length) > maxDistance) continue;

      // Quick first-char check for performance (but allow for maxDistance > 1)
      if (maxDistance === 1 && term[0] !== candidate[0] && term.length > 5) continue;

      const distance = this._levenshteinDistance(term, candidate, maxDistance);
      if (distance <= maxDistance && distance > 0) {
        matches.push(candidate);
      }
    }

    return matches;
  }

  /**
   * Expand query terms with fuzzy matches
   */
  _expandWithFuzzyMatches(terms) {
    const expanded = new Set(terms);

    for (const term of terms) {
      // Only fuzzy match if term not found exactly
      if (!this.index.has(term)) {
        // Allow more edits for longer words
        const maxDist = term.length >= 7 ? 2 : 1;
        const fuzzyMatches = this._findFuzzyMatches(term, maxDist);
        for (const match of fuzzyMatches) {
          expanded.add(match);
        }
      }
    }

    return Array.from(expanded);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Record search analytics
   */
  _recordAnalytics(query, resultCount, responseTimeMs) {
    this.analytics.totalSearches++;

    if (resultCount > 0) {
      this.analytics.totalHits++;
    } else {
      this.analytics.totalMisses++;
      // Track missed queries for knowledge gap analysis
      if (!this.analytics.missedQueries.includes(query)) {
        this.analytics.missedQueries.push(query);
        if (this.analytics.missedQueries.length > 50) {
          this.analytics.missedQueries.shift();
        }
      }
    }

    // Track popular search terms
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    for (const term of terms) {
      this.analytics.popularTerms.set(term, (this.analytics.popularTerms.get(term) || 0) + 1);
    }

    // Track response times (rolling average)
    this.analytics.searchTimes.push(responseTimeMs);
    if (this.analytics.searchTimes.length > 100) {
      this.analytics.searchTimes.shift();
    }
    this.analytics.avgResponseTime =
      this.analytics.searchTimes.reduce((a, b) => a + b, 0) / this.analytics.searchTimes.length;

    // Track query history
    this.analytics.queryHistory.push({
      query,
      results: resultCount,
      time: responseTimeMs,
      timestamp: new Date().toISOString(),
    });
    if (this.analytics.queryHistory.length > this.maxHistorySize) {
      this.analytics.queryHistory.shift();
    }
  }

  /**
   * Get top searched terms
   */
  _getTopTerms(count = 10) {
    return Array.from(this.analytics.popularTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([term, searchCount]) => ({ term, searchCount }));
  }

  /**
   * Get knowledge gaps (frequently missed queries)
   */
  getKnowledgeGaps() {
    return {
      missedQueries: this.analytics.missedQueries,
      missRate:
        this.analytics.totalSearches > 0
          ? Math.round((this.analytics.totalMisses / this.analytics.totalSearches) * 100)
          : 0,
      suggestion:
        this.analytics.missedQueries.length > 5
          ? 'Consider adding knowledge for: ' + this.analytics.missedQueries.slice(-5).join(', ')
          : null,
    };
  }

  /**
   * Reset analytics
   */
  resetAnalytics() {
    this.analytics = {
      totalSearches: 0,
      totalHits: 0,
      totalMisses: 0,
      queryHistory: [],
      popularTerms: new Map(),
      missedQueries: [],
      avgResponseTime: 0,
      searchTimes: [],
    };
    this.logger.info('Search analytics reset');
  }
}

export default SearchEngine;
