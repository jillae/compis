
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/superadmin/sms/logs
 * Get SMS logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get('clinicId');
    const status = searchParams.get('status');
    const direction = searchParams.get('direction');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;
    if (status) where.status = status;
    if (direction) where.direction = direction;

    const logs = await prisma.sMSLog.findMany({
      where,
      include: {
        clinic: {
          select: { name: true }
        },
        customer: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Calculate totals
    const totalLogs = await prisma.sMSLog.count({ where });
    const totalCost = await prisma.sMSLog.aggregate({
      where,
      _sum: { cost: true }
    });

    return NextResponse.json({
      logs,
      total: totalLogs,
      totalCost: totalCost._sum.cost || 0
    });
  } catch (error: any) {
    console.error('Error fetching SMS logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS logs', details: error.message },
      { status: 500 }
    );
  }
}
