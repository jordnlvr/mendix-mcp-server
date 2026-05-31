/**
 * KnowledgeManager - Comprehensive knowledge base management
 * Handles CRUD operations, versioning, metadata, quality scoring, and conflict detection
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';
import { validateObject, validateString, ValidationError } from '../utils/validator.js';
import QualityScorer from './QualityScorer.js';

// Get absolute path to the server root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, '../..');

class KnowledgeManager {
  constructor(knowledgeBasePath = null) {
    this.logger = new Logger('KnowledgeManager');
    this.config = getConfig();
    this.qualityScorer = new QualityScorer();

    // Use absolute path to knowledge folder (relative to server root)
    const configPath = this.config.get('paths.knowledgeBase', './knowledge');
    this.knowledgeBasePath =
      knowledgeBasePath ||
      (configPath.startsWith('./') ? path.join(SERVER_ROOT, configPath.slice(2)) : configPath);

    this.knowledgeFiles = [
      'studio-pro',
      'model-sdk',
      'platform-sdk',
      'best-practices',
      'troubleshooting',
      'advanced-patterns',
      'performance-guide',
      'security-guide',
      'sdk-community-resources',
      'pluggable-widgets',
      'getting-started',
    ];

    this.knowledgeBase = {};
    this.loaded = false;

    this.logger.info('KnowledgeManager initialized', {
      path: this.knowledgeBasePath,
    });
  }

  /**
   * Load all knowledge base files
   */
  async load() {
    try {
      for (const fileName of this.knowledgeFiles) {
        const filePath = path.join(this.knowledgeBasePath, `${fileName}.json`);

        if (await fs.pathExists(filePath)) {
          const data = await fs.readJson(filePath);
          this.knowledgeBase[fileName] = data;
          this.logger.debug('Loaded knowledge file', { file: fileName });
        } else {
          this.logger.warn('Knowledge file not found', { file: fileName });
          this.knowledgeBase[fileName] = this._createEmptyKnowledgeFile(fileName);
        }
      }

      this.loaded = true;
      this.logger.info('Knowledge base loaded', {
        files: Object.keys(this.knowledgeBase).length,
      });

      // Quick validation on startup
      const validation = this.quickValidate();
      if (!validation.valid) {
        this.logger.warn('Knowledge base validation issues', {
          issues: validation.issues,
        });
      }

      return this.knowledgeBase;
    } catch (error) {
      this.logger.error('Failed to load knowledge base', { error: error.message });
      throw error;
    }
  }

  /**
   * Reload knowledge base from disk
   */
  async reload() {
    this.logger.info('Reloading knowledge base');
    this.knowledgeBase = {};
    this.loaded = false;
    return await this.load();
  }

  /**
   * Add new knowledge entry
   */
  async add(fileName, category, content, source, options = {}) {
    try {
      // Validate inputs
      validateString(fileName, 'fileName', { required: true });
      validateString(source, 'source', { required: true });
      validateObject(content, {}, 'content');

      if (!this.knowledgeFiles.includes(fileName)) {
        throw new ValidationError(
          `Invalid knowledge file. Must be one of: ${this.knowledgeFiles.join(', ')}`,
          'fileName'
        );
      }

      // Ensure knowledge base is loaded
      if (!this.loaded) {
        await this.load();
      }

      // Get or create file data
      if (!this.knowledgeBase[fileName]) {
        this.knowledgeBase[fileName] = this._createEmptyKnowledgeFile(fileName);
      }

      const fileData = this.knowledgeBase[fileName];

      // Check for duplicates if enabled
      if (this.config.get('knowledge.enableConflictDetection', true)) {
        const duplicate = await this._findDuplicate(fileData, category, content);
        if (duplicate) {
          this.logger.warn('Duplicate knowledge detected', {
            file: fileName,
            category,
          });

          if (options.mergeDuplicates) {
            return await this._mergeDuplicates(fileName, category, duplicate, content, source);
          } else if (!options.allowDuplicates) {
            throw new Error(
              'Duplicate knowledge entry found. Set allowDuplicates or mergeDuplicates option.'
            );
          }
        }
      }

      // Create enhanced content with metadata
      const enhancedContent = this._createMetadata(content, source, options);

      // Add to appropriate location
      this._addToCategory(fileData, category, enhancedContent);

      // Calculate quality score
      enhancedContent._metadata.quality_score = this.qualityScorer.calculateScore(enhancedContent);

      // Save to disk
      await this._saveFile(fileName, fileData);

      this.logger.info('Knowledge added', {
        file: fileName,
        category,
        id: enhancedContent._metadata.id,
        quality: enhancedContent._metadata.quality_score,
      });

      return {
        success: true,
        id: enhancedContent._metadata.id,
        qualityScore: enhancedContent._metadata.quality_score,
      };
    } catch (error) {
      this.logger.error('Failed to add knowledge', {
        file: fileName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update existing knowledge entry
   */
  async update(fileName, entryId, updates, options = {}) {
    try {
      if (!this.loaded) {
        await this.load();
      }

      const fileData = this.knowledgeBase[fileName];
      if (!fileData) {
        throw new Error(`Knowledge file not found: ${fileName}`);
      }

      // Find the entry
      const { entry, location } = this._findEntryById(fileData, entryId);
      if (!entry) {
        throw new Error(`Entry not found: ${entryId}`);
      }

      // Create version history if enabled
      if (this.config.get('knowledge.enableVersioning', true)) {
        if (!entry._metadata.versions) {
          entry._metadata.versions = [];
        }

        // Save current version
        entry._metadata.versions.push({
          content: { ...entry },
          timestamp: entry._metadata.updated_at || entry._metadata.added_at,
          version: entry._metadata.version || 1,
        });
      }

      // Apply updates
      Object.assign(entry, updates);

      // Update metadata
      entry._metadata.updated_at = new Date().toISOString();
      entry._metadata.version = (entry._metadata.version || 1) + 1;
      entry._metadata.updated_by = options.updatedBy || 'system';

      // Recalculate quality score
      entry._metadata.quality_score = this.qualityScorer.calculateScore(entry);

      // Save to disk
      await this._saveFile(fileName, fileData);

      this.logger.info('Knowledge updated', {
        file: fileName,
        id: entryId,
        version: entry._metadata.version,
      });

      return {
        success: true,
        id: entryId,
        version: entry._metadata.version,
        qualityScore: entry._metadata.quality_score,
      };
    } catch (error) {
      this.logger.error('Failed to update knowledge', {
        file: fileName,
        id: entryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete knowledge entry
   */
  async delete(fileName, entryId) {
    try {
      if (!this.loaded) {
        await this.load();
      }

      const fileData = this.knowledgeBase[fileName];
      if (!fileData) {
        throw new Error(`Knowledge file not found: ${fileName}`);
      }

      const deleted = this._deleteEntryById(fileData, entryId);

      if (deleted) {
        await this._saveFile(fileName, fileData);
        this.logger.info('Knowledge deleted', { file: fileName, id: entryId });
      }

      return { success: deleted };
    } catch (error) {
      this.logger.error('Failed to delete knowledge', {
        file: fileName,
        id: entryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record usage of a knowledge entry
   */
  async recordUsage(fileName, entryId) {
    try {
      const fileData = this.knowledgeBase[fileName];
      if (!fileData) return;

      const { entry } = this._findEntryById(fileData, entryId);
      if (!entry || !entry._metadata) return;

      entry._metadata.usage_count = (entry._metadata.usage_count || 0) + 1;
      entry._metadata.last_used_at = new Date().toISOString();

      // Async save (don't block)
      this._saveFile(fileName, fileData).catch((error) => {
        this.logger.warn('Failed to save usage', { error: error.message });
      });
    } catch (error) {
      this.logger.warn('Failed to record usage', { error: error.message });
    }
  }

  /**
   * Get all knowledge from a file
   */
  getFile(fileName) {
    if (!this.loaded) {
      throw new Error('Knowledge base not loaded. Call load() first.');
    }

    return this.knowledgeBase[fileName] || null;
  }

  /**
   * Get knowledge by category
   */
  getCategory(fileName, category) {
    const fileData = this.getFile(fileName);
    if (!fileData || !fileData.categories) return [];

    return fileData.categories[category] || [];
  }

  /**
   * Create metadata for new knowledge entry
   */
  _createMetadata(content, source, options = {}) {
    return {
      ...content,
      _metadata: {
        id: uuidv4(),
        added_at: new Date().toISOString(),
        source,
        added_by: options.addedBy || 'mendix-expert-mcp',
        version: 1,
        verified: options.verified || false,
        mendix_version: options.mendixVersion || null,
        usage_count: 0,
        access_count: 0,
        feedback: { positive: 0, negative: 0, total: 0 },
      },
    };
  }

  /**
   * Add entry to appropriate category
   */
  _addToCategory(fileData, category, entry) {
    if (category) {
      if (!fileData.categories) {
        fileData.categories = {};
      }

      if (!fileData.categories[category]) {
        fileData.categories[category] = [];
      }

      if (!Array.isArray(fileData.categories[category])) {
        fileData.categories[category] = [fileData.categories[category]];
      }

      fileData.categories[category].push(entry);
    } else {
      if (!fileData.items) {
        fileData.items = [];
      }
      fileData.items.push(entry);
    }
  }

  /**
   * Find entry by ID
   */
  _findEntryById(fileData, entryId) {
    // Search in categories
    if (fileData.categories) {
      for (const [catName, items] of Object.entries(fileData.categories)) {
        if (Array.isArray(items)) {
          const entry = items.find((item) => item._metadata?.id === entryId);
          if (entry) {
            return { entry, location: { type: 'category', name: catName } };
          }
        }
      }
    }

    // Search in root items
    if (fileData.items && Array.isArray(fileData.items)) {
      const entry = fileData.items.find((item) => item._metadata?.id === entryId);
      if (entry) {
        return { entry, location: { type: 'root' } };
      }
    }

    return { entry: null, location: null };
  }

  /**
   * Delete entry by ID
   */
  _deleteEntryById(fileData, entryId) {
    // Search in categories
    if (fileData.categories) {
      for (const [catName, items] of Object.entries(fileData.categories)) {
        if (Array.isArray(items)) {
          const index = items.findIndex((item) => item._metadata?.id === entryId);
          if (index !== -1) {
            items.splice(index, 1);
            return true;
          }
        }
      }
    }

    // Search in root items
    if (fileData.items && Array.isArray(fileData.items)) {
      const index = fileData.items.findIndex((item) => item._metadata?.id === entryId);
      if (index !== -1) {
        fileData.items.splice(index, 1);
        return true;
      }
    }

    return false;
  }

  /**
   * Find potential duplicate entries
   */
  async _findDuplicate(fileData, category, newContent) {
    // Simple duplicate detection: check for similar content
    const contentStr = JSON.stringify(newContent).toLowerCase();

    const checkItems = (items) => {
      for (const item of items) {
        const itemStr = JSON.stringify(item).toLowerCase();
        const similarity = this._calculateSimilarity(contentStr, itemStr);

        if (similarity > 0.85) {
          // 85% similar
          return item;
        }
      }
      return null;
    };

    // Check category
    if (category && fileData.categories && fileData.categories[category]) {
      const items = fileData.categories[category];
      if (Array.isArray(items)) {
        const duplicate = checkItems(items);
        if (duplicate) return duplicate;
      }
    }

    return null;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance for similarity calculation
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Merge duplicate entries
   */
  async _mergeDuplicates(fileName, category, existing, newContent, source) {
    // Merge strategy: keep existing, update with new info if quality is better
    const existingScore = this.qualityScorer.calculateScore(existing);
    const newEntry = this._createMetadata(newContent, source);
    const newScore = this.qualityScorer.calculateScore(newEntry);

    if (newScore > existingScore) {
      // Update existing with new content
      return await this.update(fileName, existing._metadata.id, newContent, {
        updatedBy: 'merge',
      });
    }

    // Keep existing
    return {
      success: true,
      id: existing._metadata.id,
      merged: true,
    };
  }

  /**
   * Create empty knowledge file structure
   */
  _createEmptyKnowledgeFile(fileName) {
    return {
      topic: fileName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Knowledge base for ${fileName}`,
      categories: {},
      items: [],
      metadata: {
        created_at: new Date().toISOString(),
        version: '2.0',
      },
    };
  }

  /**
   * Save knowledge file to disk
   */
  async _saveFile(fileName, data) {
    const filePath = path.join(this.knowledgeBasePath, `${fileName}.json`);

    await fs.ensureDir(this.knowledgeBasePath);
    await fs.writeJson(filePath, data, { spaces: 2 });

    this.logger.debug('Knowledge file saved', { file: fileName });
  }

  /**
   * Get statistics about knowledge base
   */
  getStats() {
    const stats = {
      filesLoaded: Object.keys(this.knowledgeBase).length,
      totalEntries: 0,
      byFile: {},
    };

    for (const [fileName, fileData] of Object.entries(this.knowledgeBase)) {
      let count = 0;

      if (fileData.categories) {
        for (const items of Object.values(fileData.categories)) {
          if (Array.isArray(items)) {
            count += items.length;
          }
        }
      }

      if (fileData.items && Array.isArray(fileData.items)) {
        count += fileData.items.length;
      }

      stats.byFile[fileName] = count;
      stats.totalEntries += count;
    }

    return stats;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate entire knowledge base
   * Returns validation report with errors, warnings, and suggestions
   */
  validateKnowledgeBase() {
    const report = {
      valid: true,
      filesChecked: 0,
      entriesChecked: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      byFile: {},
    };

    for (const [fileName, fileData] of Object.entries(this.knowledgeBase)) {
      const fileReport = this._validateFile(fileName, fileData);
      report.filesChecked++;
      report.entriesChecked += fileReport.entriesChecked;

      if (fileReport.errors.length > 0) {
        report.valid = false;
        report.errors.push(...fileReport.errors);
      }
      report.warnings.push(...fileReport.warnings);
      report.suggestions.push(...fileReport.suggestions);
      report.byFile[fileName] = fileReport;
    }

    this.logger.info('Knowledge base validation complete', {
      valid: report.valid,
      errors: report.errors.length,
      warnings: report.warnings.length,
    });

    return report;
  }

  /**
   * Validate a single knowledge file
   */
  _validateFile(fileName, fileData) {
    const report = {
      valid: true,
      entriesChecked: 0,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Check required top-level fields
    if (!fileData.topic && !fileData.description) {
      report.warnings.push({
        file: fileName,
        type: 'missing_metadata',
        message: 'File missing topic or description',
      });
    }

    // Check for categories structure
    if (!fileData.categories && !fileData.items && !fileData.mendix_11_specific) {
      report.warnings.push({
        file: fileName,
        type: 'empty_file',
        message: 'File has no categories, items, or content',
      });
    }

    // Validate categories
    if (fileData.categories) {
      for (const [catName, items] of Object.entries(fileData.categories)) {
        if (!Array.isArray(items)) {
          // Some files have nested objects instead of arrays
          if (typeof items === 'object') {
            for (const [subKey, subItems] of Object.entries(items)) {
              if (Array.isArray(subItems)) {
                for (const entry of subItems) {
                  this._validateEntry(entry, fileName, catName, report);
                  report.entriesChecked++;
                }
              }
            }
          }
        } else {
          for (const entry of items) {
            this._validateEntry(entry, fileName, catName, report);
            report.entriesChecked++;
          }
        }
      }
    }

    // Validate root items
    if (fileData.items && Array.isArray(fileData.items)) {
      for (const entry of fileData.items) {
        this._validateEntry(entry, fileName, 'root', report);
        report.entriesChecked++;
      }
    }

    // Check last_updated date
    if (fileData.last_updated) {
      const lastUpdate = new Date(fileData.last_updated);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 90) {
        report.suggestions.push({
          file: fileName,
          type: 'stale_content',
          message: `File not updated in ${Math.round(daysSinceUpdate)} days`,
          lastUpdated: fileData.last_updated,
        });
      }
    } else {
      report.suggestions.push({
        file: fileName,
        type: 'no_update_date',
        message: 'File has no last_updated field',
      });
    }

    if (report.errors.length > 0) {
      report.valid = false;
    }

    return report;
  }

  /**
   * Validate a single entry
   */
  _validateEntry(entry, fileName, category, report) {
    if (!entry || typeof entry !== 'object') {
      report.errors.push({
        file: fileName,
        category,
        type: 'invalid_entry',
        message: 'Entry is not a valid object',
      });
      return;
    }

    // Check for identifying field
    const hasIdentifier =
      entry.practice ||
      entry.name ||
      entry.feature ||
      entry.topic ||
      entry.pattern ||
      entry.title ||
      entry.method ||
      entry.error;

    if (!hasIdentifier) {
      report.warnings.push({
        file: fileName,
        category,
        type: 'no_identifier',
        message: 'Entry missing identifying field (practice, name, feature, topic, etc.)',
        entry: JSON.stringify(entry).slice(0, 100),
      });
    }

    // Check for description or content
    const hasContent =
      entry.description ||
      entry.rationale ||
      entry.solution ||
      entry.explanation ||
      entry.content ||
      entry.details;

    if (!hasContent) {
      report.warnings.push({
        file: fileName,
        category,
        type: 'no_content',
        message: 'Entry missing content field (description, rationale, solution, etc.)',
        entry: hasIdentifier ? entry.practice || entry.name || entry.feature : 'unknown',
      });
    }

    // Check for empty strings
    for (const [key, value] of Object.entries(entry)) {
      if (typeof value === 'string' && value.trim() === '' && key !== '_metadata') {
        report.warnings.push({
          file: fileName,
          category,
          type: 'empty_field',
          message: `Field '${key}' is empty`,
          entry: hasIdentifier ? entry.practice || entry.name || entry.feature : 'unknown',
        });
      }
    }

    // Check URL fields are valid
    const urlFields = ['docs', 'url', 'link', 'reference', 'source'];
    for (const field of urlFields) {
      if (entry[field] && typeof entry[field] === 'string') {
        if (!entry[field].startsWith('http://') && !entry[field].startsWith('https://')) {
          report.warnings.push({
            file: fileName,
            category,
            type: 'invalid_url',
            message: `Field '${field}' doesn't look like a valid URL`,
            value: entry[field].slice(0, 50),
          });
        }
      }
    }
  }

  /**
   * Quick validation check (for startup)
   * Only checks structure, not content
   */
  quickValidate() {
    const issues = [];

    for (const [fileName, fileData] of Object.entries(this.knowledgeBase)) {
      if (!fileData || typeof fileData !== 'object') {
        issues.push(`${fileName}: Invalid JSON structure`);
        continue;
      }

      // Check for any content structure - expanded to include all formats
      if (
        !fileData.categories &&
        !fileData.items &&
        !fileData.mendix_11_specific &&
        !fileData.resources &&
        !fileData.entries &&
        !fileData.verified_patterns &&
        !fileData.rules
      ) {
        issues.push(`${fileName}: No content found`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // ============================================================================
  // STALENESS DETECTION
  // ============================================================================

  /**
   * Get stale knowledge entries that need review
   * @param {number} maxAgeDays - Entries older than this are considered stale (default 90)
   */
  getStaleEntries(maxAgeDays = 90) {
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const staleEntries = [];

    for (const [fileName, fileData] of Object.entries(this.knowledgeBase)) {
      // Check file-level staleness
      if (fileData.last_updated) {
        const fileAge = now - new Date(fileData.last_updated).getTime();
        if (fileAge > maxAgeMs) {
          staleEntries.push({
            type: 'file',
            file: fileName,
            lastUpdated: fileData.last_updated,
            daysOld: Math.round(fileAge / (24 * 60 * 60 * 1000)),
            reason: 'File not updated recently',
          });
        }
      }

      // Check individual entry staleness via _metadata
      const checkEntries = (entries, category) => {
        if (!Array.isArray(entries)) return;
        for (const entry of entries) {
          const meta = entry._metadata;
          if (meta?.last_verified) {
            const entryAge = now - new Date(meta.last_verified).getTime();
            if (entryAge > maxAgeMs) {
              staleEntries.push({
                type: 'entry',
                file: fileName,
                category,
                entry: entry.practice || entry.name || entry.feature || entry.topic || 'unknown',
                lastVerified: meta.last_verified,
                daysOld: Math.round(entryAge / (24 * 60 * 60 * 1000)),
                reason: 'Entry not verified recently',
              });
            }
          }
        }
      };

      // Check categories
      if (fileData.categories) {
        for (const [catName, items] of Object.entries(fileData.categories)) {
          checkEntries(items, catName);
        }
      }

      // Check root items
      if (fileData.items) {
        checkEntries(fileData.items, 'root');
      }
    }

    // Sort by age (oldest first)
    staleEntries.sort((a, b) => b.daysOld - a.daysOld);

    return {
      count: staleEntries.length,
      maxAgeDays,
      entries: staleEntries,
      summary: this._summarizeStaleness(staleEntries),
    };
  }

  /**
   * Summarize staleness by file
   */
  _summarizeStaleness(staleEntries) {
    const byFile = {};
    for (const entry of staleEntries) {
      if (!byFile[entry.file]) {
        byFile[entry.file] = { count: 0, oldestDays: 0 };
      }
      byFile[entry.file].count++;
      byFile[entry.file].oldestDays = Math.max(byFile[entry.file].oldestDays, entry.daysOld);
    }
    return byFile;
  }

  /**
   * Mark an entry as verified (refreshes staleness)
   */
  async markAsVerified(fileName, entryId) {
    const fileData = this.knowledgeBase[fileName];
    if (!fileData) {
      throw new Error(`File not found: ${fileName}`);
    }

    const { entry } = this._findEntryById(fileData, entryId);
    if (!entry) {
      throw new Error(`Entry not found: ${entryId}`);
    }

    if (!entry._metadata) {
      entry._metadata = { id: entryId };
    }
    entry._metadata.last_verified = new Date().toISOString();
    entry._metadata.verified_count = (entry._metadata.verified_count || 0) + 1;

    await this._saveFile(fileName, fileData);
    this.logger.info('Entry marked as verified', { file: fileName, entry: entryId });

    return entry;
  }

  /**
   * Update file-level last_updated timestamp
   */
  async touchFile(fileName) {
    const fileData = this.knowledgeBase[fileName];
    if (!fileData) {
      throw new Error(`File not found: ${fileName}`);
    }

    fileData.last_updated = new Date().toISOString().split('T')[0];
    await this._saveFile(fileName, fileData);
    this.logger.info('File timestamp updated', { file: fileName });

    return fileData;
  }
}

export default KnowledgeManager;
