/**
 * Configuration management
 * Loads and merges configuration from file and environment
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Config {
  constructor(configPath = null) {
    this.config = {};
    this.configPath = configPath || path.join(__dirname, '../../config/default.json');
    this.load();
  }

  /**
   * Load configuration from file
   */
  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = fs.readJsonSync(this.configPath);
      }
    } catch (error) {
      console.error(`Failed to load config from ${this.configPath}:`, error.message);
      this.config = this._getDefaults();
    }

    // Merge with environment variables
    this._mergeEnvVars();
  }

  /**
   * Get configuration value by path (e.g., 'server.name')
   */
  get(keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value by path
   */
  set(keyPath, value) {
    const keys = keyPath.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Check if key exists
   */
  has(keyPath) {
    return this.get(keyPath) !== null;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Merge environment variables into config
   */
  _mergeEnvVars() {
    // Server settings
    if (process.env.MCP_SERVER_NAME) {
      this.set('server.name', process.env.MCP_SERVER_NAME);
    }

    // Path overrides
    if (process.env.KNOWLEDGE_BASE_PATH) {
      this.set('paths.knowledgeBase', process.env.KNOWLEDGE_BASE_PATH);
    }
    if (process.env.CACHE_PATH) {
      this.set('paths.cache', process.env.CACHE_PATH);
    }

    // Cache settings
    if (process.env.CACHE_ENABLED) {
      this.set('cache.enabled', process.env.CACHE_ENABLED === 'true');
    }
    if (process.env.CACHE_TTL) {
      this.set('cache.ttl', parseInt(process.env.CACHE_TTL, 10));
    }

    // Knowledge settings
    if (process.env.AUTO_RESEARCH) {
      this.set('knowledge.autoResearch', process.env.AUTO_RESEARCH === 'true');
    }
    if (process.env.ENABLE_VERSIONING) {
      this.set('knowledge.enableVersioning', process.env.ENABLE_VERSIONING === 'true');
    }

    // Logging
    if (process.env.LOG_LEVEL) {
      this.set('logging.level', process.env.LOG_LEVEL.toUpperCase());
    }
  }

  /**
   * Default configuration fallback
   */
  _getDefaults() {
    return {
      server: {
        name: 'mendix-expert',
        version: '2.0.0',
        description: 'Universal Mendix development knowledge server',
      },
      paths: {
        knowledgeBase: './knowledge',
        cache: './cache',
        logs: './logs',
      },
      cache: {
        enabled: true,
        ttl: 3600,
        maxSize: 100,
      },
      search: {
        engine: 'memory',
        maxResults: 10,
      },
      knowledge: {
        autoResearch: true,
        enableVersioning: true,
      },
      logging: {
        level: 'INFO',
      },
    };
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Check required paths
    const knowledgeBasePath = this.get('paths.knowledgeBase');
    if (!knowledgeBasePath) {
      errors.push('Knowledge base path is required');
    }

    // Validate cache settings
    const cacheTTL = this.get('cache.ttl');
    if (cacheTTL && (cacheTTL < 0 || cacheTTL > 86400)) {
      errors.push('Cache TTL must be between 0 and 86400 seconds');
    }

    // Validate search settings
    const maxResults = this.get('search.maxResults');
    if (maxResults && (maxResults < 1 || maxResults > 100)) {
      errors.push('Search max results must be between 1 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create config instance
 */
function getConfig(configPath = null) {
  if (!instance || configPath) {
    instance = new Config(configPath);
  }
  return instance;
}

export { Config, getConfig };
