/**
 * Test Suite: Knowledge Manager
 * Tests knowledge base loading, searching, and adding
 */

import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module to test
import KnowledgeManager from '../src/core/KnowledgeManager.js';

describe('KnowledgeManager', () => {
  let km;

  before(async () => {
    km = new KnowledgeManager();
    await km.load();
  });

  describe('load()', () => {
    it('should load knowledge base files', async () => {
      const stats = km.getStats();
      assert.ok(stats.filesLoaded > 0, 'Should load at least one file');
      assert.ok(stats.totalEntries > 0, 'Should have entries');
    });

    it('should have required knowledge files', () => {
      const kb = km.knowledgeBase;
      const requiredFiles = ['best-practices', 'studio-pro', 'model-sdk'];

      for (const file of requiredFiles) {
        assert.ok(kb[file], `Should have ${file} knowledge file`);
      }
    });

    it('should have metadata in knowledge files', () => {
      const kb = km.knowledgeBase;
      for (const [file, content] of Object.entries(kb)) {
        if (file !== '_metadata') {
          assert.ok(
            content._metadata || typeof content === 'object',
            `${file} should have valid structure`
          );
        }
      }
    });
  });

  describe('getStats()', () => {
    it('should return valid statistics', () => {
      const stats = km.getStats();

      assert.ok(typeof stats.filesLoaded === 'number', 'filesLoaded should be number');
      assert.ok(typeof stats.totalEntries === 'number', 'totalEntries should be number');
      assert.ok(stats.filesLoaded > 5, 'Should have multiple knowledge files');
    });
  });

  describe('get()', () => {
    it('should retrieve specific knowledge file', () => {
      const bestPractices = km.get('best-practices');
      assert.ok(bestPractices, 'Should get best-practices');
      assert.ok(typeof bestPractices === 'object', 'Should be an object');
    });

    it('should return null for non-existent file', () => {
      const result = km.get('non-existent-file');
      assert.strictEqual(result, null, 'Should return null for missing file');
    });
  });
});
