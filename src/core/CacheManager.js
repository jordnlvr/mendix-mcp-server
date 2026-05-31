/**
 * Smart caching layer
 * LRU cache with TTL support for performance optimization
 */

import { getConfig } from '../utils/config.js';
import Logger from '../utils/logger.js';

class CacheEntry {
  constructor(value, ttl) {
    this.value = value;
    this.createdAt = Date.now();
    this.accessedAt = Date.now();
    this.accessCount = 0;
    this.ttl = ttl;
  }

  isExpired() {
    if (!this.ttl) return false;
    return Date.now() - this.createdAt > this.ttl * 1000;
  }

  touch() {
    this.accessedAt = Date.now();
    this.accessCount++;
  }
}

class CacheManager {
  constructor(options = {}) {
    this.logger = new Logger('CacheManager');
    const config = getConfig();

    this.enabled = options.enabled ?? config.get('cache.enabled', true);
    this.maxSize = options.maxSize ?? config.get('cache.maxSize', 100);
    this.defaultTTL = options.ttl ?? config.get('cache.ttl', 3600);
    this.strategy = options.strategy ?? config.get('cache.strategy', 'lru');

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };

    this.logger.info('Cache manager initialized', {
      enabled: this.enabled,
      maxSize: this.maxSize,
      ttl: this.defaultTTL,
    });
  }

  /**
   * Get value from cache
   */
  get(key) {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.logger.debug('Cache entry expired', { key });
      return null;
    }

    entry.touch();
    this.stats.hits++;
    this.logger.debug('Cache hit', { key, accessCount: entry.accessCount });
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    if (!this.enabled) return;

    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evict();
    }

    const entry = new CacheEntry(value, ttl ?? this.defaultTTL);
    this.cache.set(key, entry);

    this.logger.debug('Cache set', { key, ttl: entry.ttl });
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    if (!this.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.isExpired()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache key deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info('Cache cleared', { clearedEntries: size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Evict entries based on strategy
   */
  _evict() {
    if (this.cache.size === 0) return;

    let keyToEvict = null;

    if (this.strategy === 'lru') {
      // Evict least recently used
      let oldestAccess = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessedAt < oldestAccess) {
          oldestAccess = entry.accessedAt;
          keyToEvict = key;
        }
      }
    } else if (this.strategy === 'lfu') {
      // Evict least frequently used
      let lowestCount = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessCount < lowestCount) {
          lowestCount = entry.accessCount;
          keyToEvict = key;
        }
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
      this.logger.debug('Cache entry evicted', {
        key: keyToEvict,
        strategy: this.strategy,
      });
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info('Cache cleanup completed', { entriesCleaned: cleaned });
    }

    return cleaned;
  }

  /**
   * Get all keys matching pattern
   */
  keys(pattern = null) {
    const keys = Array.from(this.cache.keys());

    if (!pattern) return keys;

    const regex = new RegExp(pattern);
    return keys.filter((key) => regex.test(key));
  }

  /**
   * Invalidate keys matching pattern
   */
  invalidate(pattern) {
    const keys = this.keys(pattern);
    let invalidated = 0;

    for (const key of keys) {
      if (this.delete(key)) {
        invalidated++;
      }
    }

    this.logger.info('Cache invalidated', { pattern, count: invalidated });
    return invalidated;
  }
}

export default CacheManager;
