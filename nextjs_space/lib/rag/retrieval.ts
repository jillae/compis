
/**
 * RAG Retrieval Library
 * Semantic search and context retrieval for AI responses
 */

import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from './embeddings';

const prisma = new PrismaClient();

export interface RetrievalResult {
  content: string;
  contentType: string;
  category?: string;
  serviceName?: string;
  duration?: number;
  price?: number;
  similarity: number;
  sourceUrl?: string;
}

/**
 * Retrieve relevant knowledge chunks for a user query
 */
export async function retrieveContext(
  query: string,
  clinicId: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Convert embedding to Postgres array format
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Semantic search using pgvector cosine similarity
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        content,
        "contentType",
        category,
        "serviceName",
        duration,
        price,
        "sourceUrl",
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM knowledge_chunks
      WHERE "clinicId" = ${clinicId}
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${topK}
    `;

    return results.map((r) => ({
      content: r.content,
      contentType: r.contentType,
      category: r.category,
      serviceName: r.serviceName,
      duration: r.duration,
      price: r.price,
      similarity: r.similarity,
      sourceUrl: r.sourceUrl,
    }));
  } catch (error) {
    console.error('Error retrieving context:', error);
    
    // Fallback to keyword-based search if vector search fails
    return await keywordSearch(query, clinicId, topK);
  }
}

/**
 * Fallback keyword-based search
 */
async function keywordSearch(
  query: string,
  clinicId: string,
  topK: number = 5
): Promise<RetrievalResult[]> {
  const keywords = query.toLowerCase().split(/\s+/);

  const results = await prisma.knowledgeChunk.findMany({
    where: {
      clinicId,
      OR: keywords.map((keyword) => ({
        keywords: {
          has: keyword,
        },
      })),
    },
    take: topK,
    select: {
      content: true,
      contentType: true,
      category: true,
      serviceName: true,
      duration: true,
      price: true,
      sourceUrl: true,
    },
  });

  return results.map((r: any) => ({
    ...r,
    similarity: 0.5, // Default similarity for keyword matches
  }));
}

/**
 * Build context string for AI prompt
 */
export function buildContextPrompt(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return 'Ingen relevant information hittades i kunskapsbasen.';
  }

  const contextParts: string[] = [
    'Relevant information från kunskapsbasen:',
    '',
  ];

  results.forEach((result, index) => {
    contextParts.push(`${index + 1}. ${result.content}`);
    if (result.similarity !== undefined) {
      contextParts.push(`   (Relevans: ${(result.similarity * 100).toFixed(1)}%)`);
    }
    contextParts.push('');
  });

  return contextParts.join('\n');
}

/**
 * Filter results by content type
 */
export function filterByContentType(
  results: RetrievalResult[],
  contentType: string
): RetrievalResult[] {
  return results.filter((r) => r.contentType === contentType);
}

/**
 * Get service recommendations based on query
 */
export async function getServiceRecommendations(
  query: string,
  clinicId: string,
  maxResults: number = 3
): Promise<RetrievalResult[]> {
  const allResults = await retrieveContext(query, clinicId, 10);
  
  // Filter for services only
  const serviceResults = filterByContentType(allResults, 'service');
  
  // Sort by similarity and price (prefer higher similarity, then lower price)
  return serviceResults
    .sort((a, b) => {
      if (Math.abs(a.similarity - b.similarity) > 0.1) {
        return b.similarity - a.similarity;
      }
      return (a.price || 999999) - (b.price || 999999);
    })
    .slice(0, maxResults);
}
