
/**
 * Superadmin STT Provider Reorder API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerOrder } = await req.json();

    if (!Array.isArray(providerOrder) || providerOrder.length === 0) {
      return NextResponse.json({ error: 'Invalid provider order' }, { status: 400 });
    }

    // Update priority order for each provider
    for (const item of providerOrder) {
      await prisma.$executeRaw`
        UPDATE stt_provider_config 
        SET priority_order = ${item.priority_order}, updated_at = NOW()
        WHERE id = ${item.id}
      `;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[SA STT Reorder API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder providers' },
      { status: 500 }
    );
  }
}
