
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/staff/leave?staffId=X&year=2025&status=PENDING
 * 
 * Get leave requests for staff
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
    const year = searchParams.get('year');
    const status = searchParams.get('status'); // Optional filter

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

    if (year) {
      const yearInt = parseInt(year);
      whereClause.startDate = {
        gte: new Date(`${yearInt}-01-01`),
        lte: new Date(`${yearInt}-12-31`),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const leaves = await prisma.staffLeave.findMany({
      where: whereClause,
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
      orderBy: {
        startDate: 'desc',
      },
    });

    // Calculate totals by leave type
    const totals: Record<string, number> = {};

    for (const leave of leaves) {
      if (leave.status === 'APPROVED') {
        if (!totals[leave.leaveType]) {
          totals[leave.leaveType] = 0;
        }
        totals[leave.leaveType] += leave.totalDays;
      }
    }

    return NextResponse.json({
      success: true,
      leaves,
      totals,
      total: leaves.length,
    });
  } catch (error: any) {
    console.error('[Staff Leave GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
