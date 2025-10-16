
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * POST /api/staff/clock-out
 * 
 * Clock out (stop time tracking)
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
    const { staffId, timeEntryId, timestamp, breakMinutes = 0 } = body;

    if (!staffId || !timeEntryId) {
      return NextResponse.json(
        { success: false, error: 'staffId och timeEntryId krävs' },
        { status: 400 }
      );
    }

    // Get existing time entry
    const timeEntry = await prisma.staffTimeEntry.findUnique({
      where: { id: timeEntryId },
      include: { staff: true },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { success: false, error: 'Tidrapport hittades inte' },
        { status: 404 }
      );
    }

    if (timeEntry.clockOutAt) {
      return NextResponse.json(
        { success: false, error: 'Redan utcheckad' },
        { status: 400 }
      );
    }

    const clockOutTime = timestamp ? new Date(timestamp) : new Date();

    // Calculate total minutes
    const totalMinutes = Math.floor(
      (clockOutTime.getTime() - timeEntry.clockInAt.getTime()) / (1000 * 60)
    );
    const workMinutes = totalMinutes - breakMinutes;

    // Update Clockify if integration exists
    if (timeEntry.clockifyTimeEntryId) {
      const integration = await prisma.clockifyIntegration.findUnique({
        where: { clinicId: timeEntry.clinicId },
      });

      if (integration && integration.isActive) {
        try {
          const clockify = new ClockifyClient(integration.apiKey);
          
          await clockify.updateTimeEntry(
            integration.workspaceId,
            timeEntry.clockifyTimeEntryId,
            {
              end: clockOutTime.toISOString(),
            }
          );
        } catch (err: any) {
          console.error('[Clockify Sync] Error updating time entry:', err);
          // Continue even if Clockify sync fails
        }
      }
    }

    // Update time entry
    const updatedTimeEntry = await prisma.staffTimeEntry.update({
      where: { id: timeEntryId },
      data: {
        clockOutAt: clockOutTime,
        totalMinutes,
        breakMinutes,
        workMinutes,
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
      timeEntry: updatedTimeEntry,
      totalHours: (workMinutes / 60).toFixed(2),
      totalMinutes: workMinutes,
    });
  } catch (error: any) {
    console.error('[Clock Out] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
