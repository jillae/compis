
/**
 * AI Scheduling Recommendations API
 * 
 * GET /api/staff/schedule/recommendations?clinicId=X&weekStart=2025-10-20
 * 
 * Get AI-powered scheduling recommendations for a specific week
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';
import { generateWeeklyRecommendations } from '@/lib/staff/ai-scheduling';
import { startOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authentication & Authorization
    const session = await getAuthSession();

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const weekStartStr = searchParams.get('weekStart');

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this clinic
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clinicId !== clinicId) {
      return forbiddenResponse();
    }

    // Parse week start date (default to current week)
    const weekStart = weekStartStr
      ? new Date(weekStartStr)
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    console.log('[API] Generating AI scheduling recommendations for clinic:', clinicId, 'Week:', weekStart);

    // Generate recommendations
    const recommendations = await generateWeeklyRecommendations(clinicId, weekStart);

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to generate scheduling recommendations');
  }
}
