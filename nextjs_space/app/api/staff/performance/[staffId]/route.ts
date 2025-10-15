
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StaffPerformanceCalculator } from '@/lib/staff-performance-calculator';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.staffId;

    // Get staff and verify access
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Verify user has access to this clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.clinicId !== staff.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get performance comparison
    const calculator = new StaffPerformanceCalculator(staff.clinicId!);
    const comparison = await calculator.getPerformanceComparison(staffId, 8);

    if (!comparison) {
      return NextResponse.json({ error: 'No performance data available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      staff,
      comparison,
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance' },
      { status: 500 }
    );
  }
}
