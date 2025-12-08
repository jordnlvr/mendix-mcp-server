/**
 * VectorStore - Pinecone-based semantic search for Mendix knowledge
 * 
 * Uses TF-IDF based dense vectors for semantic search without external APIs.
 * Can be upgraded to use OpenAI embeddings later for better quality.
 * 
 * @version 2.3.0
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';
import { Logger } from '../utils/Logger.js';

const logger = new Logger('VectorStore');

/**
 * Simple but effective local embedding using weighted term vectors
 * This avoids needing an external embedding API
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
    const sortedTerms = [...docFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.dimension);

    let idx = 0;
    for (const [term, freq] of sortedTerms) {
      this.vocabulary.set(term, idx++);
      this.idf.set(term, Math.log(this.docCount / (freq + 1)) + 1);
    }

    logger.info('Vocabulary built', { 
      terms: this.vocabulary.size, 
      documents: this.docCount 
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
      .filter(t => t.length > 2)
      .map(t => this.stem(t));
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
    this.dimension = 384;
    this.embedder = new LocalEmbedder();
    this.pinecone = null;
    this.index = null;
    this.initialized = false;
    
    logger.info('VectorStore created', { indexName: this.indexName });
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
      const indexExists = indexes.indexes?.some(i => i.name === this.indexName);

      if (!indexExists) {
        logger.info('Creating Pinecone index', { name: this.indexName });
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
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
      await new Promise(r => setTimeout(r, 2000));
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

    // Build vocabulary from all documents
    this.embedder.buildVocabulary(documents);

    // Prepare vectors for upsert
    const vectors = documents.map(doc => ({
      id: this.generateId(doc),
      values: this.embedder.embed(doc.content || doc.text || doc.title),
      metadata: {
        title: doc.title?.slice(0, 500) || '',
        category: doc.category || 'general',
        source: doc.source || 'knowledge-base',
        version: doc.version || 'unknown',
        preview: (doc.content || doc.text || '').slice(0, 200)
      }
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    let indexed = 0;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.index.namespace(this.namespace).upsert(batch);
      indexed += batch.length;
      
      logger.info('Indexed batch', { 
        batch: Math.floor(i / batchSize) + 1, 
        total: Math.ceil(vectors.length / batchSize) 
      });
    }

    logger.info('Indexing complete', { indexed });
    return { indexed, skipped: 0 };
  }

  /**
   * Semantic search for relevant knowledge
   */
  async search(query, options = {}) {
    const { topK = 10, filter = {}, minScore = 0.3 } = options;

    if (!this.initialized) {
      const ready = await this.initialize();
      if (!ready) {
        return [];
      }
    }

    const queryVector = this.embedder.embed(query);

    try {
      const results = await this.index.namespace(this.namespace).query({
        vector: queryVector,
        topK,
        filter,
        includeMetadata: true
      });

      return (results.matches || [])
        .filter(match => match.score >= minScore)
        .map(match => ({
          id: match.id,
          score: match.score,
          title: match.metadata?.title,
          category: match.metadata?.category,
          source: match.metadata?.source,
          version: match.metadata?.version,
          preview: match.metadata?.preview
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
        dimension: this.dimension
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
