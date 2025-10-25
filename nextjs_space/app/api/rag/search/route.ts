
/**
 * RAG Search API
 * Semantic search endpoint for knowledge base
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { retrieveContext, buildContextPrompt } from '@/lib/rag/retrieval';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, topK = 5, contentType } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Retrieve relevant context
    const results = await retrieveContext(query, session.user.clinicId, topK);

    // Filter by content type if specified
    const filteredResults = contentType
      ? results.filter((r) => r.contentType === contentType)
      : results;

    // Build context prompt for AI
    const contextPrompt = buildContextPrompt(filteredResults);

    return NextResponse.json({
      query,
      results: filteredResults,
      contextPrompt,
      count: filteredResults.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
