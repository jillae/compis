/**
 * Manual Bokadirekt Sync Trigger
 *
 * POST /api/integrations/bokadirekt/sync  — Trigger a full sync for the caller's clinic
 * GET  /api/integrations/bokadirekt/sync  — Return last sync logs for the clinic
 *
 * Protected by NextAuth session. Regular clinic users can only sync their own clinic.
 * SUPER_ADMIN may pass ?clinicId=<id> in the query string to target a specific clinic.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getAuthSession,
  getClinicFilter,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
} from '@/lib/multi-tenant-security';
import { syncAll, type SyncAllResult } from '@/lib/integrations/bokadirekt/sync';

// ─── POST — trigger sync ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    // Resolve which clinic to sync
    let clinicId: string;

    if (session.user.role === 'SUPER_ADMIN') {
      // Super admins may specify a target clinic via query param or request body
      const url = new URL(request.url);
      const qClinicId = url.searchParams.get('clinicId');

      let bodyClinicId: string | undefined;
      try {
        const body = await request.json();
        bodyClinicId = body?.clinicId;
      } catch {
        // Body may be empty — that's fine
      }

      const targetClinicId = qClinicId ?? bodyClinicId;

      if (targetClinicId) {
        // Validate the clinic exists
        const clinic = await prisma.clinic.findUnique({
          where: { id: targetClinicId },
          select: { id: true, bokadirektEnabled: true },
        });
        if (!clinic) {
          return NextResponse.json(
            { success: false, error: `Clinic ${targetClinicId} not found` },
            { status: 404 }
          );
        }
        clinicId = clinic.id;
      } else {
        // No specific clinic — use first enabled clinic
        const clinic = await prisma.clinic.findFirst({
          where: { bokadirektEnabled: true },
          select: { id: true },
        });
        if (!clinic) {
          return NextResponse.json(
            { success: false, error: 'No clinics with Bokadirekt enabled found' },
            { status: 404 }
          );
        }
        clinicId = clinic.id;
      }
    } else {
      // Regular users can only sync their own clinic
      const filter = getClinicFilter(session);
      if (!filter.clinicId) {
        return forbiddenResponse();
      }
      clinicId = filter.clinicId;
    }

    // Verify Bokadirekt is enabled for this clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, bokadirektEnabled: true },
    });

    if (!clinic?.bokadirektEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bokadirekt integration is not enabled for this clinic',
        },
        { status: 400 }
      );
    }

    console.log(
      `[Bokadirekt Sync] Manual sync triggered by ${session.user.email} for clinic ${clinic.name} (${clinicId})`
    );

    const result: SyncAllResult = await syncAll(clinicId);

    return NextResponse.json(
      {
        success: result.overall.success,
        clinicId,
        clinicName: clinic.name,
        durationMs: result.overall.totalDurationMs,
        hasErrors: result.overall.hasErrors,
        entities: {
          services: {
            found:   result.services.recordsFound,
            created: result.services.recordsCreated,
            updated: result.services.recordsUpdated,
            skipped: result.services.recordsSkipped,
            error:   result.services.error ?? null,
          },
          staff: {
            found:   result.staff.recordsFound,
            created: result.staff.recordsCreated,
            updated: result.staff.recordsUpdated,
            skipped: result.staff.recordsSkipped,
            error:   result.staff.error ?? null,
          },
          customers: {
            found:   result.customers.recordsFound,
            created: result.customers.recordsCreated,
            updated: result.customers.recordsUpdated,
            skipped: result.customers.recordsSkipped,
            error:   result.customers.error ?? null,
          },
          bookings: {
            found:   result.bookings.recordsFound,
            created: result.bookings.recordsCreated,
            updated: result.bookings.recordsUpdated,
            skipped: result.bookings.recordsSkipped,
            error:   result.bookings.error ?? null,
          },
          sales: {
            found:   result.sales.recordsFound,
            created: result.sales.recordsCreated,
            updated: result.sales.recordsUpdated,
            skipped: result.sales.recordsSkipped,
            error:   result.sales.error ?? null,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: result.overall.success ? 200 : 207 } // 207 Multi-Status on partial failure
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (err instanceof Error && err.message === 'User has no clinic assigned') {
      return forbiddenResponse();
    }
    return errorResponse(err, 'Bokadirekt sync failed');
  }
}

// ─── GET — last sync status ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const filter = getClinicFilter(session);

    // Build a where clause; SUPER_ADMIN without explicit clinicId sees all
    const whereClause = filter.clinicId
      ? { clinicId: filter.clinicId, source: 'bokadirekt' }
      : { source: 'bokadirekt' };

    // Recent logs — last 20 across all entities
    const logs = await prisma.integrationSyncLog.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        clinicId: true,
        entity: true,
        syncType: true,
        status: true,
        recordsFound: true,
        recordsCreated: true,
        recordsUpdated: true,
        recordsSkipped: true,
        error: true,
        startedAt: true,
        completedAt: true,
      },
    });

    // Last successful sync timestamp per entity
    const lastSuccessful = await prisma.integrationSyncLog.findMany({
      where: { ...whereClause, status: 'completed' },
      orderBy: { startedAt: 'desc' },
      distinct: ['entity'],
      select: {
        entity: true,
        startedAt: true,
        recordsCreated: true,
        recordsUpdated: true,
      },
    });

    return NextResponse.json({
      success: true,
      lastSuccessfulSyncs: lastSuccessful,
      recentLogs: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(err, 'Failed to retrieve sync status');
  }
}
