/**
 * Test Suite: Quality Scorer
 * Tests knowledge quality assessment
 */

import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import QualityScorer from '../src/core/QualityScorer.js';

describe('QualityScorer', () => {
  let qs;

  before(() => {
    qs = new QualityScorer();
  });

  describe('score()', () => {
    it('should score high-quality entry higher', () => {
      const highQuality = {
        topic: 'Microflow Best Practices',
        description:
          'Comprehensive guide to creating efficient and maintainable microflows in Mendix applications.',
        examples: ['Example 1', 'Example 2', 'Example 3'],
        code: 'const model = await client.getModel();',
        source: 'https://docs.mendix.com',
        verified: true,
      };

      const lowQuality = {
        topic: 'test',
      };

      const highScore = qs.score(highQuality);
      const lowScore = qs.score(lowQuality);

      assert.ok(highScore > lowScore, 'High quality entry should score higher');
    });

    it('should return score between 0 and 1', () => {
      const entry = {
        topic: 'Domain Model',
        description: 'How to create a domain model',
      };

      const score = qs.score(entry);
      assert.ok(score >= 0, 'Score should be >= 0');
      assert.ok(score <= 1, 'Score should be <= 1');
    });

    it('should give bonus for verified entries', () => {
      const unverified = {
        topic: 'Test Topic',
        description: 'Test description',
        verified: false,
      };

      const verified = {
        topic: 'Test Topic',
        description: 'Test description',
        verified: true,
      };

      const unverifiedScore = qs.score(unverified);
      const verifiedScore = qs.score(verified);

      assert.ok(verifiedScore >= unverifiedScore, 'Verified entries should score equal or higher');
    });

    it('should give bonus for entries with examples', () => {
      const noExamples = {
        topic: 'Test Topic',
        description: 'Test description',
      };

      const withExamples = {
        topic: 'Test Topic',
        description: 'Test description',
        examples: ['Example 1', 'Example 2'],
      };

      const noExamplesScore = qs.score(noExamples);
      const withExamplesScore = qs.score(withExamples);

      assert.ok(withExamplesScore > noExamplesScore, 'Entries with examples should score higher');
    });

    it('should give bonus for entries with code', () => {
      const noCode = {
        topic: 'Test Topic',
        description: 'Test description',
      };

      const withCode = {
        topic: 'Test Topic',
        description: 'Test description',
        code: 'console.log("example code");',
      };

      const noCodeScore = qs.score(noCode);
      const withCodeScore = qs.score(withCode);

      assert.ok(withCodeScore > noCodeScore, 'Entries with code should score higher');
    });
  });

  describe('validate()', () => {
    it('should validate required fields', () => {
      const valid = { topic: 'Test', description: 'Description' };
      const invalid = {};

      const validResult = qs.validate(valid, ['topic']);
      const invalidResult = qs.validate(invalid, ['topic']);

      assert.ok(validResult.valid, 'Should be valid with required field');
      assert.ok(!invalidResult.valid, 'Should be invalid without required field');
    });
  });
});
