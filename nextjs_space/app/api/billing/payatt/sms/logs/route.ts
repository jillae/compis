
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Get SMS logs for clinic (with filters)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const direction = searchParams.get('direction'); // 'outbound' | 'inbound'
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      clinicId: session.user.clinicId
    };

    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (campaignId) where.campaignId = campaignId;

    const [logs, total] = await Promise.all([
      prisma.sMSLog.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          campaign: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.sMSLog.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('SMS logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS logs' },
      { status: 500 }
    );
  }
}
