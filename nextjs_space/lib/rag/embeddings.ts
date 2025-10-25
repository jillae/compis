
/**
 * RAG Embeddings Library
 * Generate and manage embeddings for semantic search
 */

import OpenAI from 'openai';

// Use OpenAI API for embeddings
// Note: Configure OPENAI_API_KEY in .env to enable RAG embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

/**
 * Generate embedding vector for text using OpenAI/Abacus AI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002', // 1536 dimensions, optimized for Swedish
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    throw error;
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar chunks using cosine similarity
 */
export function findMostSimilar(
  queryEmbedding: number[],
  chunks: Array<{ embedding: number[]; content: string }>,
  topK: number = 5
): Array<{ content: string; similarity: number }> {
  const similarities = chunks.map((chunk) => ({
    content: chunk.content,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
