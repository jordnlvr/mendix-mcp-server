/**
 * WebFetcher - Fetch knowledge from web sources when queries miss
 * Automatically enriches knowledge base with content from official Mendix docs
 */

import Logger from './logger.js';

class WebFetcher {
  constructor(options = {}) {
    this.logger = new Logger('WebFetcher');
    this.enabled = options.enabled ?? true;
    this.maxFetchPerSession = options.maxFetchPerSession ?? 10;
    this.fetchCount = 0;
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL ?? 3600000; // 1 hour

    // Mendix documentation sources
    this.sources = {
      docs: 'https://docs.mendix.com',
      academy: 'https://academy.mendix.com',
      forum: 'https://community.mendix.com',
      apidocs: 'https://apidocs.rnd.mendix.com',
    };

    // Search patterns for different query types
    this.searchPatterns = [
      { pattern: /microflow|mf/i, endpoint: '/refguide/microflows/' },
      { pattern: /nanoflow|nf/i, endpoint: '/refguide/nanoflows/' },
      { pattern: /entity|domain.?model/i, endpoint: '/refguide/domain-model/' },
      { pattern: /page|widget/i, endpoint: '/refguide/pages/' },
      { pattern: /security|role|permission/i, endpoint: '/refguide/security/' },
      { pattern: /sdk|platform.?sdk|model.?sdk/i, endpoint: '/apidocs-mxsdk/apidocs/' },
      { pattern: /rest|api|integration/i, endpoint: '/refguide/integration/' },
      { pattern: /xpath|oql|query/i, endpoint: '/refguide/xpath/' },
      { pattern: /deploy|cloud/i, endpoint: '/developerportal/deploy/' },
      { pattern: /performance|optim/i, endpoint: '/refguide/performance-best-practices/' },
    ];

    this.logger.info('WebFetcher initialized', { enabled: this.enabled });
  }

  /**
   * Suggest fetch URL based on missed query
   * Returns URL suggestions without actually fetching (to keep it fast)
   */
  suggestFetchUrls(query) {
    const suggestions = [];
    const queryLower = query.toLowerCase();

    for (const { pattern, endpoint } of this.searchPatterns) {
      if (pattern.test(queryLower)) {
        suggestions.push({
          url: `${this.sources.docs}${endpoint}`,
          reason: `Query matches pattern: ${pattern.source}`,
          confidence: 0.8,
        });
      }
    }

    // Always suggest a docs search
    const searchUrl = `${this.sources.docs}/search/?q=${encodeURIComponent(query)}`;
    suggestions.push({
      url: searchUrl,
      reason: 'Documentation search',
      confidence: 0.5,
    });

    // Suggest forum search for errors/issues
    if (/error|issue|problem|fail|exception|bug/i.test(queryLower)) {
      suggestions.push({
        url: `${this.sources.forum}/search?q=${encodeURIComponent(query)}`,
        reason: 'Community forum (troubleshooting)',
        confidence: 0.7,
      });
    }

    return suggestions;
  }

  /**
   * Fetch content from a URL (simple fetch, no parsing yet)
   * In a full implementation, this would parse and extract relevant content
   */
  async fetchContent(url) {
    if (!this.enabled) {
      return { success: false, reason: 'WebFetcher disabled' };
    }

    if (this.fetchCount >= this.maxFetchPerSession) {
      return { success: false, reason: 'Max fetch limit reached for session' };
    }

    // Check cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return { success: true, content: cached.content, cached: true };
    }

    try {
      this.fetchCount++;
      this.logger.info('Fetching web content', { url });

      // Note: In Node.js 18+, fetch is available globally
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MendixMCPServer/2.1.0 (Knowledge Enrichment)',
          Accept: 'text/html,application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let content;

      if (contentType?.includes('application/json')) {
        content = await response.json();
      } else {
        content = await response.text();
        // Basic HTML content extraction (title and text)
        content = this._extractTextFromHtml(content);
      }

      // Cache the result
      this.cache.set(url, { content, timestamp: Date.now() });

      return { success: true, content, cached: false };
    } catch (error) {
      this.logger.error('Failed to fetch content', { url, error: error.message });
      return { success: false, reason: error.message };
    }
  }

  /**
   * Simple HTML text extraction
   */
  _extractTextFromHtml(html) {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

    // Extract main content if possible
    const mainMatch =
      text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    if (mainMatch) {
      text = mainMatch[1];
    }

    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate if too long
    if (text.length > 2000) {
      text = text.slice(0, 2000) + '...';
    }

    return {
      title,
      description,
      text: text.slice(0, 500), // First 500 chars for preview
      fullText: text,
    };
  }

  /**
   * Generate knowledge entry suggestion from fetched content
   */
  generateKnowledgeSuggestion(query, fetchResult) {
    if (!fetchResult.success || !fetchResult.content) {
      return null;
    }

    const content = fetchResult.content;

    return {
      suggested: true,
      source: 'web_fetch',
      query,
      entry: {
        topic: content.title || query,
        description: content.description || content.text,
        content: content.fullText,
        source_url: fetchResult.url,
        auto_fetched: true,
        fetch_date: new Date().toISOString(),
        needs_review: true,
      },
    };
  }

  /**
   * Get fetch statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      fetchCount: this.fetchCount,
      maxFetchPerSession: this.maxFetchPerSession,
      cacheSize: this.cache.size,
      remainingFetches: this.maxFetchPerSession - this.fetchCount,
    };
  }

  /**
   * Reset fetch counter (call at session start)
   */
  resetFetchCount() {
    this.fetchCount = 0;
    this.logger.info('Fetch count reset');
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }
}

export default WebFetcher;
