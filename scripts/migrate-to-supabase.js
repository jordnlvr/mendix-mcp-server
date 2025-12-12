#!/usr/bin/env node
/**
 * Migrate JSON Knowledge to Supabase
 *
 * This script loads all existing JSON knowledge files and inserts them
 * into Supabase. Run this once after setting up the Supabase schema.
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_ANON_KEY - Your Supabase anon/public key
 *
 * @version 1.0.0
 */

import crypto from 'crypto';
import { config } from 'dotenv';
import { readdir, readFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const KNOWLEDGE_DIR = join(__dirname, '..', 'knowledge');

// Stats
const stats = {
  filesProcessed: 0,
  entriesFound: 0,
  entriesInserted: 0,
  entriesSkipped: 0,
  errors: [],
};

/**
 * Make a request to Supabase REST API
 */
async function supabaseFetch(path, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;

  const options = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return response;
}

/**
 * Generate content hash for deduplication
 */
function generateHash(title, content) {
  const normalized = `${title.toLowerCase().trim()}:${content.toLowerCase().trim()}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Convert various JSON entry formats to standard schema
 */
function normalizeEntry(entry, category, filename) {
  // Handle different JSON structures
  let title,
    content,
    tags = [];

  if (typeof entry === 'string') {
    // Simple string entry
    title = entry.substring(0, 100);
    content = entry;
  } else if (entry.title && entry.content) {
    // Standard format
    title = entry.title;
    content = entry.content;
    tags = entry.tags || [];
  } else if (entry.name && entry.description) {
    // API/reference format
    title = entry.name;
    content = entry.description;
    if (entry.example) content += `\n\nExample:\n${entry.example}`;
    if (entry.usage) content += `\n\nUsage:\n${entry.usage}`;
  } else if (entry.topic && entry.explanation) {
    // Topic format
    title = entry.topic;
    content = entry.explanation;
  } else if (entry.question && entry.answer) {
    // Q&A format
    title = entry.question;
    content = entry.answer;
  } else if (entry.id && entry.text) {
    // ID-text format
    title = entry.id;
    content = entry.text;
  } else {
    // Try to extract something useful
    const keys = Object.keys(entry);
    if (keys.length > 0) {
      title = entry[keys[0]]?.toString().substring(0, 100) || 'Untitled';
      content = JSON.stringify(entry, null, 2);
    } else {
      return null;
    }
  }

  // Ensure content is string
  if (typeof content !== 'string') {
    content = JSON.stringify(content, null, 2);
  }

  return {
    title: title.substring(0, 500), // Limit title length
    content: content,
    category: category,
    source: `json:${filename}`,
    tags: tags,
    quality_score: entry.quality_score || entry.qualityScore || 0.5,
    learned_from: 'migration',
    content_hash: generateHash(title, content),
  };
}

/**
 * Process a single JSON knowledge file
 */
async function processFile(filepath) {
  const filename = basename(filepath, '.json');
  console.log(`\n📄 Processing: ${filename}`);

  try {
    const content = await readFile(filepath, 'utf-8');
    const data = JSON.parse(content);

    // Determine entries array from various formats
    let entries = [];

    if (Array.isArray(data)) {
      entries = data;
    } else if (data.entries && Array.isArray(data.entries)) {
      entries = data.entries;
    } else if (data.knowledge && Array.isArray(data.knowledge)) {
      entries = data.knowledge;
    } else if (data.items && Array.isArray(data.items)) {
      entries = data.items;
    } else if (typeof data === 'object') {
      // Object with named entries
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          entries.push({ ...value, _key: key });
        } else if (typeof value === 'string') {
          entries.push({ title: key, content: value });
        }
      }
    }

    console.log(`   Found ${entries.length} entries`);
    stats.entriesFound += entries.length;

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const normalized = batch
        .map((e) => normalizeEntry(e, filename, filename))
        .filter((e) => e !== null && e.content.length > 10);

      if (normalized.length === 0) continue;

      // Insert batch
      const response = await supabaseFetch('/knowledge', 'POST', normalized);

      if (response.ok) {
        const inserted = await response.json();
        stats.entriesInserted += inserted.length;
        process.stdout.write(
          `   ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${inserted.length} entries)\n`
        );
      } else {
        const error = await response.text();

        // Handle duplicate key errors by inserting one by one
        if (error.includes('duplicate key') || error.includes('content_hash')) {
          console.log(`   ⚠️ Batch has duplicates, inserting individually...`);

          for (const entry of normalized) {
            const singleResponse = await supabaseFetch('/knowledge', 'POST', entry);
            if (singleResponse.ok) {
              stats.entriesInserted++;
            } else {
              stats.entriesSkipped++;
            }
          }
        } else {
          console.error(`   ❌ Batch insert failed: ${error.substring(0, 200)}`);
          stats.errors.push({ file: filename, batch: i, error: error.substring(0, 200) });
        }
      }
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`   ❌ Error processing file: ${error.message}`);
    stats.errors.push({ file: filename, error: error.message });
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Mendix Knowledge Migration to Supabase');
  console.log('=========================================\n');

  // Verify environment
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('   Set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
    process.exit(1);
  }

  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📁 Knowledge dir: ${KNOWLEDGE_DIR}`);

  // Test connection
  console.log('\n🔌 Testing Supabase connection...');
  try {
    const response = await supabaseFetch('/knowledge?select=count');
    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status}`);
    }
    const data = await response.json();
    console.log(`   ✅ Connected! Current entries: ${data[0]?.count || 0}`);
  } catch (error) {
    console.error(`   ❌ Connection failed: ${error.message}`);
    console.error('   Make sure you ran the schema SQL in Supabase first!');
    process.exit(1);
  }

  // Get all JSON files
  console.log('\n📂 Scanning knowledge directory...');
  const files = await readdir(KNOWLEDGE_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  console.log(`   Found ${jsonFiles.length} JSON files`);

  // Process each file
  for (const file of jsonFiles) {
    await processFile(join(KNOWLEDGE_DIR, file));
  }

  // Summary
  console.log('\n=========================================');
  console.log('📊 Migration Summary');
  console.log('=========================================');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Entries found:   ${stats.entriesFound}`);
  console.log(`   Entries inserted: ${stats.entriesInserted}`);
  console.log(`   Entries skipped:  ${stats.entriesSkipped}`);
  console.log(`   Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`   - ${err.file}: ${err.error}`);
    }
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }

  // Verify final count
  const finalResponse = await supabaseFetch('/knowledge?select=count');
  const finalData = await finalResponse.json();
  console.log(`\n✅ Final Supabase knowledge count: ${finalData[0]?.count || 0}`);
}

// Run migration
migrate().catch(console.error);
