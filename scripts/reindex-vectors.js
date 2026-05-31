#!/usr/bin/env node
/**
 * Vector Reindex Script
 *
 * Reindexes all knowledge base entries into Pinecone for semantic search.
 * Run this after updating knowledge JSON files to ensure vectors are in sync.
 *
 * Prerequisites:
 * - PINECONE_API_KEY environment variable
 * - AZURE_OPENAI_* or OPENAI_API_KEY for embeddings
 *
 * Usage:
 *   node scripts/reindex-vectors.js [--force] [--file=filename.json]
 *
 * Options:
 *   --force    Clear all vectors and reindex from scratch
 *   --file     Only reindex a specific knowledge file
 *   --dry-run  Show what would be indexed without doing it
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Strip JSON comments properly without corrupting strings
// Handles line and block comments outside of quoted strings
function stripJsonComments(jsonString) {
  let result = '';
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let i = 0;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = jsonString[i + 1];

    // Handle string boundaries (respecting escape sequences)
    if (!inSingleLineComment && !inMultiLineComment) {
      if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }
    }

    // Inside a string - pass through everything
    if (inString) {
      result += char;
      i++;
      continue;
    }

    // Check for comment starts
    if (!inSingleLineComment && !inMultiLineComment) {
      if (char === '/' && nextChar === '/') {
        inSingleLineComment = true;
        i += 2;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        i += 2;
        continue;
      }
    }

    // Check for comment ends
    if (inSingleLineComment && (char === '\n' || char === '\r')) {
      inSingleLineComment = false;
      result += char; // Keep the newline
      i++;
      continue;
    }
    if (inMultiLineComment && char === '*' && nextChar === '/') {
      inMultiLineComment = false;
      i += 2;
      continue;
    }

    // Skip characters inside comments
    if (inSingleLineComment || inMultiLineComment) {
      i++;
      continue;
    }

    // Regular character - add to result
    result += char;
    i++;
  }

  return result;
}

// Parse command line args
const args = process.argv.slice(2);
const flags = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  file: args.find((a) => a.startsWith('--file='))?.split('=')[1],
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Vector Reindex Script
=====================

Reindexes knowledge base entries into Pinecone for semantic search.

Usage:
  node scripts/reindex-vectors.js [options]

Options:
  --force     Clear all vectors and reindex from scratch
  --file=X    Only reindex a specific knowledge file (e.g., --file=theme-analysis.json)
  --dry-run   Show what would be indexed without doing it
  --help, -h  Show this help message

Environment Variables:
  PINECONE_API_KEY                Required for Pinecone
  AZURE_OPENAI_API_KEY            For Azure embeddings
  AZURE_OPENAI_ENDPOINT           Azure endpoint URL
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT  Deployment name (default: text-embedding-ada-002)
  OPENAI_API_KEY                  Alternative: use OpenAI directly

Examples:
  # Reindex everything
  node scripts/reindex-vectors.js

  # Force full reindex (clears existing vectors)
  node scripts/reindex-vectors.js --force

  # Reindex just the theme analysis knowledge
  node scripts/reindex-vectors.js --file=theme-analysis.json

  # Preview what would be indexed
  node scripts/reindex-vectors.js --dry-run
`);
  process.exit(0);
}

async function main() {
  console.log('🔄 Vector Reindex Script');
  console.log('========================\n');

  // Check environment
  const hasAzure = process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT;
  const hasOpenAI = process.env.OPENAI_API_KEY;
  const hasPinecone = process.env.PINECONE_API_KEY;

  console.log('📋 Environment Check:');
  console.log(`   Pinecone API Key: ${hasPinecone ? '✅' : '❌ Missing PINECONE_API_KEY'}`);
  console.log(`   Azure OpenAI: ${hasAzure ? '✅' : '⚠️ Not configured'}`);
  console.log(`   OpenAI: ${hasOpenAI ? '✅' : '⚠️ Not configured'}`);
  console.log();

  if (!hasPinecone) {
    console.error('❌ PINECONE_API_KEY is required for vector indexing');
    process.exit(1);
  }

  if (!hasAzure && !hasOpenAI) {
    console.warn('⚠️ No embedding API configured - will use local TF-IDF fallback');
    console.warn('   For better semantic search, set AZURE_OPENAI_* or OPENAI_API_KEY\n');
  }

  // Load knowledge files
  const knowledgePath = path.join(ROOT, 'knowledge');
  let files = await fs.readdir(knowledgePath);
  files = files.filter((f) => f.endsWith('.json') && !f.includes('harvest-'));

  if (flags.file) {
    if (!files.includes(flags.file)) {
      console.error(`❌ File not found: ${flags.file}`);
      console.log(`   Available files: ${files.join(', ')}`);
      process.exit(1);
    }
    files = [flags.file];
  }

  console.log(`📚 Knowledge files to index: ${files.length}`);
  files.forEach((f) => console.log(`   - ${f}`));
  console.log();

  // Load and count entries
  let totalEntries = 0;
  const fileStats = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(knowledgePath, file), 'utf8');

      // Try parsing directly first, only strip comments if needed
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        const cleanContent = stripJsonComments(content);
        data = JSON.parse(cleanContent);
      }

      const entryCount = countEntries(data);
      totalEntries += entryCount;
      fileStats.push({ file, entries: entryCount });
    } catch (err) {
      console.warn(`   ⚠️ Could not parse ${file}: ${err.message}`);
    }
  }

  console.log(`📊 Total entries to index: ${totalEntries}`);
  fileStats.forEach(({ file, entries }) => {
    console.log(`   ${file}: ${entries} entries`);
  });
  console.log();

  if (flags.dryRun) {
    console.log('🔍 Dry run complete - no changes made');
    return;
  }

  // Import VectorStore
  console.log('🔌 Initializing VectorStore...');
  const { default: VectorStore } = await import('../src/vector/VectorStore.js');
  const vectorStore = new VectorStore();

  // Initialize (connects to Pinecone)
  await vectorStore.initialize();
  console.log('   Connected to Pinecone ✅\n');

  // Force clear if requested
  if (flags.force) {
    console.log('🗑️ Force flag set - clearing existing vectors...');
    // Note: Actual clear implementation depends on VectorStore API
    console.log('   (Clear not implemented - vectors will be upserted)\n');
  }

  // Index each file
  console.log('📤 Indexing knowledge entries...\n');

  for (const file of files) {
    console.log(`   Processing ${file}...`);
    try {
      const content = await fs.readFile(path.join(knowledgePath, file), 'utf8');

      // Try parsing directly first, only strip comments if needed
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        // Only strip comments if direct parse fails
        const cleanContent = stripJsonComments(content);
        data = JSON.parse(cleanContent);
      }

      // Extract indexable entries
      const entries = extractEntries(data, file);

      // Batch upsert to Pinecone
      if (entries.length > 0) {
        await vectorStore.indexDocuments(entries);
        console.log(`   ✅ Indexed ${entries.length} entries from ${file}`);
      }
    } catch (err) {
      console.error(`   ❌ Failed to index ${file}: ${err.message}`);
    }
  }

  // Get final stats
  console.log('\n📊 Final Statistics:');
  const stats = await vectorStore.getStats();
  console.log(`   Total vectors: ${stats.totalVectors || 'unknown'}`);
  console.log(`   Index status: ${stats.status || 'ready'}`);
  console.log(`   Embedding provider: ${stats.embeddingProvider || 'unknown'}`);

  console.log('\n✅ Reindex complete!');
}

/**
 * Count entries in a knowledge object (recursive)
 */
function countEntries(obj, depth = 0) {
  if (depth > 10) return 0; // Prevent infinite recursion

  let count = 0;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        // Count arrays of objects as entries
        if (item.id || item.rule || item.title || item.name || item.pattern) {
          count++;
        }
        count += countEntries(item, depth + 1);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    // Check if this object itself is an entry
    if (obj.rules && Array.isArray(obj.rules)) {
      count += obj.rules.length;
    }
    if (obj.entries && Array.isArray(obj.entries)) {
      count += obj.entries.length;
    }
    if (obj.patterns && Array.isArray(obj.patterns)) {
      count += obj.patterns.length;
    }

    // Recurse into nested objects
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object') {
        count += countEntries(obj[key], depth + 1);
      }
    }
  }

  return count;
}

/**
 * Extract indexable entries from knowledge data
 */
function extractEntries(data, filename) {
  const entries = [];
  const category = filename.replace('.json', '');

  function extract(obj, path = '') {
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          extract(item, `${path}[${i}]`);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      // Check if this is an indexable entry
      const hasContent = obj.rule || obj.description || obj.content || obj.summary;
      const hasId = obj.id || obj.name || obj.title;

      if (hasContent && hasId) {
        entries.push({
          id: `${category}:${obj.id || obj.name || path}`,
          category,
          title: obj.title || obj.name || obj.rule || '',
          content: obj.description || obj.content || obj.rule || obj.summary || '',
          source: filename,
          metadata: {
            severity: obj.severity,
            importance: obj.importance,
            path,
          },
        });
      }

      // Recurse
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          extract(obj[key], path ? `${path}.${key}` : key);
        }
      }
    }
  }

  extract(data);
  return entries;
}

// Run
main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
