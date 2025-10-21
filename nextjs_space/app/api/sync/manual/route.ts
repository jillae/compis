
import { NextRequest, NextResponse } from 'next/server';
import { syncAllData } from '@/lib/bokadirekt/sync';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Authentication & Authorization - Only SuperAdmin can trigger manual sync
    const session = await getAuthSession();
    
    if (session.user.role !== 'SUPER_ADMIN') {
      return forbiddenResponse();
    }

    console.log('[Manual Sync] Starting manual sync by SuperAdmin:', session.user.email);
    
    const result = await syncAllData();
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Manual sync failed');
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger manual sync',
    method: 'POST',
    endpoint: '/api/sync/manual',
  });
}
