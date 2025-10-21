
/**
 * BD Availability Sync Endpoint
 * 
 * POST /api/bokadirekt/sync-availabilities
 * 
 * Synkar personalens öppettider från Bokadirekt till Flow StaffSchedule
 * och vidare till Clockify om integration är aktiv.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllStaffAvailabilities, syncStaffAvailabilities } from '@/lib/bokadirekt/availability-sync';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Authentication & Authorization
    const session = await getAuthSession();
    
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { clinicId, startDate, endDate } = body;

    console.log('[API] BD Availability sync triggered by:', session.user.email);
    
    // Synka specifik klinik eller alla kliniker
    if (clinicId) {
      // Verify user has access to this clinic
      if (session.user.role !== 'SUPER_ADMIN' && session.user.clinicId !== clinicId) {
        return forbiddenResponse();
      }
      
      const result = await syncStaffAvailabilities(clinicId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      return NextResponse.json(
        {
          success: result.success,
          data: {
            clinicId,
            recordsFetched: result.recordsFetched,
            recordsUpserted: result.recordsUpserted,
            duration: result.duration,
          },
          errors: result.errors,
        },
        { status: 200 }
      );
    } else {
      // SuperAdmin kan synka alla kliniker
      if (session.user.role !== 'SUPER_ADMIN') {
        return forbiddenResponse();
      }
      
      const result = await syncAllStaffAvailabilities({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      return NextResponse.json(
        {
          success: result.overall.success,
          data: {
            clinics: result.clinics.map((c) => ({
              clinicId: c.clinicId,
              clinicName: c.clinicName,
              recordsFetched: c.result.recordsFetched,
              recordsUpserted: c.result.recordsUpserted,
              duration: c.result.duration,
              errors: c.result.errors,
            })),
            totalDuration: result.overall.totalDuration,
          },
          errors: result.overall.errors,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'BD availability sync failed');
  }
}
