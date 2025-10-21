
/**
 * Bokadirekt Automatic Sync Cron Job
 * 
 * Schedule: Every hour (0 * * * *)
 * Purpose: Automatically sync bookings, customers, staff, services from Bokadirekt
 * 
 * Security: Requires CRON_SECRET in Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAll } from '@/lib/bokadirekt/sync-service';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON] Unauthorized Bokadirekt sync attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting automatic Bokadirekt sync...');
    const startTime = Date.now();

    // Run the sync
    const result = await syncAll();
    
    const duration = Date.now() - startTime;
    
    // Log results
    console.log('[CRON] Bokadirekt sync completed:', {
      success: result.overall.success,
      duration: `${duration}ms`,
      bookings: {
        fetched: result.bookings.recordsFetched,
        upserted: result.bookings.recordsUpserted,
      },
      customers: {
        fetched: result.customers.recordsFetched,
        upserted: result.customers.recordsUpserted,
      },
      staff: {
        fetched: result.staff.recordsFetched,
        upserted: result.staff.recordsUpserted,
      },
      services: {
        fetched: result.services.recordsFetched,
        upserted: result.services.recordsUpserted,
      },
      errors: result.overall.errors,
    });

    // Return detailed response
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        summary: {
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
          staffAvailabilities: result.staffAvailabilities ? {
            fetched: result.staffAvailabilities.recordsFetched,
            upserted: result.staffAvailabilities.recordsUpserted,
            duration: result.staffAvailabilities.duration,
          } : null,
        },
        totalDuration: result.overall.totalDuration,
        errors: result.overall.errors.length > 0 ? result.overall.errors : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CRON] Bokadirekt sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Bokadirekt sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (still requires auth)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Bokadirekt Sync Cron Job',
    schedule: 'Every hour (0 * * * *)',
    status: 'Active',
    nextRun: 'Top of the next hour',
  });
}
