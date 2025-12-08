/**
 * Final comparison test - keyword vs hybrid with Azure OpenAI
 */
import dotenv from 'dotenv';
dotenv.config();

import SearchEngine from './src/core/SearchEngine.js';
import HybridSearch from './src/vector/HybridSearch.js';
import KnowledgeManager from './src/core/KnowledgeManager.js';

async function test() {
  const km = new KnowledgeManager();
  await km.load();
  
  // Keyword-only
  const keyword = new SearchEngine();
  keyword.indexKnowledgeBase(km.knowledgeBase);
  
  // Hybrid - only index keywords, vectors already in Pinecone
  const hybrid = new HybridSearch();
  await hybrid.initialize();
  hybrid.keywordEngine.indexKnowledgeBase(km.knowledgeBase);
  
  console.log('\n=== SEARCH COMPARISON ===');
  console.log('Embedding mode:', hybrid.vectorStore.embeddingMode);
  console.log('Weights: keyword=' + hybrid.keywordWeight + ', vector=' + hybrid.vectorWeight);
  console.log('\n');
  
  const tests = [
    { q: 'loop through objects', expect: 'iterate/loop patterns' },
    { q: 'make app faster', expect: 'performance optimization' },
    { q: 'deploy to cloud', expect: 'deployment/Mendix Cloud' },
    { q: 'data validation', expect: 'validation/xpath' },
    { q: 'create user interface', expect: 'pages/widgets' },
  ];
  
  for (const t of tests) {
    console.log(`Query: "${t.q}"`);
    console.log(`  Expected: ${t.expect}`);
    
    const kw = keyword.search(t.q, { maxResults: 1 });
    const hy = await hybrid.search(t.q, { limit: 1 });
    
    const kwTitle = kw[0]?.entry?.topic || kw[0]?.entry?.title || kw[0]?.entry?.practice || 'No results';
    const hyTitle = hy[0]?.title || 'No results';
    const hyType = hy[0]?.matchType || hy[0]?.sources?.join('+') || '?';
    
    console.log(`  KEYWORD: ${kwTitle.substring(0, 55)}`);
    console.log(`  HYBRID:  ${hyTitle.substring(0, 55)} [${hyType}]`);
    
    // Did hybrid find something better?
    const better = kwTitle === 'No results' && hyTitle !== 'No results';
    if (better) console.log(`  ⭐ HYBRID FOUND RESULT WHERE KEYWORD FAILED!`);
    console.log();
  }
  
  // Show stats
  const stats = await hybrid.getStats();
  console.log('=== FINAL STATS ===');
  console.log('Vectors in Pinecone:', stats.vector.vectors);
  console.log('Dimension:', stats.vector.dimension);
}

test().catch(console.error);
