
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/staff/leave/request
 * 
 * Request leave/vacation
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
      leaveType,
      startDate,
      endDate,
      reason,
    } = body;

    if (!clinicId || !staffId || !leaveType || !startDate || !endDate) {
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

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    // Create leave request
    const leave = await prisma.staffLeave.create({
      data: {
        clinicId,
        staffId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: diffDays,
        reason,
        status: 'PENDING',
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

    // TODO: Send notification to admin for approval
    // Could use SMS via 46elks or email

    return NextResponse.json({
      success: true,
      leave,
    });
  } catch (error: any) {
    console.error('[Staff Leave Request] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
