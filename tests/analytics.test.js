/**
 * Test Suite: Analytics
 * Tests usage tracking and reporting
 */

import { promises as fs } from 'fs';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Analytics from '../src/utils/Analytics.js';

describe('Analytics', () => {
  let analytics;
  const testDataFile = path.join(__dirname, 'test-analytics.json');

  before(async () => {
    analytics = new Analytics({ dataFile: testDataFile, flushInterval: 100000 });
    await analytics.initialize();
  });

  after(async () => {
    // Cleanup test file
    try {
      await fs.unlink(testDataFile);
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  describe('initialize()', () => {
    it('should initialize with fresh data structure', () => {
      assert.ok(analytics.initialized, 'Should be initialized');
      assert.ok(analytics.data, 'Should have data object');
      assert.ok(analytics.data.toolUsage, 'Should have toolUsage');
      assert.ok(analytics.data.queryTopics, 'Should have queryTopics');
    });
  });

  describe('trackToolUsage()', () => {
    it('should track tool usage', () => {
      const before = analytics.data.toolUsage.query_mendix_knowledge || 0;
      analytics.trackToolUsage('query_mendix_knowledge');
      const after = analytics.data.toolUsage.query_mendix_knowledge;

      assert.strictEqual(after, before + 1, 'Should increment tool usage');
    });

    it('should track daily usage', () => {
      analytics.trackToolUsage('hybrid_search');
      const today = new Date().toISOString().split('T')[0];

      assert.ok(analytics.data.dailyUsage[today], 'Should have today in daily usage');
      assert.ok(analytics.data.dailyUsage[today].total > 0, 'Should have positive total');
    });
  });

  describe('trackQuery()', () => {
    it('should track query topics', () => {
      analytics.trackQuery('microflow performance', 'detailed');

      assert.ok(
        analytics.data.queryTopics['microflow performance'] > 0,
        'Should track query topic'
      );
    });

    it('should extract and track search terms', () => {
      analytics.trackQuery('domain model security', 'basic');

      assert.ok(analytics.data.searchTerms['domain'] > 0, 'Should track domain term');
      assert.ok(analytics.data.searchTerms['model'] > 0, 'Should track model term');
      assert.ok(analytics.data.searchTerms['security'] > 0, 'Should track security term');
    });
  });

  describe('trackBestPractice()', () => {
    it('should track best practice scenarios', () => {
      analytics.trackBestPractice('error handling');

      assert.ok(
        analytics.data.bestPracticeScenarios['error handling'] > 0,
        'Should track best practice scenario'
      );
    });
  });

  describe('trackError()', () => {
    it('should track errors', () => {
      const beforeCount = analytics.data.errors.count;
      analytics.trackError('test_tool', 'Test error message');

      assert.strictEqual(
        analytics.data.errors.count,
        beforeCount + 1,
        'Should increment error count'
      );
      assert.ok(analytics.data.errors.byTool.test_tool > 0, 'Should track by tool');
      assert.ok(analytics.data.errors.recent.length > 0, 'Should have recent errors');
    });
  });

  describe('getSummary()', () => {
    it('should return valid summary', () => {
      const summary = analytics.getSummary();

      assert.ok(summary.overview, 'Should have overview');
      assert.ok(typeof summary.overview.totalToolCalls === 'number', 'Should have totalToolCalls');
      assert.ok(summary.topTools, 'Should have topTools');
      assert.ok(summary.lastUpdated, 'Should have lastUpdated');
    });
  });

  describe('getDetailedReport()', () => {
    it('should return detailed report', () => {
      const report = analytics.getDetailedReport();

      assert.ok(report.overview, 'Should have overview');
      assert.ok(report.allToolUsage, 'Should have allToolUsage');
      assert.ok(report.allTopics, 'Should have allTopics');
      assert.ok(report.dailyUsage, 'Should have dailyUsage');
    });
  });

  describe('flush()', () => {
    it('should write data to file', async () => {
      analytics.dirty = true;
      await analytics.flush();

      const exists = await fs
        .access(testDataFile)
        .then(() => true)
        .catch(() => false);
      assert.ok(exists, 'Should create analytics file');
    });
  });
});
