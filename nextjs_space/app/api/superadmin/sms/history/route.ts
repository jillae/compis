
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { elksClient } from '@/lib/46elks/client';

/**
 * GET /api/superadmin/sms/history
 * Fetch SMS history from 46elks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const history = await elksClient.getSMSHistory({ start, limit });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching SMS history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS history', details: error.message },
      { status: 500 }
    );
  }
}
