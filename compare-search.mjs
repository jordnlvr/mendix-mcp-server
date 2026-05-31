/**
 * Compare keyword-only vs hybrid search
 */
import dotenv from 'dotenv';
dotenv.config();

import KnowledgeManager from './src/core/KnowledgeManager.js';
import SearchEngine from './src/core/SearchEngine.js';
import HybridSearch from './src/vector/HybridSearch.js';

async function compare() {
  const km = new KnowledgeManager();
  await km.load();

  // Keyword-only engine
  const keyword = new SearchEngine();
  keyword.indexKnowledgeBase(km.knowledgeBase);

  // Hybrid engine (keyword + vector)
  const hybrid = new HybridSearch();
  await hybrid.initialize();
  await hybrid.indexKnowledgeBase(km.knowledgeBase);

  // Test semantic understanding - queries that DON'T use exact words
  const tests = [
    { query: 'loop through objects', note: 'iterate/list not mentioned' },
    { query: 'REST API security', note: 'authentication not mentioned' },
    { query: 'make app faster', note: 'performance not mentioned' },
    { query: 'data validation rules', note: 'xpath/constraints not mentioned' },
    { query: 'deploy to cloud', note: 'mendix cloud not mentioned' },
  ];

  console.log('=== KEYWORD vs HYBRID COMPARISON ===');
  console.log('(Testing semantic understanding with indirect queries)\n');

  for (const t of tests) {
    console.log(`Query: "${t.query}" (${t.note})`);

    const kwResults = keyword.search(t.query, { maxResults: 1 });
    const hyResults = await hybrid.search(t.query, { limit: 1 });

    const kwTitle =
      kwResults[0]?.entry?.topic ||
      kwResults[0]?.entry?.title ||
      kwResults[0]?.entry?.practice ||
      kwResults[0]?.entry?.pattern_name ||
      'No results';
    const hyTitle = hyResults[0]?.title || 'No results';
    const hySource = hyResults[0]?.sources?.join('+') || '?';

    console.log(`  KEYWORD: ${kwTitle.substring(0, 50)}`);
    console.log(`  HYBRID:  ${hyTitle.substring(0, 50)} [${hySource}]`);
    console.log();
  }

  // Stats
  const stats = await hybrid.getStats();
  console.log('=== VECTOR STORE STATS ===');
  console.log(`Vectors indexed: ${stats.vector.vectors}`);
  console.log(`Keyword terms: ${stats.keyword.indexed}`);
  console.log(`Weights: keyword=${stats.weights.keyword}, vector=${stats.weights.vector}`);
}

compare().catch(console.error);
