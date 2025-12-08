/**
 * MaintenanceScheduler - Automated maintenance for mendix-expert MCP server
 * Handles periodic tasks to keep the server running smoothly
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '../..');

class MaintenanceScheduler {
  constructor(options = {}) {
    this.logger = new Logger('Maintenance');

    // Components to maintain (injected)
    this.knowledgeManager = options.knowledgeManager;
    this.searchEngine = options.searchEngine;
    this.webFetcher = options.webFetcher;
    this.cacheManager = options.cacheManager;

    // Maintenance state
    this.stateFile = path.join(SERVER_ROOT, 'data', 'maintenance-state.json');
    this.state = {
      lastMaintenance: null,
      lastValidation: null,
      lastAnalyticsReset: null,
      lastCacheClean: null,
      lastStalenessCheck: null,
      maintenanceCount: 0,
    };

    // Schedule intervals (in milliseconds)
    this.intervals = {
      validation: options.validationInterval ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      analyticsReset: options.analyticsInterval ?? 14 * 24 * 60 * 60 * 1000, // 14 days
      cacheClean: options.cacheInterval ?? 24 * 60 * 60 * 1000, // 1 day
      stalenessCheck: options.stalenessInterval ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      fullMaintenance: options.maintenanceInterval ?? 14 * 24 * 60 * 60 * 1000, // 14 days
    };

    // Auto-run timer
    this.autoRunTimer = null;
    this.autoRunEnabled = options.autoRun ?? true;

    this.logger.info('MaintenanceScheduler initialized');
  }

  /**
   * Load maintenance state from disk
   */
  async loadState() {
    try {
      if (await fs.pathExists(this.stateFile)) {
        this.state = await fs.readJson(this.stateFile);
        this.logger.debug('Loaded maintenance state', this.state);
      }
    } catch (error) {
      this.logger.warn('Could not load maintenance state', { error: error.message });
    }
    return this.state;
  }

  /**
   * Save maintenance state to disk
   */
  async saveState() {
    try {
      await fs.ensureDir(path.dirname(this.stateFile));
      await fs.writeJson(this.stateFile, this.state, { spaces: 2 });
    } catch (error) {
      this.logger.error('Failed to save maintenance state', { error: error.message });
    }
  }

  /**
   * Check what maintenance tasks are due
   */
  getScheduledTasks() {
    const now = Date.now();
    const tasks = [];

    const checkDue = (lastRun, interval, taskName) => {
      if (!lastRun || now - new Date(lastRun).getTime() > interval) {
        tasks.push({
          task: taskName,
          lastRun: lastRun || 'never',
          overdueDays: lastRun
            ? Math.round((now - new Date(lastRun).getTime() - interval) / (24 * 60 * 60 * 1000))
            : null,
        });
      }
    };

    checkDue(this.state.lastValidation, this.intervals.validation, 'validation');
    checkDue(this.state.lastAnalyticsReset, this.intervals.analyticsReset, 'analyticsReset');
    checkDue(this.state.lastCacheClean, this.intervals.cacheClean, 'cacheClean');
    checkDue(this.state.lastStalenessCheck, this.intervals.stalenessCheck, 'stalenessCheck');

    return tasks;
  }

  /**
   * Run all due maintenance tasks
   */
  async runDueMaintenance() {
    const dueTasks = this.getScheduledTasks();

    if (dueTasks.length === 0) {
      this.logger.info('No maintenance tasks due');
      return { tasksRun: 0, results: [] };
    }

    this.logger.info('Running due maintenance tasks', { count: dueTasks.length });
    const results = [];

    for (const { task } of dueTasks) {
      try {
        const result = await this.runTask(task);
        results.push({ task, success: true, result });
      } catch (error) {
        results.push({ task, success: false, error: error.message });
        this.logger.error(`Maintenance task failed: ${task}`, { error: error.message });
      }
    }

    this.state.lastMaintenance = new Date().toISOString();
    this.state.maintenanceCount++;
    await this.saveState();

    return { tasksRun: results.length, results };
  }

  /**
   * Run a specific maintenance task
   */
  async runTask(taskName) {
    const now = new Date().toISOString();

    switch (taskName) {
      case 'validation':
        return await this._runValidation(now);

      case 'analyticsReset':
        return await this._runAnalyticsReset(now);

      case 'cacheClean':
        return await this._runCacheClean(now);

      case 'stalenessCheck':
        return await this._runStalenessCheck(now);

      case 'fullMaintenance':
        return await this._runFullMaintenance(now);

      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }

  /**
   * Validation task
   */
  async _runValidation(timestamp) {
    if (!this.knowledgeManager) {
      return { skipped: true, reason: 'KnowledgeManager not available' };
    }

    const report = this.knowledgeManager.validateKnowledgeBase();
    this.state.lastValidation = timestamp;

    this.logger.info('Validation complete', {
      entries: report.entriesChecked,
      errors: report.errors.length,
      warnings: report.warnings.length,
    });

    return {
      entriesChecked: report.entriesChecked,
      errors: report.errors.length,
      warnings: report.warnings.length,
      valid: report.valid,
    };
  }

  /**
   * Analytics reset task
   */
  async _runAnalyticsReset(timestamp) {
    if (!this.searchEngine) {
      return { skipped: true, reason: 'SearchEngine not available' };
    }

    // Get stats before reset
    const beforeStats = this.searchEngine.getStats();

    // Reset analytics
    this.searchEngine.resetAnalytics();
    this.state.lastAnalyticsReset = timestamp;

    this.logger.info('Analytics reset', {
      previousSearches: beforeStats.analytics?.totalSearches || 0,
    });

    return {
      previousSearches: beforeStats.analytics?.totalSearches || 0,
      previousHitRate: beforeStats.analytics?.hitRate || 0,
      reset: true,
    };
  }

  /**
   * Cache cleanup task
   */
  async _runCacheClean(timestamp) {
    let cleaned = 0;

    // Clean web fetcher cache
    if (this.webFetcher) {
      this.webFetcher.clearCache();
      this.webFetcher.resetFetchCount();
      cleaned++;
    }

    // Clean general cache
    if (this.cacheManager) {
      const cacheStats = this.cacheManager.getStats();
      this.cacheManager.clear();
      cleaned++;
    }

    this.state.lastCacheClean = timestamp;
    this.logger.info('Cache cleaned', { componentsCleared: cleaned });

    return { componentsCleared: cleaned };
  }

  /**
   * Staleness check task
   */
  async _runStalenessCheck(timestamp) {
    if (!this.knowledgeManager) {
      return { skipped: true, reason: 'KnowledgeManager not available' };
    }

    const staleReport = this.knowledgeManager.getStaleEntries(90);
    this.state.lastStalenessCheck = timestamp;

    this.logger.info('Staleness check complete', {
      staleEntries: staleReport.count,
    });

    // If there are many stale entries, log a warning
    if (staleReport.count > 10) {
      this.logger.warn('Many stale entries detected', {
        count: staleReport.count,
        suggestion: 'Consider reviewing and updating knowledge base',
      });
    }

    return {
      staleCount: staleReport.count,
      summary: staleReport.summary,
    };
  }

  /**
   * Full maintenance (runs all tasks)
   */
  async _runFullMaintenance(timestamp) {
    this.logger.info('Starting full maintenance');

    const results = {
      validation: await this._runValidation(timestamp),
      stalenessCheck: await this._runStalenessCheck(timestamp),
      cacheClean: await this._runCacheClean(timestamp),
      // Don't reset analytics during full maintenance - let it accumulate
    };

    this.state.lastMaintenance = timestamp;
    this.state.maintenanceCount++;
    await this.saveState();

    this.logger.info('Full maintenance complete');
    return results;
  }

  /**
   * Start automatic maintenance checks
   */
  startAutoMaintenance(checkIntervalMs = 60 * 60 * 1000) {
    // Check every hour
    if (this.autoRunTimer) {
      clearInterval(this.autoRunTimer);
    }

    this.autoRunTimer = setInterval(async () => {
      try {
        await this.runDueMaintenance();
      } catch (error) {
        this.logger.error('Auto-maintenance failed', { error: error.message });
      }
    }, checkIntervalMs);

    this.logger.info('Auto-maintenance started', {
      checkIntervalHours: checkIntervalMs / (60 * 60 * 1000),
    });
  }

  /**
   * Stop automatic maintenance
   */
  stopAutoMaintenance() {
    if (this.autoRunTimer) {
      clearInterval(this.autoRunTimer);
      this.autoRunTimer = null;
      this.logger.info('Auto-maintenance stopped');
    }
  }

  /**
   * Get maintenance status
   */
  getStatus() {
    const dueTasks = this.getScheduledTasks();

    return {
      lastMaintenance: this.state.lastMaintenance,
      maintenanceCount: this.state.maintenanceCount,
      autoRunEnabled: this.autoRunTimer !== null,
      tasksDue: dueTasks.length,
      dueTasks: dueTasks,
      schedule: {
        validation: `Every ${this.intervals.validation / (24 * 60 * 60 * 1000)} days`,
        analyticsReset: `Every ${this.intervals.analyticsReset / (24 * 60 * 60 * 1000)} days`,
        cacheClean: `Every ${this.intervals.cacheClean / (24 * 60 * 60 * 1000)} days`,
        stalenessCheck: `Every ${this.intervals.stalenessCheck / (24 * 60 * 60 * 1000)} days`,
      },
      lastRuns: {
        validation: this.state.lastValidation || 'never',
        analyticsReset: this.state.lastAnalyticsReset || 'never',
        cacheClean: this.state.lastCacheClean || 'never',
        stalenessCheck: this.state.lastStalenessCheck || 'never',
      },
    };
  }
}

export default MaintenanceScheduler;
