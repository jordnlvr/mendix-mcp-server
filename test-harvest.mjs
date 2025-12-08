/**
 * Test harvest script - Quick test to verify harvester works
 */

import KnowledgeHarvester, { PRIORITY_TOPICS } from './src/harvester/KnowledgeHarvester.js';

async function runQuickHarvest() {
  console.log('=== MENDIX KNOWLEDGE HARVESTER TEST ===\n');

  const harvester = new KnowledgeHarvester();

  console.log('Priority Topics Count:', PRIORITY_TOPICS.length);
  console.log('Sample Topics:', PRIORITY_TOPICS.slice(0, 10).join(', '));
  console.log('\nAvailable Sources:');
  harvester.getSources().forEach((s) => console.log(`  - ${s.name} (${s.priority})`));

  console.log('\n--- Starting Quick Harvest (5 pages max) ---\n');

  try {
    const results = await harvester.harvest({
      maxPages: 5,
      priorityFirst: true,
      verbose: true,
    });

    console.log('\n=== HARVEST COMPLETE ===');
    console.log('Results:', harvester.getStats());
  } catch (error) {
    console.error('Harvest failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

runQuickHarvest();
