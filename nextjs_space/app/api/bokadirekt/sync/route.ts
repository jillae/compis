
// Manual sync trigger endpoint
import { NextRequest, NextResponse } from 'next/server';
import { syncAll } from '@/lib/bokadirekt/sync-service';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Manual Bokadirekt sync triggered');
    
    const result = await syncAll();
    
    return NextResponse.json(
      {
        success: result.overall.success,
        data: {
          bookings: {
            fetched: result.bookings.recordsFetched,
            upserted: result.bookings.recordsUpserted,
            duration: result.bookings.duration,
          },
          customers: {
            fetched: result.customers.recordsFetched,
            upserted: result.customers.recordsUpserted,
            duration: result.customers.duration,
          },
          staff: {
            fetched: result.staff.recordsFetched,
            upserted: result.staff.recordsUpserted,
            duration: result.staff.duration,
          },
          services: {
            fetched: result.services.recordsFetched,
            upserted: result.services.recordsUpserted,
            duration: result.services.duration,
          },
        },
        totalDuration: result.overall.totalDuration,
        errors: result.overall.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
