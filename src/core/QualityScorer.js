/**
 * QualityScorer - Knowledge quality assessment
 * Scores knowledge entries based on source reliability, recency, usage, and verification
 */

import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';

class QualityScorer {
  constructor() {
    this.logger = new Logger('QualityScorer');
    this.config = getConfig();

    this.sourceWeights = this.config.get('knowledge.sourceWeights', {});
    this.scoreWeights = this.config.get('quality.scoreWeights', {
      sourceReliability: 0.4,
      recency: 0.2,
      usage: 0.2,
      verification: 0.2,
    });

    this.logger.info('QualityScorer initialized');
  }

  /**
   * Calculate overall quality score for a knowledge entry
   * @param {Object} entry - Knowledge entry with metadata
   * @returns {number} Quality score between 0 and 1
   */
  calculateScore(entry) {
    if (!entry._metadata) {
      this.logger.warn('Entry missing metadata, using default score');
      return 0.5;
    }

    const scores = {
      sourceReliability: this._scoreSource(entry._metadata.source),
      recency: this._scoreRecency(entry._metadata.added_at, entry._metadata.updated_at),
      usage: this._scoreUsage(entry._metadata.usage_count, entry._metadata.access_count),
      verification: this._scoreVerification(entry._metadata.verified, entry._metadata.feedback),
    };

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(this.scoreWeights)) {
      if (scores[key] !== undefined) {
        totalScore += scores[key] * weight;
        totalWeight += weight;
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;

    this.logger.debug('Quality score calculated', {
      entry: entry._metadata?.id || 'unknown',
      scores,
      finalScore: Math.round(finalScore * 100) / 100,
    });

    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Score based on source reliability
   */
  _scoreSource(source) {
    if (!source) return 0.5;

    // Extract domain from URL
    let domain = source;
    try {
      if (source.startsWith('http')) {
        const url = new URL(source);
        domain = url.hostname.replace('www.', '');
      }
    } catch (e) {
      // Not a URL, use as-is
    }

    // Check against configured source weights
    for (const [pattern, weight] of Object.entries(this.sourceWeights)) {
      if (domain.includes(pattern) || source.includes(pattern)) {
        return weight;
      }
    }

    // Default for unknown sources
    return 0.5;
  }

  /**
   * Score based on how recent the entry is
   */
  _scoreRecency(addedAt, updatedAt = null) {
    const refDate = updatedAt || addedAt;

    if (!refDate) return 0.5;

    try {
      const date = new Date(refDate);
      const now = new Date();
      const ageInDays = (now - date) / (1000 * 60 * 60 * 24);

      // Score decreases with age
      // 0 days = 1.0, 365 days = 0.5, 730 days = 0.25
      if (ageInDays < 0) return 1.0; // Future date (error, but be generous)
      if (ageInDays <= 30) return 1.0; // Last month
      if (ageInDays <= 90) return 0.9; // Last 3 months
      if (ageInDays <= 180) return 0.8; // Last 6 months
      if (ageInDays <= 365) return 0.7; // Last year
      if (ageInDays <= 730) return 0.5; // Last 2 years

      return 0.3; // Older than 2 years
    } catch (e) {
      this.logger.warn('Invalid date for recency scoring', { date: refDate });
      return 0.5;
    }
  }

  /**
   * Score based on usage statistics
   */
  _scoreUsage(usageCount = 0, accessCount = 0) {
    const totalUsage = (usageCount || 0) + (accessCount || 0);

    if (totalUsage === 0) return 0.5; // Neutral for unused entries

    // Logarithmic scaling: more usage = higher score
    // 1 use = 0.6, 10 uses = 0.75, 100 uses = 0.9, 1000+ uses = 1.0
    const score = Math.min(1.0, 0.5 + Math.log10(totalUsage + 1) * 0.2);

    return Math.round(score * 100) / 100;
  }

  /**
   * Score based on verification status and feedback
   */
  _scoreVerification(verified = false, feedback = null) {
    let score = 0.5; // Base score for unverified

    // Verified by expert/admin
    if (verified === true || verified === 'expert') {
      score = 1.0;
    } else if (verified === 'community') {
      score = 0.8;
    }

    // Adjust based on user feedback
    if (feedback && typeof feedback === 'object') {
      const positiveRatio =
        feedback.positive && feedback.total ? feedback.positive / feedback.total : 0.5;

      // Blend verification and feedback
      score = score * 0.7 + positiveRatio * 0.3;
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * Get quality tier from score
   */
  getQualityTier(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.75) return 'good';
    if (score >= 0.6) return 'acceptable';
    if (score >= 0.4) return 'questionable';
    return 'poor';
  }

  /**
   * Compare two entries and return the higher quality one
   */
  selectBetter(entry1, entry2) {
    const score1 = this.calculateScore(entry1);
    const score2 = this.calculateScore(entry2);

    return score1 >= score2 ? entry1 : entry2;
  }

  /**
   * Sort entries by quality score (descending)
   */
  sortByQuality(entries) {
    return entries
      .map((entry) => ({
        entry,
        score: this.calculateScore(entry),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.entry);
  }

  /**
   * Filter entries by minimum quality threshold
   */
  filterByQuality(entries, minScore = 0.6) {
    return entries.filter((entry) => {
      const score = this.calculateScore(entry);
      return score >= minScore;
    });
  }

  /**
   * Generate quality report for an entry
   */
  generateReport(entry) {
    const score = this.calculateScore(entry);
    const tier = this.getQualityTier(score);

    return {
      overallScore: score,
      tier,
      breakdown: {
        sourceReliability: this._scoreSource(entry._metadata?.source),
        recency: this._scoreRecency(entry._metadata?.added_at, entry._metadata?.updated_at),
        usage: this._scoreUsage(entry._metadata?.usage_count, entry._metadata?.access_count),
        verification: this._scoreVerification(entry._metadata?.verified, entry._metadata?.feedback),
      },
      recommendations: this._getRecommendations(entry, score),
    };
  }

  /**
   * Get recommendations for improving quality
   */
  _getRecommendations(entry, score) {
    const recommendations = [];

    if (score < 0.7) {
      if (!entry._metadata?.verified) {
        recommendations.push('Verify with official Mendix documentation');
      }

      if (this._scoreSource(entry._metadata?.source) < 0.7) {
        recommendations.push('Add reference to official Mendix docs');
      }

      const recencyScore = this._scoreRecency(
        entry._metadata?.added_at,
        entry._metadata?.updated_at
      );
      if (recencyScore < 0.7) {
        recommendations.push('Review and update for latest Mendix version');
      }
    }

    return recommendations;
  }
}

export default QualityScorer;
