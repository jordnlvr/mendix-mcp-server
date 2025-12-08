/**
 * Usage Analytics for Mendix Expert MCP Server
 * Lightweight telemetry tracking tool usage, query patterns, and popular topics
 *
 * Data is stored locally in analytics.json - no external services required
 * Provides insights for improving knowledge base and understanding user needs
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Analytics {
  constructor(options = {}) {
    this.dataFile = options.dataFile || path.join(__dirname, '../../data/analytics.json');
    this.data = null;
    this.initialized = false;
    this.flushInterval = options.flushInterval || 60000; // Flush every minute
    this.dirty = false;

    // Start periodic flush
    this._startPeriodicFlush();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFile);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing data or create new
      try {
        const content = await fs.readFile(this.dataFile, 'utf8');
        this.data = JSON.parse(content);
      } catch (err) {
        // File doesn't exist, create fresh data structure
        this.data = this._createFreshData();
      }

      this.initialized = true;
    } catch (err) {
      console.error('Analytics initialization failed:', err.message);
      this.data = this._createFreshData();
      this.initialized = true;
    }
  }

  _createFreshData() {
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),

      // Tool usage counts
      toolUsage: {
        query_mendix_knowledge: 0,
        hybrid_search: 0,
        get_best_practice: 0,
        analyze_project: 0,
        add_to_knowledge_base: 0,
        get_status: 0,
        list_knowledge_files: 0,
        search_knowledge: 0,
        get_sdk_patterns: 0,
        fetch_web_docs: 0,
        harvest_knowledge: 0,
        get_vector_stats: 0,
        sync_vectors: 0,
      },

      // Query topics (what people ask about)
      queryTopics: {},

      // Search terms frequency
      searchTerms: {},

      // Best practice scenarios requested
      bestPracticeScenarios: {},

      // Project analysis stats
      projectAnalysis: {
        count: 0,
        moduleTypes: {},
        avgEntities: 0,
        avgMicroflows: 0,
      },

      // Knowledge additions
      knowledgeAdditions: {
        count: 0,
        byFile: {},
        byCategory: {},
      },

      // Session stats
      sessions: {
        total: 0,
        current: null,
        avgDurationMinutes: 0,
      },

      // Error tracking
      errors: {
        count: 0,
        byTool: {},
        recent: [],
      },

      // Daily usage (last 30 days rolling)
      dailyUsage: {},

      // Response quality feedback (if users provide it)
      feedback: {
        helpful: 0,
        notHelpful: 0,
        suggestions: [],
      },
    };
  }

  _startPeriodicFlush() {
    setInterval(async () => {
      if (this.dirty && this.initialized) {
        await this.flush();
      }
    }, this.flushInterval);
  }

  async flush() {
    if (!this.initialized || !this.data) return;

    try {
      this.data.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.dataFile, JSON.stringify(this.data, null, 2), 'utf8');
      this.dirty = false;
    } catch (err) {
      console.error('Analytics flush failed:', err.message);
    }
  }

  // Track tool usage
  trackToolUsage(toolName) {
    if (!this.initialized) return;

    if (this.data.toolUsage[toolName] !== undefined) {
      this.data.toolUsage[toolName]++;
    } else {
      this.data.toolUsage[toolName] = 1;
    }

    // Track daily usage
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.dailyUsage[today]) {
      this.data.dailyUsage[today] = { total: 0, byTool: {} };
    }
    this.data.dailyUsage[today].total++;
    this.data.dailyUsage[today].byTool[toolName] =
      (this.data.dailyUsage[today].byTool[toolName] || 0) + 1;

    // Clean up old daily data (keep 30 days)
    this._cleanupDailyUsage();

    this.dirty = true;
  }

  // Track query topics
  trackQuery(topic, detailLevel = 'detailed') {
    if (!this.initialized) return;

    const normalizedTopic = topic.toLowerCase().trim();

    // Extract key terms
    const terms = normalizedTopic.split(/\s+/).filter((t) => t.length > 2);

    // Track full topic
    this.data.queryTopics[normalizedTopic] = (this.data.queryTopics[normalizedTopic] || 0) + 1;

    // Track individual terms
    terms.forEach((term) => {
      this.data.searchTerms[term] = (this.data.searchTerms[term] || 0) + 1;
    });

    this.dirty = true;
  }

  // Track search
  trackSearch(query, resultsCount) {
    if (!this.initialized) return;

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    terms.forEach((term) => {
      this.data.searchTerms[term] = (this.data.searchTerms[term] || 0) + 1;
    });

    this.dirty = true;
  }

  // Track best practice requests
  trackBestPractice(scenario) {
    if (!this.initialized) return;

    const normalized = scenario.toLowerCase().trim();
    this.data.bestPracticeScenarios[normalized] =
      (this.data.bestPracticeScenarios[normalized] || 0) + 1;

    this.dirty = true;
  }

  // Track project analysis
  trackProjectAnalysis(projectInfo) {
    if (!this.initialized) return;

    this.data.projectAnalysis.count++;

    if (projectInfo.modules) {
      projectInfo.modules.forEach((mod) => {
        this.data.projectAnalysis.moduleTypes[mod.name] =
          (this.data.projectAnalysis.moduleTypes[mod.name] || 0) + 1;
      });
    }

    this.dirty = true;
  }

  // Track knowledge additions
  trackKnowledgeAddition(file, category) {
    if (!this.initialized) return;

    this.data.knowledgeAdditions.count++;
    this.data.knowledgeAdditions.byFile[file] =
      (this.data.knowledgeAdditions.byFile[file] || 0) + 1;
    if (category) {
      this.data.knowledgeAdditions.byCategory[category] =
        (this.data.knowledgeAdditions.byCategory[category] || 0) + 1;
    }

    this.dirty = true;
  }

  // Track errors
  trackError(toolName, errorMessage) {
    if (!this.initialized) return;

    this.data.errors.count++;
    this.data.errors.byTool[toolName] = (this.data.errors.byTool[toolName] || 0) + 1;

    // Keep last 50 errors
    this.data.errors.recent.unshift({
      tool: toolName,
      message: errorMessage.substring(0, 200),
      timestamp: new Date().toISOString(),
    });
    this.data.errors.recent = this.data.errors.recent.slice(0, 50);

    this.dirty = true;
  }

  // Start a new session
  startSession() {
    if (!this.initialized) return;

    this.data.sessions.total++;
    this.data.sessions.current = {
      started: new Date().toISOString(),
      toolCalls: 0,
    };

    this.dirty = true;
  }

  // End current session
  endSession() {
    if (!this.initialized || !this.data.sessions.current) return;

    const started = new Date(this.data.sessions.current.started);
    const duration = (Date.now() - started.getTime()) / 60000; // minutes

    // Update average duration
    const totalSessions = this.data.sessions.total;
    const currentAvg = this.data.sessions.avgDurationMinutes;
    this.data.sessions.avgDurationMinutes =
      (currentAvg * (totalSessions - 1) + duration) / totalSessions;

    this.data.sessions.current = null;
    this.dirty = true;
  }

  _cleanupDailyUsage() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    Object.keys(this.data.dailyUsage).forEach((date) => {
      if (date < cutoffStr) {
        delete this.data.dailyUsage[date];
      }
    });
  }

  // Get analytics summary
  getSummary() {
    if (!this.initialized || !this.data) {
      return { error: 'Analytics not initialized' };
    }

    // Sort and get top items
    const topTools = Object.entries(this.data.toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topTopics = Object.entries(this.data.queryTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topSearchTerms = Object.entries(this.data.searchTerms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topBestPractices = Object.entries(this.data.bestPracticeScenarios)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Calculate totals
    const totalToolCalls = Object.values(this.data.toolUsage).reduce((a, b) => a + b, 0);

    // Recent daily trend
    const recentDays = Object.entries(this.data.dailyUsage)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .map(([date, data]) => ({ date, calls: data.total }));

    return {
      overview: {
        totalToolCalls,
        totalSessions: this.data.sessions.total,
        avgSessionMinutes: Math.round(this.data.sessions.avgDurationMinutes * 10) / 10,
        totalErrors: this.data.errors.count,
        knowledgeAdditions: this.data.knowledgeAdditions.count,
        projectsAnalyzed: this.data.projectAnalysis.count,
      },
      topTools: Object.fromEntries(topTools),
      topTopics: Object.fromEntries(topTopics),
      topSearchTerms: Object.fromEntries(topSearchTerms),
      topBestPractices: Object.fromEntries(topBestPractices),
      recentTrend: recentDays,
      lastUpdated: this.data.lastUpdated,
    };
  }

  // Get detailed report
  getDetailedReport() {
    if (!this.initialized || !this.data) {
      return { error: 'Analytics not initialized' };
    }

    return {
      ...this.getSummary(),
      allToolUsage: this.data.toolUsage,
      allTopics: this.data.queryTopics,
      allSearchTerms: this.data.searchTerms,
      projectAnalysis: this.data.projectAnalysis,
      knowledgeAdditions: this.data.knowledgeAdditions,
      errors: {
        count: this.data.errors.count,
        byTool: this.data.errors.byTool,
        recentCount: this.data.errors.recent.length,
      },
      dailyUsage: this.data.dailyUsage,
    };
  }

  // Export for reporting
  async exportReport(filepath) {
    const report = this.getDetailedReport();
    report.exportedAt = new Date().toISOString();
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
    return filepath;
  }
}

export default Analytics;
