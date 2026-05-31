/**
 * Test both embedding providers
 */
import dotenv from 'dotenv';
dotenv.config();

// Test query
const testQuery = 'how to create a microflow that iterates through a list of entities in mendix';

async function testAzure() {
  const { default: VectorStore } = await import('./src/vector/VectorStore.js');
  const vs = new VectorStore();

  console.log('=== AZURE OPENAI ===');
  console.log('Endpoint:', vs.azureEmbedder.endpoint);
  console.log('Deployment:', vs.azureEmbedder.deploymentName);

  const start = Date.now();
  const result = await vs.azureEmbedder.embed(testQuery);
  const time = Date.now() - start;

  console.log('Vector length:', result.length);
  console.log('Time:', time, 'ms');
  return { time, result };
}

async function testOpenAI() {
  const { default: VectorStore } = await import('./src/vector/VectorStore.js');
  const vs = new VectorStore();

  console.log('\n=== STANDARD OPENAI ===');
  console.log('Model:', vs.openaiEmbedder.model);

  const start = Date.now();
  const result = await vs.openaiEmbedder.embed(testQuery);
  const time = Date.now() - start;

  console.log('Vector length:', result.length);
  console.log('Time:', time, 'ms');
  return { time, result };
}

async function main() {
  console.log('Query:', testQuery);
  console.log('');

  try {
    const azure = await testAzure();
    const openai = await testOpenAI();

    console.log('\n=== COMPARISON ===');
    console.log('Azure time:', azure.time, 'ms');
    console.log('OpenAI time:', openai.time, 'ms');
    console.log('Faster:', azure.time < openai.time ? 'Azure' : 'OpenAI');

    // Calculate cosine similarity between the two embeddings
    const dot = azure.result.reduce((sum, a, i) => sum + a * openai.result[i], 0);
    const magA = Math.sqrt(azure.result.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(openai.result.reduce((sum, b) => sum + b * b, 0));
    const similarity = dot / (magA * magB);

    console.log(
      'Similarity between Azure & OpenAI embeddings:',
      (similarity * 100).toFixed(2) + '%'
    );
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
