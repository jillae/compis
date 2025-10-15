
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/superadmin/sms/campaigns
 * List all SMS campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get('clinicId');

    const campaigns = await prisma.sMSCampaign.findMany({
      where: clinicId ? { clinicId } : undefined,
      include: {
        clinic: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/sms/campaigns
 * Create new SMS campaign
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clinicId, 
      name, 
      message, 
      templateId,
      segmentType,
      scheduledAt 
    } = body;

    if (!clinicId || !name || !message) {
      return NextResponse.json({ 
        error: 'clinicId, name, and message are required' 
      }, { status: 400 });
    }

    // Count recipients
    let recipientCount = 0;
    if (segmentType) {
      let where: any = { clinicId };

      switch (segmentType) {
        case 'vip':
          where.totalVisits = { gte: 10 };
          break;
        case 'active':
          where.lastVisit = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'inactive':
          where.lastVisit = { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'new':
          where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
          break;
      }

      recipientCount = await prisma.customer.count({ where });
    }

    const campaign = await prisma.sMSCampaign.create({
      data: {
        clinicId,
        name,
        message,
        templateId,
        recipientCount,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null
      }
    });

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error.message },
      { status: 500 }
    );
  }
}
