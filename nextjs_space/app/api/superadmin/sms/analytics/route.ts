
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/superadmin/sms/analytics
 * Get SMS analytics and trends
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get('clinicId');
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate }
    };
    if (clinicId) where.clinicId = clinicId;

    // Get daily stats
    const dailyStats = await prisma.$queryRaw<Array<{
      date: Date;
      total: bigint;
      sent: bigint;
      delivered: bigint;
      failed: bigint;
      cost: number;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(cost), 0) as cost
      FROM "SMSLog"
      WHERE created_at >= ${startDate}
        ${clinicId ? prisma.$queryRawUnsafe('AND clinic_id = $1', clinicId) : prisma.$queryRawUnsafe('')}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get overview stats
    const overview = await prisma.sMSLog.aggregate({
      where,
      _count: { id: true },
      _sum: { cost: true }
    });

    const statusBreakdown = await prisma.sMSLog.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    });

    // Get rate limit status for each clinic
    const rateLimits = await prisma.sMSRateLimit.findMany({
      where: clinicId ? { clinicId } : undefined,
      include: {
        clinic: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalSMS: Number(overview._count.id),
        totalCost: overview._sum.cost || 0,
        averageCost: overview._count.id ? (overview._sum.cost || 0) / overview._count.id : 0
      },
      statusBreakdown,
      dailyStats: dailyStats.map(stat => ({
        date: stat.date,
        total: Number(stat.total),
        sent: Number(stat.sent),
        delivered: Number(stat.delivered),
        failed: Number(stat.failed),
        cost: stat.cost
      })),
      rateLimits: rateLimits.map(rl => ({
        clinicId: rl.clinicId,
        clinicName: rl.clinic.name,
        usage: {
          hour: `${rl.sentThisHour}/${rl.maxPerHour}`,
          day: `${rl.sentToday}/${rl.maxPerDay}`,
          month: `${rl.sentThisMonth}/${rl.maxPerMonth}`
        },
        budget: {
          limit: rl.budgetSEK,
          spent: rl.spentThisMonth,
          remaining: rl.budgetSEK ? rl.budgetSEK - rl.spentThisMonth : null
        }
      }))
    });
  } catch (error: any) {
    console.error('Error fetching SMS analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
