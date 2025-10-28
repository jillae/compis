
// A/B Test Event Tracking API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trackABTestEvent } from '@/lib/ab-testing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, variant, eventType, eventData } = body;

    if (!testId || !variant || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get or generate session ID from cookie
    const sessionId = request.cookies.get('ab_session_id')?.value || generateSessionId();

    await trackABTestEvent({
      testId,
      variant,
      eventType,
      userId,
      sessionId,
      eventData,
    });

    // Set session ID cookie if not exists
    const response = NextResponse.json({ success: true });
    if (!request.cookies.get('ab_session_id')) {
      response.cookies.set('ab_session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });
    }

    return response;
  } catch (error) {
    console.error('Track AB test event error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
