
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * POST /api/staff/clock-in
 * 
 * Clock in (start time tracking)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { staffId, clinicId, timestamp } = body;

    if (!staffId || !clinicId) {
      return NextResponse.json(
        { success: false, error: 'staffId och clinicId krävs' },
        { status: 400 }
      );
    }

    // Verify staff belongs to clinic
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, clinicId },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Personal hittades inte' },
        { status: 404 }
      );
    }

    // Check if already clocked in
    const existingEntry = await prisma.staffTimeEntry.findFirst({
      where: {
        staffId,
        clinicId,
        clockOutAt: null, // Still clocked in
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Redan incheckad. Checka ut först.' },
        { status: 400 }
      );
    }

    const clockInTime = timestamp ? new Date(timestamp) : new Date();
    let clockifyTimeEntryId: string | undefined;

    // Try to sync with Clockify if integration exists
    const integration = await prisma.clockifyIntegration.findUnique({
      where: { clinicId },
    });

    if (integration && integration.isActive && staff.clockifyUserId) {
      try {
        const clockify = new ClockifyClient(integration.apiKey);
        
        const timeEntry = await clockify.createTimeEntry(
          integration.workspaceId,
          {
            start: clockInTime.toISOString(),
            description: 'Work shift',
            billable: true,
          }
        );

        clockifyTimeEntryId = timeEntry.id;
      } catch (err: any) {
        console.error('[Clockify Sync] Error creating time entry:', err);
        // Continue even if Clockify sync fails
      }
    }

    // Create time entry
    const timeEntry = await prisma.staffTimeEntry.create({
      data: {
        clinicId,
        staffId,
        clockInAt: clockInTime,
        clockifyTimeEntryId,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      timeEntry,
      clockInAt: clockInTime,
    });
  } catch (error: any) {
    console.error('[Clock In] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
