const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text) {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: simple hash-based pseudo-embedding for demo
    return fallbackEmbedding(text);
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 256
  });

  return response.data[0].embedding;
}

// Simple fallback when OpenAI key not available
function fallbackEmbedding(text) {
  const vec = new Array(128).fill(0);
  const str = text.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const idx = str.charCodeAt(i) % 128;
    vec[idx] += 1;
  }
  // Normalize
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
  return mag === 0 ? vec : vec.map(v => v / mag);
}

function cosineSimilarity(a, b) {
  const minLen = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < minLen; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

module.exports = { getEmbedding, cosineSimilarity, fallbackEmbedding };
