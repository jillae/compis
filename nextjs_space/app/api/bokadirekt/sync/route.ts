
// Manual sync trigger endpoint
import { NextRequest, NextResponse } from 'next/server';
import { syncAll } from '@/lib/bokadirekt/sync-service';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Authentication & Authorization - Only SuperAdmin can trigger sync
    const session = await getAuthSession();
    
    // TODO: Make sync clinic-specific instead of syncing all clinics
    if (session.user.role !== 'SUPER_ADMIN') {
      return forbiddenResponse();
    }

    console.log('[API] Manual Bokadirekt sync triggered by SuperAdmin:', session.user.email);
    
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
          staffAvailabilities: result.staffAvailabilities ? {
            fetched: result.staffAvailabilities.recordsFetched,
            upserted: result.staffAvailabilities.recordsUpserted,
            duration: result.staffAvailabilities.duration,
          } : null,
        },
        totalDuration: result.overall.totalDuration,
        errors: result.overall.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Bokadirekt sync failed');
  }
}
