
// A/B Test Results API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getABTestResults } from '@/lib/ab-testing';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await getABTestResults(params.id);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Get AB test results error:', error);
    return NextResponse.json({ error: 'Failed to get results' }, { status: 500 });
  }
}
