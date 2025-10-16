
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/staff/schedule?clinicId=X&startDate=2025-10-16&endDate=2025-10-22
 * 
 * Get schedules for all staff in a date range
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId'); // Optional: filter by specific staff

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'clinicId, startDate och endDate krävs' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      clinicId,
      shiftDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const schedules = await prisma.staffSchedule.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            specialization: true,
          },
        },
      },
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Group by staff
    const staffSchedules: Record<string, any> = {};

    for (const schedule of schedules) {
      const staffId = schedule.staff.id;
      
      if (!staffSchedules[staffId]) {
        staffSchedules[staffId] = {
          staffId,
          staffName: schedule.staff.name,
          staffEmail: schedule.staff.email,
          role: schedule.staff.role,
          specialization: schedule.staff.specialization,
          shifts: [],
        };
      }

      staffSchedules[staffId].shifts.push({
        id: schedule.id,
        shiftDate: schedule.shiftDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        breakMinutes: schedule.breakMinutes,
        shiftType: schedule.shiftType,
        status: schedule.status,
        notes: schedule.notes,
        clockifyTimeEntryId: schedule.clockifyTimeEntryId,
      });
    }

    return NextResponse.json({
      success: true,
      schedules: Object.values(staffSchedules),
      total: schedules.length,
    });
  } catch (error: any) {
    console.error('[Staff Schedule GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
