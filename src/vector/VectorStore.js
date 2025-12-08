/**
 * VectorStore - Pinecone-based semantic search for Mendix knowledge
 *
 * Supports three embedding modes:
 * 1. Azure OpenAI text-embedding-ada-002 (1536 dims) - Best quality, requires Azure key
 * 2. OpenAI text-embedding-3-small (1536 dims) - Best quality, requires API key
 * 3. Local TF-IDF (384 dims) - Free fallback, decent quality
 *
 * @version 2.4.0
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';
import Logger from '../utils/logger.js';

const logger = new Logger('VectorStore');

/**
 * Azure OpenAI Embeddings - High quality semantic embeddings via Azure
 */
class AzureOpenAIEmbedder {
  constructor() {
    this.dimension = 1536; // text-embedding-ada-002 dimension
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://api.openai.azure.com';
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
 */
class OpenAIEmbedder {
  constructor() {
    this.dimension = 1536; // text-embedding-3-small dimension
    this.model = 'text-embedding-3-small';
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
      throw new Error('OpenAI API key not configured');
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
    this.indexName = options.indexName || 'mendix-knowledge';
    this.namespace = options.namespace || 'default';

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
      logger.info('Using OpenAI embeddings (high quality)');
    } else {
      this.embedder = this.localEmbedder;
      this.dimension = 384;
      this.embeddingMode = 'local';
      logger.info('Using local TF-IDF embeddings (no OpenAI key found)');
    }

    this.pinecone = null;
    this.index = null;
    this.initialized = false;

    logger.info('VectorStore created', {
      indexName: this.indexName,
      embeddingMode: this.embeddingMode,
    });
  }

  /**
   * Initialize Pinecone connection
   */
  async initialize() {
    if (this.initialized) return;

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      logger.warn('No Pinecone API key found, vector search disabled');
      return false;
    }

    try {
      this.pinecone = new Pinecone({ apiKey });

      // Check if index exists, create if not
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some((i) => i.name === this.indexName);

      if (!indexExists) {
        logger.info('Creating Pinecone index', { name: this.indexName });
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndex();
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
      const texts = batch.map((doc) => doc.content || doc.text || doc.title);

      let embeddings;
      if (isCloudEmbedding) {
        // Batch embedding for OpenAI/Azure (faster)
        try {
          embeddings = await this.embedder.embedBatch(texts);
        } catch (error) {
          logger.error('Cloud embedding failed, falling back to local', { error: error.message });
          // Fall back to local for this batch
          this.localEmbedder.buildVocabulary(batch);
          embeddings = texts.map((t) => this.localEmbedder.embed(t));
        }
      } else {
        // Local embeddings (synchronous)
        embeddings = texts.map((t) => this.localEmbedder.embed(t));
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

    // Upsert in batches of 100
    let indexed = 0;
    const upsertBatchSize = 100;

    for (let i = 0; i < vectors.length; i += upsertBatchSize) {
      const batch = vectors.slice(i, i + upsertBatchSize);
      await this.index.namespace(this.namespace).upsert(batch);
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

    // Get query embedding (async for OpenAI/Azure, sync for local)
    let queryVector;
    const isCloudEmbedding =
      this.embeddingMode === 'openai' || this.embeddingMode === 'azure-openai';

    if (isCloudEmbedding) {
      try {
        queryVector = await this.embedder.embed(query);
      } catch (error) {
        logger.warn('Cloud query embedding failed, using local', { error: error.message });
        queryVector = this.localEmbedder.embed(query);
      }
    } else {
      queryVector = this.localEmbedder.embed(query);
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

      const results = await this.index.namespace(this.namespace).query(queryOptions);

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
      logger.info('Vector store cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear vector store', { error: error.message });
      return false;
    }
  }
}
