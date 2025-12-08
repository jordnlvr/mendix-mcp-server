/**
 * HarvestScheduler - Automated knowledge harvesting on a schedule
 *
 * Runs weekly harvests of Mendix documentation to keep knowledge fresh.
 * Integrates with MaintenanceScheduler for coordinated maintenance.
 *
 * @version 1.0.0
 * @author Kai SDK
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import KnowledgeHarvester from './KnowledgeHarvester.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HarvestScheduler {
  constructor(knowledgeBasePath, options = {}) {
    this.knowledgeBasePath = knowledgeBasePath || path.join(__dirname, '../../knowledge');
    this.stateFile = path.join(this.knowledgeBasePath, 'harvest-state.json');
    this.harvester = new KnowledgeHarvester(this.knowledgeBasePath);

    // Optional: reference to hybrid search for vector re-indexing after harvest
    this.hybridSearch = options.hybridSearch || null;
    this.knowledgeManager = options.knowledgeManager || null;

    // Harvest every 7 days by default
    this.harvestIntervalDays = 7;

    // Track state
    this.state = {
      lastHarvest: null,
      lastHarvestResults: null,
      totalHarvests: 0,
      nextScheduledHarvest: null,
      isRunning: false,
    };

    this.intervalId = null;
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    await this.loadState();

    // Check if we need to harvest on startup
    if (this.shouldHarvest()) {
      console.log('📅 Scheduled harvest is due - running now...');
      await this.runHarvest();
    }

    // Set up interval check (every hour)
    this.intervalId = setInterval(() => this.checkAndHarvest(), 60 * 60 * 1000);

    console.log(`🌾 HarvestScheduler initialized. Next harvest: ${this.getNextHarvestDate()}`);
  }

  /**
   * Load state from disk
   */
  async loadState() {
    try {
      const content = await fs.readFile(this.stateFile, 'utf-8');
      this.state = { ...this.state, ...JSON.parse(content) };
    } catch {
      // No state file yet
    }
  }

  /**
   * Save state to disk
   */
  async saveState() {
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  /**
   * Check if harvest is needed based on schedule
   */
  shouldHarvest() {
    if (!this.state.lastHarvest) return true;

    const lastHarvest = new Date(this.state.lastHarvest);
    const now = new Date();
    const daysSinceHarvest = (now - lastHarvest) / (1000 * 60 * 60 * 24);

    return daysSinceHarvest >= this.harvestIntervalDays;
  }

  /**
   * Get the next scheduled harvest date
   */
  getNextHarvestDate() {
    if (!this.state.lastHarvest) return 'Pending (first harvest)';

    const lastHarvest = new Date(this.state.lastHarvest);
    const nextHarvest = new Date(
      lastHarvest.getTime() + this.harvestIntervalDays * 24 * 60 * 60 * 1000
    );

    return nextHarvest.toISOString().split('T')[0];
  }

  /**
   * Check and run harvest if needed
   */
  async checkAndHarvest() {
    if (this.shouldHarvest() && !this.state.isRunning) {
      await this.runHarvest();
    }
  }

  /**
   * Run a harvest
   */
  async runHarvest(options = {}) {
    if (this.state.isRunning) {
      return { success: false, message: 'Harvest already in progress' };
    }

    this.state.isRunning = true;
    await this.saveState();

    console.log('\n' + '🌾'.repeat(25));
    console.log('   STARTING KNOWLEDGE HARVEST');
    console.log('🌾'.repeat(25) + '\n');

    try {
      const results = await this.harvester.harvest({
        dryRun: options.dryRun || false,
        verbose: options.verbose !== false,
        sources: options.sources, // undefined = all sources
      });

      this.state.lastHarvest = new Date().toISOString();
      this.state.lastHarvestResults = {
        success: results.success.length,
        failed: results.failed.length,
        newEntries: results.newEntries.length,
        updatedEntries: results.updatedEntries.length,
      };
      this.state.totalHarvests++;
      this.state.nextScheduledHarvest = this.getNextHarvestDate();

      // Re-index vectors for semantic search if available
      if (this.hybridSearch && this.knowledgeManager && results.newEntries.length > 0) {
        console.log('\n🧠 Updating semantic search vectors...');
        try {
          await this.knowledgeManager.reload();
          await this.hybridSearch.indexKnowledgeBase(this.knowledgeManager.knowledgeBase);
          console.log('✅ Vector embeddings updated with new knowledge');
        } catch (vectorError) {
          console.warn('⚠️ Vector re-indexing failed:', vectorError.message);
        }
      }

      console.log('\n✅ Harvest completed successfully!\n');

      return { success: true, results };
    } catch (error) {
      console.error('❌ Harvest failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.state.isRunning = false;
      await this.saveState();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.state.isRunning,
      lastHarvest: this.state.lastHarvest,
      lastResults: this.state.lastHarvestResults,
      totalHarvests: this.state.totalHarvests,
      nextScheduledHarvest: this.getNextHarvestDate(),
      harvestIntervalDays: this.harvestIntervalDays,
      availableSources: this.harvester.getSources(),
    };
  }

  /**
   * Force a harvest now (manual trigger)
   */
  async harvestNow(options = {}) {
    return await this.runHarvest(options);
  }

  /**
   * Update harvest interval
   */
  setHarvestInterval(days) {
    this.harvestIntervalDays = Math.max(1, Math.min(30, days));
    console.log(`📅 Harvest interval updated to ${this.harvestIntervalDays} days`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 HarvestScheduler stopped');
  }
}

export default HarvestScheduler;
