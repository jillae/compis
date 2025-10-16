
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInsightsForClinic } from '@/lib/revenue-intelligence';
import { InsightPeriod } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'WEEKLY') as InsightPeriod;
    const generate = searchParams.get('generate') === 'true';

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true, role: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Generate new insights if requested
    if (generate) {
      await generateInsightsForClinic(user.clinicId);
    }

    // Get insights for the period
    const insights = await prisma.revenueInsight.findMany({
      where: {
        clinicId: user.clinicId,
        period,
      },
      orderBy: { startDate: 'desc' },
      take: 12, // Last 12 periods
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching revenue insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue insights' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true, role: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Generate insights for all periods
    const results = await generateInsightsForClinic(user.clinicId);

    return NextResponse.json({
      success: true,
      message: 'Revenue insights generated successfully',
      results,
    });
  } catch (error) {
    console.error('Error generating revenue insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate revenue insights' },
      { status: 500 }
    );
  }
}
