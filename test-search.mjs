/**
 * Test hybrid search with diverse queries
 */
import dotenv from 'dotenv';
dotenv.config();

import KnowledgeManager from './src/core/KnowledgeManager.js';
import HybridSearch from './src/vector/HybridSearch.js';

async function testSearch() {
  const km = new KnowledgeManager();
  await km.load();

  const hs = new HybridSearch();
  await hs.initialize();
  await hs.indexKnowledgeBase(km.knowledgeBase);

  // Test queries - diverse topics
  const queries = [
    'how to iterate through a list of entities',
    'maia ai assistant features',
    'design tokens atlas ui 3',
    'native mobile offline first',
    'platform sdk create microflow',
  ];

  console.log('\n=== CHECKING VECTOR STORE STATE ===');
  console.log('VectorStore initialized:', hs.vectorStore.initialized);
  console.log('VectorStore index:', hs.vectorStore.index ? 'exists' : 'null');

  // Direct vector search test
  console.log('\n=== DIRECT VECTOR SEARCH TEST ===');
  const directResults = await hs.vectorStore.search('iterate list entities', {
    topK: 3,
    minScore: 0.0,
  });
  console.log('Direct vector results:', directResults.length);
  directResults.forEach((r, i) =>
    console.log(`  ${i + 1}. [${r.score?.toFixed(3)}] ${r.title || r.id}`)
  );

  console.log('\n=== HYBRID SEARCH TEST ===\n');

  for (const q of queries) {
    console.log(`Query: "${q}"`);
    const results = await hs.search(q, { limit: 3 });
    results.forEach((r, i) => {
      const sourceIcon = r.sources?.includes('vector')
        ? '🎯'
        : r.sources?.includes('keyword')
        ? '📝'
        : '❓';
      const sourceText = r.sources?.join('+') || r.source || 'unknown';
      console.log(`  ${i + 1}. ${sourceIcon} [${sourceText}] ${r.title || r.id || 'Untitled'}`);
    });
    console.log();
  }

  console.log('=== STATS ===');
  const stats = await hs.getStats();
  console.log(JSON.stringify(stats.vector, null, 2));
}

testSearch().catch((e) => console.error('Error:', e.message, e.stack));
