/**
 * VectorStore - Pinecone-based semantic search for Mendix knowledge
 *
 * EMBEDDING PROVIDERS (checked in order):
 * 1. Azure OpenAI - Uses text-embedding-ada-002 or custom deployment (1536 dims)
 * 2. OpenAI - Uses text-embedding-3-small (1536 dims)
 * 3. Local TF-IDF - Free fallback, no API key required (384 dims)
 *
 * PINECONE:
 * - Built-in API key for shared knowledge base (no user setup needed)
 * - User can override with PINECONE_API_KEY env var for custom index
 *
 * @version 3.1.0
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger('VectorStore');

/**
 * Built-in Pinecone configuration for shared knowledge base
 * Users don't need to configure Pinecone - it works out of the box!
 * The key is obfuscated to prevent casual extraction but provides read access.
 */
const BUILTIN_PINECONE = {
  // Obfuscated key - decoded at runtime
  keyParts: [
    'cGNza18yZG1mc05fS0ZaQTh',
    'IeHV6b0xMM2NFQTFzYlJi',
    'elI1b0xUbUVLdmJ3c01G',
    'R01MTHlOenhTRVBMNW4z',
    'ZDZaTmZER3ZHOGRl',
  ],
  index: 'mendix-knowledge',
  region: 'us-east-1',
};

/**
 * Decode the built-in Pinecone key
 */
function getBuiltinPineconeKey() {
  try {
    const encoded = BUILTIN_PINECONE.keyParts.join('');
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * LRU Cache for query embeddings - avoids re-embedding repeated queries
 * Huge performance boost for common searches!
 *
 * NEW in v3.1.0: Disk persistence for faster server restarts!
 * Cache is saved to data/embedding-cache.json and loaded on startup.
 */
class EmbeddingCache {
  constructor(maxSize = 500, persistPath = null) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.diskHits = 0;

    // Determine persistence path
    if (persistPath) {
      this.persistPath = persistPath;
    } else {
      // Default: data/embedding-cache.json relative to project root
      const projectRoot = join(__dirname, '..', '..');
      this.persistPath = join(projectRoot, 'data', 'embedding-cache.json');
    }

    // Load from disk on startup
    this.loadFromDisk();
  }

  /**
   * Load cached embeddings from disk
   */
  loadFromDisk() {
    try {
      if (existsSync(this.persistPath)) {
        const data = JSON.parse(readFileSync(this.persistPath, 'utf-8'));
        if (data.entries && Array.isArray(data.entries)) {
          // Load entries (already sorted by recency in save)
          for (const [key, value] of data.entries) {
            this.cache.set(key, value);
          }
          this.diskHits = data.entries.length;
          logger.info('EmbeddingCache loaded from disk', { entries: data.entries.length });
        }
      }
    } catch (err) {
      logger.debug('Could not load embedding cache from disk', { error: err.message });
    }
  }

  /**
   * Save cached embeddings to disk
   */
  saveToDisk() {
    try {
      // Ensure data directory exists
      const dataDir = dirname(this.persistPath);
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      // Convert Map to array of entries (preserves insertion order = LRU order)
      const entries = Array.from(this.cache.entries());

      const data = {
        version: '3.1.0',
        savedAt: new Date().toISOString(),
        entries: entries,
        stats: {
          size: entries.length,
          hits: this.hits,
          misses: this.misses,
        },
      };

      writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
      logger.debug('EmbeddingCache saved to disk', { entries: entries.length });
    } catch (err) {
      logger.warn('Could not save embedding cache to disk', { error: err.message });
    }
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value;
    }
    this.misses++;
    return null;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);

    // Auto-save every 50 new entries
    if (this.cache.size % 50 === 0) {
      this.saveToDisk();
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      diskHits: this.diskHits,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
      persistPath: this.persistPath,
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.diskHits = 0;
    // Also clear disk cache
    try {
      if (existsSync(this.persistPath)) {
        writeFileSync(this.persistPath, JSON.stringify({ entries: [], version: '3.1.0' }));
      }
    } catch (err) {
      logger.debug('Could not clear disk cache', { error: err.message });
    }
  }

  /**
   * Graceful shutdown - save cache to disk
   */
  shutdown() {
    this.saveToDisk();
  }
}

/**
 * Azure OpenAI Embeddings - High quality semantic embeddings via Azure
 * Configure with: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT
 */
class AzureOpenAIEmbedder {
  constructor() {
    this.dimension = 1536; // text-embedding-ada-002 dimension
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.deploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
    this.apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    this.batchSize = 16; // Azure has lower batch limits
  }

  isAvailable() {
    return !!this.apiKey && !!this.endpoint;
  }

  /**
   * Generate embeddings for a batch of texts
   */
  async embedBatch(texts) {
    if (!this.isAvailable()) {
      throw new Error('Azure OpenAI not configured');
    }

    const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/embeddings?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data.map((item) => item.embedding);
  }

  /**
   * Generate embedding for single text
   */
  async embed(text) {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  buildVocabulary() {}
}

/**
 * OpenAI Embeddings - High quality semantic embeddings
 * Configure with: OPENAI_API_KEY
 */
class OpenAIEmbedder {
  constructor() {
    this.dimension = 1536; // text-embedding-3-small dimension
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.batchSize = 100; // OpenAI allows up to 2048 inputs per request
  }

  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Generate embeddings for a batch of texts
   */
  async embedBatch(texts) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data.map((item) => item.embedding);
  }

  /**
   * Generate embedding for single text
   */
  async embed(text) {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  // No vocabulary building needed for OpenAI
  buildVocabulary() {}
}

/**
 * Local TF-IDF Embeddings - Free fallback
 */
class LocalEmbedder {
  constructor() {
    this.dimension = 384; // Standard small embedding size
    this.vocabulary = new Map();
    this.idf = new Map();
    this.docCount = 0;
  }

  /**
   * Build vocabulary from all documents
   */
  buildVocabulary(documents) {
    const docFreq = new Map();
    this.docCount = documents.length;

    // Count document frequencies
    for (const doc of documents) {
      const terms = this.tokenize(doc.content || doc.text || '');
      const uniqueTerms = new Set(terms);

      for (const term of uniqueTerms) {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
      }
    }

    // Calculate IDF and build vocabulary (top terms by document frequency)
    const sortedTerms = [...docFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, this.dimension);

    let idx = 0;
    for (const [term, freq] of sortedTerms) {
      this.vocabulary.set(term, idx++);
      this.idf.set(term, Math.log(this.docCount / (freq + 1)) + 1);
    }

    logger.info('Vocabulary built', {
      terms: this.vocabulary.size,
      documents: this.docCount,
    });
  }

  /**
   * Tokenize text into terms
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .map((t) => this.stem(t));
  }

  /**
   * Simple Porter-like stemmer
   */
  stem(word) {
    return word
      .replace(/ing$/, '')
      .replace(/tion$/, 't')
      .replace(/ies$/, 'y')
      .replace(/es$/, '')
      .replace(/s$/, '');
  }

  /**
   * Generate embedding vector for text
   */
  embed(text) {
    const terms = this.tokenize(text);
    const vector = new Array(this.dimension).fill(0);
    const termFreq = new Map();

    // Count term frequencies
    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }

    // Build TF-IDF vector
    for (const [term, tf] of termFreq) {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        const idf = this.idf.get(term) || 1;
        vector[idx] = tf * idf;
      }
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }
}

export default class VectorStore {
  constructor(options = {}) {
    this.indexName = options.indexName || process.env.PINECONE_INDEX || BUILTIN_PINECONE.index;
    this.namespace = options.namespace || 'default';

    // Query embedding cache - avoids re-embedding repeated queries
    this.queryCache = new EmbeddingCache(500);

    // Try Azure OpenAI first, then standard OpenAI, fall back to local
    this.azureEmbedder = new AzureOpenAIEmbedder();
    this.openaiEmbedder = new OpenAIEmbedder();
    this.localEmbedder = new LocalEmbedder();

    if (this.azureEmbedder.isAvailable()) {
      this.embedder = this.azureEmbedder;
      this.dimension = 1536;
      this.embeddingMode = 'azure-openai';
      logger.info('Using Azure OpenAI embeddings (high quality)', {
        endpoint: this.azureEmbedder.endpoint,
        deployment: this.azureEmbedder.deploymentName,
      });
    } else if (this.openaiEmbedder.isAvailable()) {
      this.embedder = this.openaiEmbedder;
      this.dimension = 1536;
      this.embeddingMode = 'openai';
      logger.info('Using OpenAI embeddings (high quality)', {
        model: this.openaiEmbedder.model,
      });
    } else {
      this.embedder = this.localEmbedder;
      this.dimension = 384;
      this.embeddingMode = 'local';
      logger.info(
        'Using local TF-IDF embeddings (no API key found - set OPENAI_API_KEY or AZURE_OPENAI_API_KEY for better results)'
      );
    }

    this.pinecone = null;
    this.index = null;
    this.initialized = false;
    this.usingBuiltinKey = false;

    logger.info('VectorStore created', {
      indexName: this.indexName,
      embeddingMode: this.embeddingMode,
    });
  }

  /**
   * Initialize Pinecone connection
   * Uses built-in key if no PINECONE_API_KEY is set
   */
  async initialize() {
    if (this.initialized) return true;

    // Try user-provided key first, then fall back to built-in
    let apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      apiKey = getBuiltinPineconeKey();
      if (apiKey) {
        this.usingBuiltinKey = true;
        logger.info('Using built-in Pinecone key for shared knowledge base');
      }
    }

    if (!apiKey) {
      logger.warn(
        'No Pinecone API key available, vector search disabled. Local TF-IDF search will be used.'
      );
      return false;
    }

    try {
      this.pinecone = new Pinecone({ apiKey });

      // Check if index exists, create if not (only for user's own key)
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some((i) => i.name === this.indexName);

      if (!indexExists && !this.usingBuiltinKey) {
        // Only create index if using user's own key
        logger.info('Creating Pinecone index', { name: this.indexName });
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: BUILTIN_PINECONE.region,
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndex();
      } else if (!indexExists && this.usingBuiltinKey) {
        logger.warn('Shared knowledge base index not found. Contact maintainer.');
        return false;
      }

      this.index = this.pinecone.index(this.indexName);
      this.initialized = true;

      logger.info('VectorStore initialized', { index: this.indexName });
      return true;
    } catch (error) {
      logger.error('Failed to initialize VectorStore', { error: error.message });
      return false;
    }
  }

  /**
   * Wait for index to become ready
   */
  async waitForIndex(maxWait = 60000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const description = await this.pinecone.describeIndex(this.indexName);
      if (description.status?.ready) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error('Index creation timed out');
  }

  /**
   * Generate a stable ID for a document
   */
  generateId(doc) {
    const content = doc.title + doc.content + (doc.category || '');
    return createHash('md5').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Index all knowledge documents
   */
  async indexDocuments(documents) {
    if (!this.initialized) {
      const ready = await this.initialize();
      if (!ready) {
        logger.warn('VectorStore not available, skipping indexing');
        return { indexed: 0, skipped: documents.length };
      }
    }

    // Build vocabulary for local embedder (no-op for OpenAI)
    this.embedder.buildVocabulary(documents);

    // Filter documents with content
    const validDocs = documents.filter((doc) => {
      const content = doc.content || doc.text || doc.title || '';
      return content.trim().length > 10; // Need at least 10 chars
    });

    logger.info('Processing documents', {
      total: documents.length,
      withContent: validDocs.length,
      mode: this.embeddingMode,
    });

    // Prepare vectors - handle async for OpenAI/Azure
    const vectors = [];
    const isCloudEmbedding =
      this.embeddingMode === 'openai' || this.embeddingMode === 'azure-openai';
    const batchSize =
      this.embeddingMode === 'azure-openai' ? 16 : this.embeddingMode === 'openai' ? 50 : 100;

    for (let i = 0; i < validDocs.length; i += batchSize) {
      const batch = validDocs.slice(i, i + batchSize);
      // Truncate texts to avoid token limit (8192 tokens ≈ 32000 chars, use 6000 for safety per doc)
      const MAX_CHARS = 6000;
      const texts = batch.map((doc) => {
        const text = doc.content || doc.text || doc.title || '';
        return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '...' : text;
      });

      let embeddings;
      let embeddingDimension = this.dimension; // Track dimension of embeddings produced

      if (isCloudEmbedding) {
        // Batch embedding for OpenAI/Azure (faster)
        try {
          embeddings = await this.embedder.embedBatch(texts);
          embeddingDimension = 1536; // Cloud embeddings are always 1536
        } catch (error) {
          logger.error('Primary cloud embedding failed', { error: error.message });

          // Try fallback to OpenAI if Azure failed and OpenAI is available
          if (this.embeddingMode === 'azure-openai' && this.openaiEmbedder.isAvailable()) {
            try {
              logger.info('Attempting fallback to OpenAI embeddings');
              embeddings = await this.openaiEmbedder.embedBatch(texts);
              embeddingDimension = 1536;
            } catch (fallbackError) {
              logger.error('OpenAI fallback also failed, skipping batch', {
                error: fallbackError.message,
              });
              // Skip this batch entirely rather than mixing dimensions
              continue;
            }
          } else {
            // Skip batch rather than fall back to local (dimension mismatch)
            logger.warn('Skipping batch - local embeddings would cause dimension mismatch');
            continue;
          }
        }
      } else {
        // Local embeddings (synchronous)
        embeddings = texts.map((t) => this.localEmbedder.embed(t));
        embeddingDimension = 384;
      }

      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddings[j];

        // Check if vector has any non-zero values
        const hasContent = embedding.some((v) => v !== 0);
        if (!hasContent) continue;

        vectors.push({
          id: this.generateId(doc),
          values: embedding,
          metadata: {
            title: doc.title?.slice(0, 500) || '',
            category: doc.category || 'general',
            source: doc.source || 'knowledge-base',
            version: doc.version || 'unknown',
            preview: (doc.content || doc.text || '').slice(0, 200),
          },
        });
      }

      logger.info('Embedded batch', {
        batch: Math.floor(i / batchSize) + 1,
        total: Math.ceil(validDocs.length / batchSize),
        vectors: vectors.length,
      });
    }

    logger.info('Vectors prepared', {
      total: documents.length,
      valid: vectors.length,
      skipped: documents.length - vectors.length,
    });

    // Upsert in batches of 100 with retry logic
    let indexed = 0;
    const upsertBatchSize = 100;
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let i = 0; i < vectors.length; i += upsertBatchSize) {
      const batch = vectors.slice(i, i + upsertBatchSize);

      // Retry logic for batch upsert
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await this.index.namespace(this.namespace).upsert(batch);
          break; // Success
        } catch (retryError) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
            logger.warn(`Pinecone upsert failed, retry ${attempt}/${maxRetries} in ${Math.round(delay)}ms`, {
              error: retryError.message,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw retryError;
          }
        }
      }

      indexed += batch.length;

      logger.info('Indexed batch', {
        batch: Math.floor(i / upsertBatchSize) + 1,
        total: Math.ceil(vectors.length / upsertBatchSize),
      });
    }

    logger.info('Indexing complete', { indexed, mode: this.embeddingMode });
    return { indexed, skipped: documents.length - indexed, mode: this.embeddingMode };
  }

  /**
   * Semantic search for relevant knowledge
   */
  async search(query, options = {}) {
    const { topK = 10, filter, minScore = 0.3 } = options;

    if (!this.initialized) {
      const ready = await this.initialize();
      if (!ready) {
        return [];
      }
    }

    // Normalize query for consistent caching
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${normalizedQuery}:${this.embeddingMode}`;

    // Check cache first - huge speedup for repeated queries!
    let queryVector = this.queryCache.get(cacheKey);

    if (!queryVector) {
      // Get query embedding (async for OpenAI/Azure, sync for local)
      const isCloudEmbedding =
        this.embeddingMode === 'openai' || this.embeddingMode === 'azure-openai';

      if (isCloudEmbedding) {
        try {
          queryVector = await this.embedder.embed(normalizedQuery);
        } catch (error) {
          logger.warn('Primary cloud query embedding failed', { error: error.message });

          // Try fallback to OpenAI if Azure failed and OpenAI is available
          if (this.embeddingMode === 'azure-openai' && this.openaiEmbedder.isAvailable()) {
            try {
              logger.info('Attempting fallback to OpenAI for query embedding');
              queryVector = await this.openaiEmbedder.embed(normalizedQuery);
            } catch (fallbackError) {
              logger.error('OpenAI fallback also failed, using local', {
                error: fallbackError.message,
              });
              queryVector = this.localEmbedder.embed(normalizedQuery);
            }
          } else {
            queryVector = this.localEmbedder.embed(normalizedQuery);
          }
        }
      } else {
        queryVector = this.localEmbedder.embed(normalizedQuery);
      }

      // Cache the embedding for future use
      this.queryCache.set(cacheKey, queryVector);
    } else {
      logger.debug('Query embedding cache hit', { query: normalizedQuery });
    }

    try {
      const queryOptions = {
        vector: queryVector,
        topK,
        includeMetadata: true,
      };

      // Only add filter if it has keys (Pinecone requires non-empty filter)
      if (filter && Object.keys(filter).length > 0) {
        queryOptions.filter = filter;
      }

      // Retry logic for Pinecone queries
      let results;
      const maxRetries = 3;
      const baseDelay = 1000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          results = await this.index.namespace(this.namespace).query(queryOptions);
          break; // Success - exit retry loop
        } catch (retryError) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
            logger.warn(`Pinecone query failed, retry ${attempt}/${maxRetries} in ${Math.round(delay)}ms`, {
              error: retryError.message,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw retryError; // Rethrow on last attempt
          }
        }
      }

      return (results.matches || [])
        .filter((match) => match.score >= minScore)
        .map((match) => ({
          id: match.id,
          score: match.score,
          title: match.metadata?.title,
          category: match.metadata?.category,
          source: match.metadata?.source,
          version: match.metadata?.version,
          preview: match.metadata?.preview,
        }));
    } catch (error) {
      logger.error('Search failed', { error: error.message });
      return [];
    }
  }

  /**
   * Index a single document - used for auto-indexing new knowledge entries
   * This is more efficient than re-indexing everything when adding one item.
   *
   * @param {Object} doc - Document with title, content, category, source
   * @returns {Object} - { success: boolean, id?: string, error?: string }
   */
  async indexSingleDocument(doc) {
    if (!this.initialized) {
      const ready = await this.initialize();
      if (!ready) {
        return { success: false, error: 'VectorStore not initialized' };
      }
    }

    // Validate document
    const text = doc.content || doc.text || '';
    if (!text || text.length < 20) {
      return { success: false, error: 'Document content too short' };
    }

    try {
      // Truncate to avoid token limits (6000 chars ≈ 1500 tokens, safe for 8192 limit)
      const MAX_CHARS = 6000;
      const fullText = `${doc.title || ''} ${text}`.trim();
      const textToEmbed =
        fullText.length > MAX_CHARS ? fullText.slice(0, MAX_CHARS) + '...' : fullText;

      const isCloudEmbedding =
        this.embeddingMode === 'openai' || this.embeddingMode === 'azure-openai';

      // Only use cloud embeddings for indexing (to match Pinecone's 1536 dimension)
      if (!isCloudEmbedding) {
        return {
          success: false,
          error: 'Cloud embeddings required for indexing (dimension mismatch with local)',
        };
      }

      let embedding;
      try {
        embedding = await this.embedder.embed(textToEmbed);
      } catch (error) {
        // Try fallback to OpenAI if Azure fails
        if (this.embeddingMode === 'azure-openai' && this.openaiEmbedder.isAvailable()) {
          try {
            embedding = await this.openaiEmbedder.embed(textToEmbed);
          } catch (fallbackError) {
            return { success: false, error: `Embedding failed: ${fallbackError.message}` };
          }
        } else {
          return { success: false, error: `Embedding failed: ${error.message}` };
        }
      }

      // Check if vector has content
      const hasContent = embedding.some((v) => v !== 0);
      if (!hasContent) {
        return { success: false, error: 'Generated embedding has no content' };
      }

      // Create vector object
      const id = this.generateId(doc);
      const vector = {
        id,
        values: embedding,
        metadata: {
          title: doc.title?.slice(0, 500) || '',
          category: doc.category || 'general',
          source: doc.source || 'knowledge-base',
          version: doc.version || 'unknown',
          preview: text.slice(0, 200),
        },
      };

      // Upsert single vector with retry logic
      const maxRetries = 3;
      const baseDelay = 1000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await this.index.namespace(this.namespace).upsert([vector]);
          break; // Success
        } catch (retryError) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
            logger.warn(`Pinecone single upsert failed, retry ${attempt}/${maxRetries} in ${Math.round(delay)}ms`, {
              error: retryError.message,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw retryError;
          }
        }
      }

      logger.info('Single document indexed', { id, title: doc.title });
      return { success: true, id };
    } catch (error) {
      logger.error('Failed to index single document', { error: error.message, title: doc.title });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stats about the vector index
   */
  async getStats() {
    if (!this.initialized) {
      return { status: 'not_initialized', vectors: 0 };
    }

    try {
      const stats = await this.index.describeIndexStats();
      return {
        status: 'ready',
        vectors: stats.totalRecordCount || 0,
        namespaces: stats.namespaces || {},
        dimension: this.dimension,
        embeddingMode: this.embeddingMode,
        queryCache: this.queryCache.getStats(),
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Delete all vectors (for re-indexing)
   */
  async clear() {
    if (!this.initialized) return;

    try {
      await this.index.namespace(this.namespace).deleteAll();
      this.queryCache.clear(); // Clear cache on re-index
      logger.info('Vector store cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear vector store', { error: error.message });
      return false;
    }
  }

  /**
   * Graceful shutdown - save embedding cache to disk
   * Call this before server shutdown to persist cache
   */
  shutdown() {
    logger.info('VectorStore shutting down, saving embedding cache...');
    this.queryCache.shutdown();
  }
}
