/**
 * Bokadirekt Automatic Sync — Cron Endpoint
 *
 * POST /api/cron/bokadirekt-sync
 *
 * Triggered by an external scheduler (Vercel Cron, GitHub Actions, etc.).
 * Finds all clinics with Bokadirekt integration enabled and runs a full sync
 * for each one.
 *
 * Security: Bearer token in Authorization header must match CRON_SECRET.
 *
 * Vercel function timeout: 5 minutes (maxDuration = 300).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5-minute Vercel timeout

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncAll, type SyncAllResult } from '@/lib/integrations/bokadirekt/sync';

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret is configured we reject all requests for safety
    console.error('[Bokadirekt Sync Cron] CRON_SECRET is not set — rejecting request');
    return false;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── POST — run sync ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    console.error('[Bokadirekt Sync Cron] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobStart = Date.now();
  console.log('[Bokadirekt Sync Cron] Job started');

  try {
    // Find all clinics that have the Bokadirekt integration enabled
    const clinics = await prisma.clinic.findMany({
      where: { bokadirektEnabled: true },
      select: { id: true, name: true, bokadirektApiKey: true },
    });

    if (clinics.length === 0) {
      console.log('[Bokadirekt Sync Cron] No clinics with Bokadirekt enabled. Nothing to do.');
      return NextResponse.json({
        success: true,
        message: 'No clinics with Bokadirekt enabled',
        clinicsSynced: 0,
        durationMs: Date.now() - jobStart,
      });
    }

    console.log(`[Bokadirekt Sync Cron] Syncing ${clinics.length} clinic(s)...`);

    const results: Array<{
      clinicId: string;
      clinicName: string;
      result: SyncAllResult | { error: string };
    }> = [];

    // Sync clinics sequentially to respect per-IP rate limits (10 req/min)
    for (const clinic of clinics) {
      try {
        console.log(`[Bokadirekt Sync Cron] Starting sync for clinic: ${clinic.name} (${clinic.id})`);
        const result = await syncAll(clinic.id);
        results.push({ clinicId: clinic.id, clinicName: clinic.name, result });
        console.log(
          `[Bokadirekt Sync Cron] Finished sync for ${clinic.name}: ` +
            `success=${result.overall.success}, ` +
            `durationMs=${result.overall.totalDurationMs}`
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Bokadirekt Sync Cron] Sync failed for clinic ${clinic.name}:`, err);
        results.push({
          clinicId: clinic.id,
          clinicName: clinic.name,
          result: { error: errorMsg },
        });
      }
    }

    const totalDurationMs = Date.now() - jobStart;
    const successCount = results.filter((r) => !('error' in r.result)).length;
    const failedCount = results.length - successCount;

    console.log(
      `[Bokadirekt Sync Cron] Job complete. ` +
        `${successCount}/${results.length} clinics synced successfully in ${totalDurationMs}ms`
    );

    // Build a clean summary for the response body
    const summary = results.map((r) => {
      if ('error' in r.result) {
        return {
          clinicId: r.clinicId,
          clinicName: r.clinicName,
          success: false,
          error: r.result.error,
        };
      }
      const res = r.result as SyncAllResult;
      return {
        clinicId: r.clinicId,
        clinicName: r.clinicName,
        success: res.overall.success,
        durationMs: res.overall.totalDurationMs,
        entities: {
          services:  { created: res.services.recordsCreated,  updated: res.services.recordsUpdated  },
          staff:     { created: res.staff.recordsCreated,     updated: res.staff.recordsUpdated     },
          customers: { created: res.customers.recordsCreated, updated: res.customers.recordsUpdated },
          bookings:  { created: res.bookings.recordsCreated,  updated: res.bookings.recordsUpdated  },
          sales:     { created: res.sales.recordsCreated,     updated: res.sales.recordsUpdated     },
        },
        errors: [
          res.services.error,
          res.staff.error,
          res.customers.error,
          res.bookings.error,
          res.sales.error,
        ].filter(Boolean),
      };
    });

    return NextResponse.json(
      {
        success: failedCount === 0,
        timestamp: new Date().toISOString(),
        clinicsSynced: successCount,
        clinicsFailed: failedCount,
        totalDurationMs,
        clinics: summary,
      },
      { status: failedCount > 0 && successCount === 0 ? 500 : 200 }
    );
  } catch (err) {
    console.error('[Bokadirekt Sync Cron] Unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed with an unexpected error',
        details: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - jobStart,
      },
      { status: 500 }
    );
  }
}

// ─── GET — health check ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return basic status and the number of enabled clinics
  const enabledCount = await prisma.clinic.count({
    where: { bokadirektEnabled: true },
  });

  // Find the most recent sync log for a quick status check
  const lastSync = await prisma.integrationSyncLog.findFirst({
    where: { source: 'bokadirekt' },
    orderBy: { startedAt: 'desc' },
    select: { startedAt: true, status: true, entity: true, clinicId: true },
  });

  return NextResponse.json({
    status: 'active',
    description: 'Bokadirekt full sync cron job',
    schedule: 'Configure in vercel.json or external scheduler',
    enabledClinics: enabledCount,
    lastSync: lastSync ?? null,
    timestamp: new Date().toISOString(),
  });
}
