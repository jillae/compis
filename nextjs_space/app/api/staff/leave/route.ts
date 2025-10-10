
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaves = await prisma.staffLeave.findMany({
      include: {
        staff: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ success: true, leaves });
  } catch (error) {
    console.error('[Staff Leave API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { staffId, startDate, endDate, leaveType, reason } = body;

    const leave = await prisma.staffLeave.create({
      data: {
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType,
        reason,
        status: 'APPROVED', // Auto-approve for now
      },
      include: {
        staff: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error('[Staff Leave API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
