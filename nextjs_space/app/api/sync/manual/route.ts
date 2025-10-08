
import { NextRequest, NextResponse } from 'next/server';
import { syncAllData } from '@/lib/bokadirekt/sync';

export async function POST(request: NextRequest) {
  try {
    console.log('[Manual Sync] Starting manual sync...');
    
    const result = await syncAllData();
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Manual Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger manual sync',
    method: 'POST',
    endpoint: '/api/sync/manual',
  });
}
