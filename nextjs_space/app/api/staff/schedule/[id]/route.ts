
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * PUT /api/staff/schedule/[id]
 * 
 * Update a staff schedule/shift
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const scheduleId = params.id;
    const body = await request.json();
    const {
      startTime,
      endTime,
      breakMinutes,
      shiftType,
      status,
      notes,
    } = body;

    // Get existing schedule
    const existingSchedule = await prisma.staffSchedule.findUnique({
      where: { id: scheduleId },
      include: { staff: true },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schema hittades inte' },
        { status: 404 }
      );
    }

    // Update Clockify if integration exists
    if (existingSchedule.clockifyTimeEntryId) {
      const integration = await prisma.clockifyIntegration.findUnique({
        where: { clinicId: existingSchedule.clinicId },
      });

      if (integration && integration.isActive) {
        try {
          const clockify = new ClockifyClient(integration.apiKey);
          
          const updateData: any = {};
          if (startTime) updateData.start = new Date(startTime).toISOString();
          if (endTime) updateData.end = new Date(endTime).toISOString();
          if (notes) updateData.description = notes;

          if (Object.keys(updateData).length > 0) {
            await clockify.updateTimeEntry(
              integration.workspaceId,
              existingSchedule.clockifyTimeEntryId,
              updateData
            );
          }
        } catch (err: any) {
          console.error('[Clockify Sync] Error updating time entry:', err);
          // Continue even if Clockify sync fails
        }
      }
    }

    // Update schedule in database
    const updateFields: any = {};
    if (startTime) updateFields.startTime = new Date(startTime);
    if (endTime) updateFields.endTime = new Date(endTime);
    if (breakMinutes !== undefined) updateFields.breakMinutes = breakMinutes;
    if (shiftType) updateFields.shiftType = shiftType;
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const updatedSchedule = await prisma.staffSchedule.update({
      where: { id: scheduleId },
      data: updateFields,
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
      schedule: updatedSchedule,
    });
  } catch (error: any) {
    console.error('[Staff Schedule Update] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/schedule/[id]
 * 
 * Delete a staff schedule/shift
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const scheduleId = params.id;

    // Get existing schedule
    const existingSchedule = await prisma.staffSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schema hittades inte' },
        { status: 404 }
      );
    }

    // Delete from Clockify if integration exists
    if (existingSchedule.clockifyTimeEntryId) {
      const integration = await prisma.clockifyIntegration.findUnique({
        where: { clinicId: existingSchedule.clinicId },
      });

      if (integration && integration.isActive) {
        try {
          const clockify = new ClockifyClient(integration.apiKey);
          await clockify.deleteTimeEntry(
            integration.workspaceId,
            existingSchedule.clockifyTimeEntryId
          );
        } catch (err: any) {
          console.error('[Clockify Sync] Error deleting time entry:', err);
          // Continue even if Clockify sync fails
        }
      }
    }

    // Delete schedule from database
    await prisma.staffSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[Staff Schedule Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
