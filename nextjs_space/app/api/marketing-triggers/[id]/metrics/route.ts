
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTriggerMetrics } from '@/lib/marketing-triggers';

export const dynamic = 'force-dynamic';

// GET /api/marketing-triggers/:id/metrics - Get trigger performance metrics
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Verify trigger belongs to clinic
    const trigger = await prisma.marketingTrigger.findFirst({
      where: {
        id: params.id,
        clinicId: user.clinicId,
      },
    });

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const detailed = searchParams.get('detailed') === 'true';

    const metrics = await getTriggerMetrics(params.id, days);

    if (!detailed) {
      return NextResponse.json({ metrics });
    }

    // Detailed mode: also return executions over time and recent executions
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Executions over time (grouped by day)
    const allExecutions = await prisma.triggerExecution.findMany({
      where: {
        triggerId: params.id,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        status: true,
        costSEK: true,
        revenueSEK: true,
        skippedReason: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group executions by day for chart
    const executionsByDay: Record<string, { date: string; sent: number; skipped: number; failed: number; revenue: number }> = {};

    for (const exec of allExecutions) {
      const dateKey = exec.createdAt.toISOString().split('T')[0];
      if (!executionsByDay[dateKey]) {
        executionsByDay[dateKey] = { date: dateKey, sent: 0, skipped: 0, failed: 0, revenue: 0 };
      }
      if (exec.status === 'sent') {
        executionsByDay[dateKey].sent += 1;
        executionsByDay[dateKey].revenue += exec.revenueSEK || 0;
      } else if (exec.status === 'skipped') {
        executionsByDay[dateKey].skipped += 1;
      } else if (exec.status === 'failed') {
        executionsByDay[dateKey].failed += 1;
      }
    }

    // Fill in missing days with zeros
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData.push(executionsByDay[key] || { date: key, sent: 0, skipped: 0, failed: 0, revenue: 0 });
    }

    // Recent 20 executions
    const recentExecutions = allExecutions.slice(0, 20).map(exec => ({
      id: exec.id,
      customerName: exec.customer.name || `${exec.customer.firstName || ''} ${exec.customer.lastName || ''}`.trim() || exec.customer.email || 'Okänd kund',
      customerId: exec.customer.id,
      status: exec.status,
      skippedReason: exec.skippedReason,
      costSEK: exec.costSEK,
      revenueSEK: exec.revenueSEK,
      createdAt: exec.createdAt.toISOString(),
    }));

    return NextResponse.json({
      metrics,
      trigger: {
        id: trigger.id,
        name: trigger.name,
        description: trigger.description,
        triggerType: trigger.triggerType,
        channel: trigger.channel,
        isActive: trigger.isActive,
        totalExecutions: trigger.totalExecutions,
        successfulSends: trigger.successfulSends,
        failedSends: trigger.failedSends,
        totalCostSEK: trigger.totalCostSEK,
        totalRevenueSEK: trigger.totalRevenueSEK,
        averageROAS: trigger.averageROAS,
      },
      dailyData,
      recentExecutions,
    });
  } catch (error) {
    console.error('Error fetching trigger metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trigger metrics' },
      { status: 500 }
    );
  }
}
