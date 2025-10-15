
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { smsService } from '@/lib/sms/sms-service';
import { prisma } from '@/lib/db';

/**
 * POST /api/superadmin/sms/send-manual
 * Send manual SMS to customers
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
      recipients, 
      message, 
      scheduledAt, 
      category = 'manual',
      segmentType 
    } = body;

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Get recipients based on type
    let phoneNumbers: string[] = [];

    if (segmentType) {
      // Get customers from segment
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
        default:
          // 'all' or custom
          break;
      }

      const customers = await prisma.customer.findMany({
        where,
        select: { phone: true }
      });

      phoneNumbers = customers
        .filter(c => c.phone)
        .map(c => c.phone as string);
    } else if (recipients) {
      phoneNumbers = Array.isArray(recipients) ? recipients : [recipients];
    } else {
      return NextResponse.json({ error: 'recipients or segmentType is required' }, { status: 400 });
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Check if scheduled or send now
    if (scheduledAt) {
      // Create campaign for scheduled send
      const campaign = await prisma.sMSCampaign.create({
        data: {
          clinicId,
          name: `Manual SMS - ${new Date().toISOString()}`,
          message,
          recipientCount: phoneNumbers.length,
          scheduledAt: new Date(scheduledAt)
        }
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        campaignId: campaign.id,
        recipientCount: phoneNumbers.length,
        scheduledAt
      });
    }

    // Send immediately
    const result = await smsService.sendBulk(
      phoneNumbers,
      message,
      undefined, // from (use default)
      {
        clinicId,
        category: 'marketing' // Manual SMS treated as marketing
      }
    );

    return NextResponse.json({
      success: true,
      scheduled: false,
      recipientCount: phoneNumbers.length,
      ...result
    });
  } catch (error: any) {
    console.error('Error sending manual SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error.message },
      { status: 500 }
    );
  }
}
