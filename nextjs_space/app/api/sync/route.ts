
import { NextRequest, NextResponse } from 'next/server';
import { syncAll } from '@/lib/bokadirekt/sync-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// API Route for syncing Bokadirekt data
// Can be called manually or via cron job
export async function POST(request: NextRequest) {
  try {
    // Optional: Check authentication
    const session = await getServerSession(authOptions);
    
    // For cron jobs, we can use a secret token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    const isAuthenticated = session || (cronSecret && authHeader === `Bearer ${cronSecret}`);
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /sync] Starting sync process...');
    const startTime = Date.now();

    // Run full sync
    const result = await syncAll();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: result.overall.success,
      duration,
      results: {
        bookings: {
          fetched: result.bookings.recordsFetched,
          upserted: result.bookings.recordsUpserted,
          errors: result.bookings.errors,
        },
        customers: {
          fetched: result.customers.recordsFetched,
          upserted: result.customers.recordsUpserted,
          errors: result.customers.errors,
        },
        staff: {
          fetched: result.staff.recordsFetched,
          upserted: result.staff.recordsUpserted,
          errors: result.staff.errors,
        },
        services: {
          fetched: result.services.recordsFetched,
          upserted: result.services.recordsUpserted,
          errors: result.services.errors,
        },
        sales: {
          fetched: result.sales.recordsFetched,
          upserted: result.sales.recordsUpserted,
          errors: result.sales.errors,
        },
      },
      errors: result.overall.errors,
    });
  } catch (error) {
    console.error('[API /sync] Sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return basic sync status
    return NextResponse.json({
      success: true,
      message: 'Sync endpoint is ready',
      endpoints: {
        manual: 'POST /api/sync',
        cron: 'Use CRON_SECRET bearer token for automated syncs',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}
