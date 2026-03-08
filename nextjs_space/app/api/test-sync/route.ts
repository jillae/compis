// TEMPORARY: Test endpoint for Bokadirekt sync
// Remove after testing

import { NextResponse } from 'next/server';
import { syncAll, type SyncAllResult } from '@/lib/integrations/bokadirekt/sync';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Find first clinic with Bokadirekt enabled
    const clinic = await prisma.clinic.findFirst({
      where: { bokadirektEnabled: true },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'No clinic with Bokadirekt enabled' }, { status: 404 });
    }

    console.log(`[Test Sync] Starting sync for ${clinic.name} (${clinic.id})`);

    const result: SyncAllResult = await syncAll(clinic.id);

    return NextResponse.json({
      success: result.overall.success,
      clinicId: clinic.id,
      clinicName: clinic.name,
      durationMs: result.overall.totalDurationMs,
      hasErrors: result.overall.hasErrors,
      entities: {
        services: result.services,
        staff: result.staff,
        customers: result.customers,
        bookings: result.bookings,
        sales: result.sales,
      },
    });
  } catch (error) {
    console.error('[Test Sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
