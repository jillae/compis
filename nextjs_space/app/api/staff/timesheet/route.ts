
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/staff/timesheet?staffId=X&month=2025-10
 * 
 * Get timesheet for staff for a given month
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
    const staffId = searchParams.get('staffId');
    const clinicId = searchParams.get('clinicId');
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId krävs' },
        { status: 400 }
      );
    }

    const whereClause: any = { clinicId };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month

      whereClause.clockInAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const timeEntries = await prisma.staffTimeEntry.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        clockInAt: 'desc',
      },
    });

    // Calculate totals
    let totalMinutes = 0;
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let overtimeMinutes = 0;

    for (const entry of timeEntries) {
      if (entry.totalMinutes) {
        totalMinutes += entry.totalMinutes;
      }
      if (entry.workMinutes) {
        totalWorkMinutes += entry.workMinutes;
      }
      if (entry.breakMinutes) {
        totalBreakMinutes += entry.breakMinutes;
      }
    }

    const totalHours = (totalWorkMinutes / 60).toFixed(2);

    // Calculate overtime (assuming 40-hour workweek = 160 hours/month)
    const standardMonthlyMinutes = 160 * 60; // 9600 minutes
    if (totalWorkMinutes > standardMonthlyMinutes) {
      overtimeMinutes = totalWorkMinutes - standardMonthlyMinutes;
    }

    return NextResponse.json({
      success: true,
      entries: timeEntries,
      total: timeEntries.length,
      summary: {
        totalHours: parseFloat(totalHours),
        totalMinutes: totalWorkMinutes,
        breakMinutes: totalBreakMinutes,
        overtimeHours: (overtimeMinutes / 60).toFixed(2),
        overtimeMinutes,
      },
    });
  } catch (error: any) {
    console.error('[Timesheet GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
