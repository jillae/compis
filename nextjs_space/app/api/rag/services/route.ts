
/**
 * RAG Services Recommendations API
 * Get service recommendations based on user query
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceRecommendations } from '@/lib/rag/retrieval';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, maxResults = 3 } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Get service recommendations
    const recommendations = await getServiceRecommendations(
      query,
      session.user.clinicId,
      maxResults
    );

    return NextResponse.json({
      query,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Service recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
