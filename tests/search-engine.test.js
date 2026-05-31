/**
 * Test Suite: Search Engine
 * Tests keyword search, indexing, and relevance scoring
 */

import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import KnowledgeManager from '../src/core/KnowledgeManager.js';
import SearchEngine from '../src/core/SearchEngine.js';

describe('SearchEngine', () => {
  let km;
  let se;

  before(async () => {
    km = new KnowledgeManager();
    await km.load();
    se = new SearchEngine();
    se.indexKnowledgeBase(km.knowledgeBase);
  });

  describe('indexKnowledgeBase()', () => {
    it('should index knowledge base successfully', () => {
      const stats = se.getStats();
      assert.ok(stats.totalDocuments > 0, 'Should have indexed documents');
      assert.ok(stats.totalTerms > 0, 'Should have indexed terms');
    });

    it('should have reasonable document count', () => {
      const stats = se.getStats();
      assert.ok(stats.totalDocuments >= 50, 'Should have at least 50 documents');
    });
  });

  describe('search()', () => {
    it('should return results for valid query', () => {
      const results = se.search('microflow');
      assert.ok(results.length > 0, 'Should find microflow results');
    });

    it('should return empty array for gibberish', () => {
      const results = se.search('xyzabc123nonsense');
      assert.strictEqual(results.length, 0, 'Should return no results for gibberish');
    });

    it('should respect maxResults option', () => {
      const results = se.search('mendix', { maxResults: 3 });
      assert.ok(results.length <= 3, 'Should respect maxResults limit');
    });

    it('should score results between 0 and 1', () => {
      const results = se.search('domain model');
      for (const result of results) {
        assert.ok(result.score >= 0, 'Score should be >= 0');
        assert.ok(result.score <= 1, 'Score should be <= 1');
      }
    });

    it('should return results sorted by relevance', () => {
      const results = se.search('entity attribute');
      for (let i = 1; i < results.length; i++) {
        assert.ok(
          results[i - 1].score >= results[i].score,
          'Results should be sorted by score descending'
        );
      }
    });

    it('should find workflow-related content', () => {
      const results = se.search('workflow');
      assert.ok(results.length > 0, 'Should find workflow results');
    });

    it('should find mobile-related content', () => {
      const results = se.search('native mobile');
      assert.ok(results.length > 0, 'Should find mobile results');
    });

    it('should find SDK-related content', () => {
      const results = se.search('model sdk platform sdk');
      assert.ok(results.length > 0, 'Should find SDK results');
    });
  });

  describe('getStats()', () => {
    it('should return valid statistics', () => {
      const stats = se.getStats();

      assert.ok(typeof stats.totalDocuments === 'number', 'Should have totalDocuments');
      assert.ok(typeof stats.totalTerms === 'number', 'Should have totalTerms');
      assert.ok(stats.totalDocuments > 0, 'Should have documents');
      assert.ok(stats.totalTerms > 0, 'Should have terms');
    });
  });

  describe('clear()', () => {
    it('should clear the index', () => {
      const se2 = new SearchEngine();
      se2.indexKnowledgeBase(km.knowledgeBase);

      const beforeClear = se2.getStats().totalDocuments;
      se2.clear();
      const afterClear = se2.getStats().totalDocuments;

      assert.ok(beforeClear > 0, 'Should have docs before clear');
      assert.strictEqual(afterClear, 0, 'Should have 0 docs after clear');
    });
  });
});
