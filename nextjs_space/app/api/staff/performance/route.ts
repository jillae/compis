
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StaffPerformanceCalculator } from '@/lib/staff-performance-calculator';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');
    const staffId = searchParams.get('staffId');

    // Calculate and save performance
    const calculator = new StaffPerformanceCalculator(user.clinicId);
    await calculator.saveWeeklyPerformance(weekOffset);

    // Get performances
    let performances;
    if (staffId) {
      // Get specific staff member's performance
      const comparison = await calculator.getPerformanceComparison(staffId, 8);
      performances = comparison ? [comparison.current] : [];
    } else {
      // Get all staff performances
      const metrics = await calculator.calculateWeeklyPerformance(weekOffset);
      performances = metrics;
    }

    return NextResponse.json({
      success: true,
      performances,
    });
  } catch (error) {
    console.error('Error calculating staff performance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate performance' },
      { status: 500 }
    );
  }
}
