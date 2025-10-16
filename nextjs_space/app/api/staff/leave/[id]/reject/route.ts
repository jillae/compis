
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * PUT /api/staff/leave/[id]/reject
 * 
 * Reject a leave request (Admin only)
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Saknar behörighet' },
        { status: 403 }
      );
    }

    const leaveId = params.id;
    const body = await request.json();
    const { reason } = body;

    const leave = await prisma.staffLeave.findUnique({
      where: { id: leaveId },
      include: { staff: true },
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, error: 'Ledighetsansökan hittades inte' },
        { status: 404 }
      );
    }

    // Update leave status
    const updatedLeave = await prisma.staffLeave.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectReason: reason,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // TODO: Send notification SMS/email to staff

    return NextResponse.json({
      success: true,
      leave: updatedLeave,
    });
  } catch (error: any) {
    console.error('[Staff Leave Reject] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
