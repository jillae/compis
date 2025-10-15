
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { elksClient } from '@/lib/46elks/client';

/**
 * GET /api/superadmin/sms/delivery-report?messageId=xxx
 * Get delivery report for specific SMS
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const report = await elksClient.getDeliveryReport(messageId);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching delivery report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery report', details: error.message },
      { status: 500 }
    );
  }
}
