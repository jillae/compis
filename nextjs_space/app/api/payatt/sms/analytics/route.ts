
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Get SMS analytics and statistics for clinic
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d', 'all'

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // Beginning of time

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const where: any = {
      clinicId: session.user.clinicId,
      createdAt: { gte: startDate }
    };

    // Get overall stats
    const [
      totalSent,
      totalDelivered,
      totalFailed,
      totalBlocked,
      totalCost,
      campaignStats,
      dailyStats
    ] = await Promise.all([
      prisma.sMSLog.count({ where: { ...where, direction: 'outbound' } }),
      prisma.sMSLog.count({ where: { ...where, direction: 'outbound', status: 'delivered' } }),
      prisma.sMSLog.count({ where: { ...where, direction: 'outbound', status: 'failed' } }),
      prisma.sMSLog.count({ where: { ...where, direction: 'outbound', status: 'stopped' } }),
      prisma.sMSLog.aggregate({
        where: { ...where, direction: 'outbound', cost: { not: null } },
        _sum: { cost: true }
      }),
      // Campaign performance
      prisma.sMSCampaign.findMany({
        where: {
          clinicId: session.user.clinicId,
          sentAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          recipientCount: true,
          successCount: true,
          failedCount: true,
          totalCost: true,
          sentAt: true
        },
        orderBy: { sentAt: 'desc' },
        take: 10
      }),
      // Daily sending pattern
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM "SMSLog"
        WHERE clinic_id = ${session.user.clinicId}
          AND direction = 'outbound'
          AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const failureRate = totalSent > 0 ? (totalFailed / totalSent) * 100 : 0;
    const blockRate = totalSent > 0 ? (totalBlocked / totalSent) * 100 : 0;

    return NextResponse.json({
      success: true,
      period,
      overview: {
        totalSent,
        totalDelivered,
        totalFailed,
        totalBlocked,
        totalCost: totalCost._sum.cost || 0,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10,
        blockRate: Math.round(blockRate * 10) / 10
      },
      campaigns: campaignStats,
      dailyStats
    });

  } catch (error) {
    console.error('SMS analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS analytics' },
      { status: 500 }
    );
  }
}
