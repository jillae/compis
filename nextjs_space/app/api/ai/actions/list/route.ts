
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    // Get filter params
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // Calculate week range
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // Build query
    const where: any = {
      clinicId: user.clinicId,
      weekStartDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    };

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    // Get actions
    const actions = await prisma.weeklyAction.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { expectedImpact: 'desc' },
      ],
    });

    // Calculate summary stats
    const stats = {
      total: actions.length,
      pending: actions.filter(a => a.status === 'PENDING').length,
      inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
      completed: actions.filter(a => a.status === 'COMPLETED').length,
      dismissed: actions.filter(a => a.status === 'DISMISSED').length,
      totalImpact: actions.reduce((sum, a) => sum + Number(a.expectedImpact), 0),
      potentialImpact: actions
        .filter(a => ['PENDING', 'IN_PROGRESS'].includes(a.status))
        .reduce((sum, a) => sum + Number(a.expectedImpact), 0),
    };

    return NextResponse.json({
      success: true,
      actions,
      stats,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
