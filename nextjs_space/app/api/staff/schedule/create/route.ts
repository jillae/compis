
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * POST /api/staff/schedule/create
 * 
 * Create a new staff schedule/shift
 * Optionally syncs with Clockify if integration is enabled
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      clinicId,
      staffId,
      shiftDate,
      startTime,
      endTime,
      breakMinutes = 30,
      shiftType = 'REGULAR',
      notes,
    } = body;

    if (!clinicId || !staffId || !shiftDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Alla obligatoriska fält krävs' },
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
            start: new Date(startTime).toISOString(),
            end: new Date(endTime).toISOString(),
            description: `${shiftType} shift${notes ? ': ' + notes : ''}`,
            billable: true,
          }
        );

        clockifyTimeEntryId = timeEntry.id;
      } catch (err: any) {
        console.error('[Clockify Sync] Error creating time entry:', err);
        // Continue even if Clockify sync fails
      }
    }

    // Create schedule in database
    const schedule = await prisma.staffSchedule.create({
      data: {
        clinicId,
        staffId,
        shiftDate: new Date(shiftDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        breakMinutes,
        shiftType,
        status: 'SCHEDULED',
        notes,
        clockifyTimeEntryId,
        createdBy: user.id,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
    });
  } catch (error: any) {
    console.error('[Staff Schedule Create] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
